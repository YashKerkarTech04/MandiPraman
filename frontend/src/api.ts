import type { Named } from "./i18n"

const BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:8787").replace(/\/$/, "")

export interface Mandi extends Named {
  state: string
}
export interface Catalog {
  crops: Named[]
  mandis: Mandi[]
}
export interface Price {
  crop: string
  mandi: string
  state: string
  medianPricePerQuintal: number
  minPricePerQuintal: number
  maxPricePerQuintal: number
  reportCount: number
  confirmedCount: number
  latestReportedAtMs: number
}
export interface PricesResponse {
  windowHours: number
  prices: Price[]
  blockNumber: string
}
export interface Report {
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
export interface ReportsResponse {
  reports: Report[]
  blockNumber: string
}
export interface Meta {
  network: string
  chainId: number
  relayerAddress: string
  explorer: string
  explorerAddress: string
  projectId: string
  reportTtlHours: number
}
export interface WriteResult {
  key: string
  txHash: string
  explorerTx: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string[],
  ) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: init?.body ? { "content-type": "application/json" } : undefined,
    })
  } catch {
    throw new ApiError(0, "network")
  }
  const text = await res.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    /* non-JSON error page from a proxy */
  }
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; details?: string[] }
    throw new ApiError(res.status, body.error ?? res.statusText, body.details)
  }
  return data as T
}

export const api = {
  catalog: () => request<Catalog>("/api/catalog"),
  meta: () => request<Meta>("/api/meta"),
  prices: () => request<PricesResponse>("/api/prices?hours=72"),
  reports: () => request<ReportsResponse>("/api/reports"),
  postReport: (body: { crop: string; mandi: string; pricePerQuintal: number; variety: string; reporterId: string }) =>
    request<WriteResult>("/api/reports", { method: "POST", body: JSON.stringify(body) }),
  vote: (key: string, body: { verdict: "confirm" | "dispute"; voterId: string }) =>
    request<WriteResult>(`/api/reports/${key}/votes`, { method: "POST", body: JSON.stringify(body) }),
}
