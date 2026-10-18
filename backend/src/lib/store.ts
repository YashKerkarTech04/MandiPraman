import { ExpirationTime, NoEntityFoundError, jsonToPayload } from "@arkiv-network/sdk"
import { bool, dec, key as keyAttr, str, u64 } from "@arkiv-network/sdk/attr"
import { and, eq, gte } from "@arkiv-network/sdk/query"
import { config } from "../config"
import { HttpError } from "./errors"
import { account, enqueueWrite, publicClient, walletClient } from "./arkiv"
import { clearCache } from "./cache"
import { isTrusted } from "./stats"
import {
  TYPE_REPORT,
  TYPE_VOTE,
  type ReportDTO,
  type ReportPayload,
  type Verdict,
} from "./schema"

const MAX_ENTITIES = 1000 // hard cap per listing so one request cannot walk the whole chain
const SECONDS_PER_BLOCK = 2

type Hex = `0x${string}`

// Attributes come back as { type, value }. These helpers keep the mapping code readable.
type AttrMap = Record<string, { type: string; value: unknown } | undefined>
const readStr = (a: AttrMap, name: string) => {
  const v = a[name]
  return v?.type === "str" ? String(v.value) : ""
}
const readBool = (a: AttrMap, name: string) => {
  const v = a[name]
  return v?.type === "bool" ? Boolean(v.value) : false
}
const readU64 = (a: AttrMap, name: string) => {
  const v = a[name]
  return v?.type === "u64" ? Number(v.value) : 0
}
const readKey = (a: AttrMap, name: string) => {
  const v = a[name]
  return v?.type === "key" ? String(v.value).toLowerCase() : ""
}

// ---------- writes ----------

export interface NewReport {
  crop: string
  cropName: string
  mandi: string
  mandiName: string
  state: string
  pricePerQuintal: number
  variety: string
  reporterId: string
  synthetic?: boolean
}

export function reportCreateParams(r: NewReport) {
  const payload: ReportPayload = {
    pricePerQuintal: r.pricePerQuintal,
    variety: r.variety,
    cropName: r.cropName,
    mandiName: r.mandiName,
  }
  return {
    payload: jsonToPayload(payload),
    contentType: "application/json",
    attributes: {
      project: str(config.PROJECT_ID),
      type: str(TYPE_REPORT),
      crop: str(r.crop),
      mandi: str(r.mandi),
      state: str(r.state),
      price: dec(r.pricePerQuintal.toFixed(2)), // dec so we can range-query prices
      reported_at_ms: u64(Date.now()),
      reporter: str(r.reporterId),
      synthetic: bool(Boolean(r.synthetic)),
    },
    expires: ExpirationTime.fromHours(config.REPORT_TTL_HOURS),
    // Frozen after posting: attributes and payload can never be patched, even by the relayer.
    flags: { readonly: true },
  }
}

export async function createReport(r: NewReport) {
  const result = await enqueueWrite(() => walletClient.createEntity(reportCreateParams(r)))
  clearCache()
  return { key: result.entityKey, txHash: result.txHash, expiresAtBlock: result.expiresAt.toString() }
}

export async function createVote(reportKey: Hex, verdict: Verdict, voterId: string) {
  let report
  try {
    report = await publicClient.getEntity(reportKey)
  } catch (err) {
    if (err instanceof NoEntityFoundError) throw new HttpError(404, "Report not found or already expired")
    throw err
  }

  const attrs = report.attributes as AttrMap
  if (
    readStr(attrs, "type") !== TYPE_REPORT ||
    readStr(attrs, "project") !== config.PROJECT_ID ||
    String(report.creator ?? "").toLowerCase() !== account.address.toLowerCase()
  ) {
    // Anyone can copy our `project` tag onto their own entity. Nobody can forge `$creator`.
    throw new HttpError(404, "Not a price report of this app")
  }
  if (readStr(attrs, "reporter") === voterId) {
    throw new HttpError(409, "You cannot vote on your own report")
  }

  const existing = await publicClient
    .select({ key: true })
    .where(
      eq("project", str(config.PROJECT_ID)),
      eq("type", str(TYPE_VOTE)),
      eq("report_key", keyAttr(reportKey)),
      eq("voter", str(voterId)),
    )
    .createdBy(account.address)
    .limit(1)
    .fetch()
  if (existing.entities.length > 0) throw new HttpError(409, "You already voted on this report")

  // A vote lives exactly as long as its report. atLeast stops it being rejected when the
  // report is about to expire.
  const expires = ExpirationTime.atBlock(report.expiresAt, {
    atLeast: ExpirationTime.fromSeconds(30),
  })

  const result = await enqueueWrite(() =>
    walletClient.createEntity({
      payload: jsonToPayload({}),
      contentType: "application/json",
      attributes: {
        project: str(config.PROJECT_ID),
        type: str(TYPE_VOTE),
        report_key: keyAttr(reportKey),
        verdict: str(verdict),
        voter: str(voterId),
        voted_at_ms: u64(Date.now()),
      },
      expires,
      flags: { readonly: true },
    }),
  )
  clearCache()
  return { key: result.entityKey, txHash: result.txHash }
}

// ---------- reads ----------

export interface ReportFilter {
  crop?: string
  mandi?: string
  state?: string
  sinceMs?: number
}

export async function listReports(filter: ReportFilter = {}): Promise<{ reports: ReportDTO[]; blockNumber: string }> {
  const filters = [eq("project", str(config.PROJECT_ID)), eq("type", str(TYPE_REPORT))]
  if (filter.crop) filters.push(eq("crop", str(filter.crop)))
  if (filter.mandi) filters.push(eq("mandi", str(filter.mandi)))
  if (filter.state) filters.push(eq("state", str(filter.state)))
  if (filter.sinceMs) filters.push(gte("reported_at_ms", u64(filter.sinceMs)))

  let page = await publicClient
    .select({ key: true, attributes: true, payload: true, expiresAt: true })
    .where(and(filters))
    .createdBy(account.address) // only records written by our relayer count; `$creator` cannot be forged
    .limit(200)
    .fetch()

  const blockNumber = page.blockNumber
  const rows = [...page.entities]
  while (page.hasNextPage() && rows.length < MAX_ENTITIES) {
    page = await page.next()
    rows.push(...page.entities)
  }

  const votes = await countVotes()

  const reports: ReportDTO[] = rows.flatMap((e) => {
    let payload: Partial<ReportPayload>
    try {
      payload = e.toJson() as Partial<ReportPayload>
    } catch {
      return [] // malformed payload: skip this record instead of breaking the whole board
    }
    const a = e.attributes as AttrMap
    const tally = votes.get(String(e.key).toLowerCase()) ?? { confirm: 0, dispute: 0 }
    const blocksLeft = Number(e.expiresAt - blockNumber)
    return [{
      key: e.key,
      crop: readStr(a, "crop"),
      mandi: readStr(a, "mandi"),
      state: readStr(a, "state"),
      pricePerQuintal: Number(a.price?.value ?? payload.pricePerQuintal ?? 0),
      variety: payload.variety ?? "",
      reporter: readStr(a, "reporter"),
      reportedAtMs: readU64(a, "reported_at_ms"),
      expiresAtBlock: e.expiresAt.toString(),
      expiresInSeconds: Math.max(0, blocksLeft * SECONDS_PER_BLOCK),
      confirmations: tally.confirm,
      disputes: tally.dispute,
      trusted: isTrusted(tally.confirm, tally.dispute),
      synthetic: readBool(a, "synthetic"),
    }]
  })

  // The node returns newest-created first; make "newest reported" explicit.
  reports.sort((x, y) => y.reportedAtMs - x.reportedAtMs)
  return { reports, blockNumber: blockNumber.toString() }
}

// One query for all votes of this project, grouped in memory by report key.
async function countVotes() {
  let page = await publicClient
    .select({ attributes: true })
    .where(eq("project", str(config.PROJECT_ID)), eq("type", str(TYPE_VOTE)))
    .createdBy(account.address)
    .limit(200)
    .fetch()

  const rows = [...page.entities]
  while (page.hasNextPage() && rows.length < MAX_ENTITIES * 5) {
    page = await page.next()
    rows.push(...page.entities)
  }

  const tally = new Map<string, { confirm: number; dispute: number }>()
  for (const v of rows) {
    const a = v.attributes as AttrMap
    const reportKey = readKey(a, "report_key")
    const verdict = readStr(a, "verdict")
    if (!reportKey || (verdict !== "confirm" && verdict !== "dispute")) continue
    const t = tally.get(reportKey) ?? { confirm: 0, dispute: 0 }
    t[verdict] += 1
    tally.set(reportKey, t)
  }
  return tally
}
