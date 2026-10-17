// Runs small experiments against Tiramisu and prints the EXACT results, so you can paste them
// into arkiv/friction.md as specific, reproducible findings. Costs one tiny write (a few cents of GLM).
// Usage: npm run probe
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk"
import { dec, i32, str, u64 } from "@arkiv-network/sdk/attr"
import { eq, exists, ne } from "@arkiv-network/sdk/query"
import { config } from "../src/config"
import { publicClient, walletClient } from "../src/lib/arkiv"

const project = `${config.PROJECT_ID}_probe`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function describe(err: unknown): string {
  if (!(err instanceof Error)) return String(err)
  const extra = err as Error & { kind?: string; code?: number }
  const head = `${err.constructor.name}${extra.kind ? ` kind=${extra.kind}` : ""}${extra.code ? ` code=${extra.code}` : ""}`
  return `${head}: ${err.message.split("\n").slice(0, 4).join(" | ")}`
}

async function attempt(label: string, fn: () => Promise<unknown>) {
  try {
    const out = await fn()
    console.log(`  OK    ${label}${out === undefined ? "" : " -> " + JSON.stringify(out)}`)
  } catch (err) {
    console.log(`  ERROR ${label}\n        ${describe(err)}`)
  }
}

async function count(...preds: Parameters<ReturnType<typeof publicClient.select>["where"]>) {
  const page = await publicClient
    .select({ key: true })
    .where(eq("project", str(project)), ...preds)
    .fetch()
  return page.entities.length
}

async function main() {
  console.log(`SDK probe on Tiramisu, project tag: ${project}\n`)

  console.log("[1] What type does a BARE value become? (docs say always wrap in a constructor)")
  const { entityKey } = await walletClient.createEntity({
    payload: jsonToPayload({ probe: true }),
    contentType: "application/json",
    attributes: {
      project: str(project),
      bare_text: "hello" as never, // bare string
      bare_num: 5 as never, // bare number
      typed_text: str("hello"),
    },
    expires: ExpirationTime.fromMinutes(10),
  })
  console.log("  created", entityKey)
  await sleep(4000)
  const stored = await publicClient.getEntity(entityKey)
  console.log("  stored attribute types:", JSON.stringify(stored.attributeSchema))
  await attempt("query bare_text with str('hello')", () => count(eq("bare_text", str("hello"))))
  await attempt("query bare_text with bare 'hello'", () => count(eq("bare_text", "hello" as never)))
  await attempt("query bare_num with i32(5)", () => count(eq("bare_num", i32(5))))
  await attempt("query bare_num with u64(5n)", () => count(eq("bare_num", u64(5n))))
  await attempt("query bare_num with dec('5')", () => count(eq("bare_num", dec("5"))))
  await attempt("query bare_num with str('5')", () => count(eq("bare_num", str("5"))))

  console.log("\n[2] Predicates the docs say the SDK exports but the network rejects")
  await attempt("ne('typed_text', str('nope')) with project filter", () => count(ne("typed_text", str("nope"))))
  await attempt("exists('typed_text') with project filter", () => count(exists("typed_text")))

  console.log("\n[3] A query with no filter at all")
  await attempt("select().fetch() with no where()", async () => (await publicClient.select({ key: true }).fetch()).entities.length)

  console.log("\n[4] Invalid inputs: what does the error say, and when is it thrown?")
  await attempt("attribute name with uppercase (Bad_Name)", () =>
    walletClient.createEntity({
      payload: jsonToPayload({}),
      contentType: "application/json",
      attributes: { project: str(project), Bad_Name: str("x") },
      expires: ExpirationTime.fromMinutes(10),
    }),
  )
  await attempt("str() longer than 128 bytes", async () => str("a".repeat(200)))
  await attempt("expiry of 7 seconds (must be a multiple of 2)", async () => ExpirationTime.fromSeconds(7))
  await attempt("i32 given a float: i32(1.5)", async () => i32(1.5))

  console.log("\nCopy any surprising result into arkiv/friction.md with the exact text above.")
}

main().catch((err) => {
  console.error("PROBE FAILED:", err)
  process.exitCode = 1
})
