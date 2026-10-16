import cors from "cors"
import express, { type NextFunction, type Request, type Response } from "express"
import { BaseError } from "viem"
import { ZodError } from "zod"
import { EntityMutationError } from "@arkiv-network/sdk"
import { QueryError } from "@arkiv-network/sdk/query"
import { config } from "./config"
import { account } from "./lib/arkiv"
import { HttpError } from "./lib/errors"
import { api } from "./routes/api"

const app = express()
app.set("trust proxy", 1) // behind Render / Railway / Fly proxies
app.use(cors({ origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN.split(",") }))
app.use(express.json({ limit: "10kb" }))

// Very small per-IP limiter for writes (each write costs gas from the relayer wallet).
const WINDOW_MS = 60_000
const MAX_WRITES_PER_WINDOW = 12
const hits = new Map<string, { count: number; resetAt: number }>()
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method !== "POST") return next()
  const now = Date.now()
  const entry = hits.get(req.ip ?? "unknown")
  if (!entry || entry.resetAt < now) {
    hits.set(req.ip ?? "unknown", { count: 1, resetAt: now + WINDOW_MS })
    return next()
  }
  entry.count += 1
  if (entry.count > MAX_WRITES_PER_WINDOW) {
    return res.status(429).json({ error: "Too many submissions, please wait a minute" })
  }
  next()
})

// Express 5 forwards errors from async handlers to the error handler below automatically.
app.use("/api", api)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid input", details: err.issues.map((i) => `${i.path.join(".")}: ${i.message}`) })
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message })
  if (err instanceof EntityMutationError) {
    console.error("Arkiv write rejected:", err.message, err.txHash)
    return res.status(502).json({ error: "The network rejected the write", detail: err.message })
  }
  if (err instanceof QueryError) {
    console.error("Arkiv query failed:", err.kind, err.message)
    return res.status(502).json({ error: "The network rejected the query", detail: err.message })
  }
  if (err instanceof BaseError) {
    // viem transport problem: RPC unreachable, rate limited, timed out, or no gas
    console.error("RPC problem:", err.shortMessage)
    return res.status(503).json({ error: "The Arkiv network is not reachable right now, try again", detail: err.shortMessage })
  }
  console.error(err)
  res.status(500).json({ error: "Something went wrong" })
})

app.listen(config.PORT, () => {
  console.log(`Mandi Board API on :${config.PORT}`)
  console.log(`Relayer wallet: ${account.address}`)
})
