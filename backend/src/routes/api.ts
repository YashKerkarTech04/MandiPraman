import { Router } from "express"
import { z } from "zod"
import { CROPS, MANDIS, cropBySlug, mandiBySlug } from "../catalog"
import { config } from "../config"
import { account, EXPLORER_URL, publicClient } from "../lib/arkiv"
import { cached } from "../lib/cache"
import { HttpError } from "../lib/errors"
import { VERDICTS } from "../lib/schema"
import { median, round2 } from "../lib/stats"
import { createReport, createVote, listReports } from "../lib/store"

export const api = Router()

const READ_TTL_MS = 5_000
const slug = z.string().regex(/^[a-z0-9_]{2,40}$/)
const pseudonym = z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, "reporterId must be 8-64 chars: letters, digits, - or _")

// ---- meta ----
api.get("/health", (_req, res) => res.json({ ok: true }))

api.get("/meta", async (_req, res) => {
  res.json({
    network: "tiramisu",
    chainId: publicClient.chain?.id,
    relayerAddress: account.address,
    explorer: EXPLORER_URL,
    explorerAddress: `${EXPLORER_URL}/address/${account.address}`,
    projectId: config.PROJECT_ID,
    reportTtlHours: config.REPORT_TTL_HOURS,
  })
})

api.get("/catalog", (_req, res) => res.json({ crops: CROPS, mandis: MANDIS }))

// ---- reports ----
const listQuery = z.object({
  crop: slug.optional(),
  mandi: slug.optional(),
  state: slug.optional(),
  hours: z.coerce.number().positive().max(config.REPORT_TTL_HOURS).optional(),
})

api.get("/reports", async (req, res) => {
  const q = listQuery.parse(req.query)
  const sinceMs = q.hours ? Date.now() - q.hours * 3_600_000 : undefined
  // sinceMs changes every call, so cache on the stable parts only
  const cacheKey = `reports:${q.crop ?? ""}:${q.mandi ?? ""}:${q.state ?? ""}:${q.hours ?? ""}`
  const data = await cached(cacheKey, READ_TTL_MS, () =>
    listReports({ crop: q.crop, mandi: q.mandi, state: q.state, sinceMs }),
  )
  res.json(data)
})

const newReportBody = z.object({
  crop: slug,
  mandi: slug,
  pricePerQuintal: z.number().min(50).max(500_000),
  variety: z.string().trim().max(60).default(""),
  reporterId: pseudonym,
})

api.post("/reports", async (req, res) => {
  const body = newReportBody.parse(req.body)
  const crop = cropBySlug(body.crop)
  const mandi = mandiBySlug(body.mandi)
  if (!crop) throw new HttpError(400, `Unknown crop "${body.crop}"`)
  if (!mandi) throw new HttpError(400, `Unknown mandi "${body.mandi}"`)

  const created = await createReport({
    crop: crop.slug,
    cropName: crop.en,
    mandi: mandi.slug,
    mandiName: mandi.en,
    state: mandi.state,
    pricePerQuintal: round2(body.pricePerQuintal),
    variety: body.variety,
    reporterId: body.reporterId,
  })
  res.status(201).json({ ...created, explorerTx: `${EXPLORER_URL}/tx/${created.txHash}` })
})

const voteBody = z.object({
  verdict: z.enum(VERDICTS),
  voterId: pseudonym,
})

api.post("/reports/:key/votes", async (req, res) => {
  const reportKey = z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/)
    .parse(req.params.key) as `0x${string}`
  const body = voteBody.parse(req.body)
  const created = await createVote(reportKey, body.verdict, body.voterId)
  res.status(201).json({ ...created, explorerTx: `${EXPLORER_URL}/tx/${created.txHash}` })
})

// ---- prices: median per crop + mandi over the last N hours (trusted reports only) ----
const priceQuery = z.object({
  crop: slug.optional(),
  state: slug.optional(),
  hours: z.coerce.number().positive().max(config.REPORT_TTL_HOURS).default(48),
})

api.get("/prices", async (req, res) => {
  const q = priceQuery.parse(req.query)
  const data = await cached(`prices:${q.crop ?? ""}:${q.state ?? ""}:${q.hours}`, READ_TTL_MS, async () => {
    const { reports, blockNumber } = await listReports({
      crop: q.crop,
      state: q.state,
      sinceMs: Date.now() - q.hours * 3_600_000,
    })

    const groups = new Map<string, typeof reports>()
    for (const r of reports) {
      if (!r.trusted) continue
      const k = `${r.crop}|${r.mandi}`
      groups.set(k, [...(groups.get(k) ?? []), r])
    }

    const prices = [...groups.values()].map((rows) => {
      const values = rows.map((r) => r.pricePerQuintal)
      const latest = rows[0] // listReports sorts newest first
      return {
        crop: latest.crop,
        mandi: latest.mandi,
        state: latest.state,
        medianPricePerQuintal: round2(median(values) ?? 0),
        minPricePerQuintal: Math.min(...values),
        maxPricePerQuintal: Math.max(...values),
        reportCount: rows.length,
        confirmedCount: rows.filter((r) => r.confirmations > 0).length,
        latestReportedAtMs: latest.reportedAtMs,
      }
    })
    prices.sort((a, b) => a.crop.localeCompare(b.crop) || b.medianPricePerQuintal - a.medianPricePerQuintal)
    return { windowHours: q.hours, prices, blockNumber }
  })
  res.json(data)
})
