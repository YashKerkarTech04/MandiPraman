// Seeds SYNTHETIC demo data (clearly flagged synthetic=true) so the app is not empty.
// Everything is created in batches (one transaction per batch) to avoid nonce collisions.
// Usage: npm run seed
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk"
import { key as keyAttr, str, u64 } from "@arkiv-network/sdk/attr"
import { config } from "../src/config"
import { MANDIS, cropBySlug } from "../src/catalog"
import { EXPLORER_URL, walletClient } from "../src/lib/arkiv"
import { reportCreateParams } from "../src/lib/store"
import { TYPE_VOTE } from "../src/lib/schema"

// Rough, invented base prices in INR per quintal. Demo data only, not real market prices.
const BASE: Record<string, number> = {
  onion: 1800, tomato: 1500, potato: 1400, wheat: 2500, soybean: 4600, cotton: 7000, tur: 7500, rice: 3200,
}
const FEATURED: [string, string[]][] = [
  ["onion", ["lasalgaon", "pimpalgaon", "nashik", "pune", "vashi"]],
  ["tomato", ["nashik", "pune", "vashi", "nagpur"]],
  ["soybean", ["latur", "indore", "nagpur"]],
  ["wheat", ["indore", "rajkot", "azadpur"]],
  ["cotton", ["nagpur", "latur", "rajkot"]],
  ["potato", ["pune", "vashi", "azadpur"]],
]

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]

async function main() {
  const reports = []
  for (const [cropSlug, mandiSlugs] of FEATURED) {
    const crop = cropBySlug(cropSlug)!
    for (const mandiSlug of mandiSlugs) {
      const mandi = MANDIS.find((m) => m.slug === mandiSlug)!
      for (let i = 0; i < 3; i++) {
        const price = Math.round(BASE[cropSlug] * rand(0.9, 1.12))
        reports.push(
          reportCreateParams({
            crop: crop.slug,
            cropName: crop.en,
            mandi: mandi.slug,
            mandiName: mandi.en,
            state: mandi.state,
            pricePerQuintal: price,
            variety: pick(["", "Grade A", "Grade B", "Local"]),
            reporterId: `demo_farmer_${String(Math.floor(rand(1, 40))).padStart(2, "0")}`,
            synthetic: true,
          }),
        )
      }
    }
  }

  console.log(`Creating ${reports.length} synthetic reports in batches...`)
  const createdKeys: `0x${string}`[] = []
  const CHUNK = 20
  for (let i = 0; i < reports.length; i += CHUNK) {
    const result = await walletClient.executeBatch({ creates: reports.slice(i, i + CHUNK) })
    createdKeys.push(...(result.createdEntities as `0x${string}`[]))
    console.log(`  batch ${i / CHUNK + 1}: ${EXPLORER_URL}/tx/${result.txHash}`)
  }

  // A few confirmations so the "confirmed" badge and trust logic are visible in the UI.
  const votes = createdKeys
    .filter(() => Math.random() < 0.5)
    .map((reportKey, n) => ({
      payload: jsonToPayload({}),
      contentType: "application/json",
      attributes: {
        project: str(config.PROJECT_ID),
        type: str(TYPE_VOTE),
        report_key: keyAttr(reportKey),
        verdict: str("confirm"),
        voter: str(`demo_voter_${String(n).padStart(3, "0")}`),
        voted_at_ms: u64(Date.now()),
      },
      expires: ExpirationTime.fromHours(config.REPORT_TTL_HOURS),
    }))

  for (let i = 0; i < votes.length; i += CHUNK) {
    const result = await walletClient.executeBatch({ creates: votes.slice(i, i + CHUNK) })
    console.log(`  votes batch ${i / CHUNK + 1}: ${EXPLORER_URL}/tx/${result.txHash}`)
  }
  console.log(`\nDone: ${createdKeys.length} reports, ${votes.length} confirmations (all synthetic).`)
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exit(1)
})
