// Single source of truth for the Arkiv entity design.
// Keep this file in sync with /arkiv/schema.md.
//
// Rules from the Arkiv docs that shaped this file:
//  - attribute NAMES: lowercase snake_case, max 32 chars ("key" and "type tags" are reserved words,
//    so we use "report_key", not "key")
//  - attribute VALUES must be built with a typed constructor (str, dec, u64, bool, key...)
//    and queried with the same constructor, otherwise a query silently returns nothing
//  - numbers must be stored as numbers (dec / u64) to be range-queryable

export const TYPE_REPORT = "price_report"
export const TYPE_VOTE = "price_vote"

export const VERDICTS = ["confirm", "dispute"] as const
export type Verdict = (typeof VERDICTS)[number]

// Report entity
//   attributes: project, type, crop, mandi, state, price (dec), reported_at_ms (u64),
//               reporter (str, pseudonymous id), synthetic (bool)
//   payload (application/json): { pricePerQuintal, variety, cropName, mandiName }
export interface ReportPayload {
  pricePerQuintal: number
  variety: string
  cropName: string
  mandiName: string
}

// Vote entity
//   attributes: project, type, report_key (key), verdict (str), voter (str), voted_at_ms (u64)
//   payload: empty JSON object (all indexed data lives in attributes)
//   expires together with the report it points to

export interface ReportDTO {
  key: string
  crop: string
  mandi: string
  state: string
  pricePerQuintal: number
  variety: string
  reporter: string
  reportedAtMs: number
  expiresAtBlock: string
  expiresInSeconds: number
  confirmations: number
  disputes: number
  trusted: boolean
  synthetic: boolean
}
