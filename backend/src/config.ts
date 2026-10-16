import "dotenv/config"
import { z } from "zod"

const schema = z.object({
  PRIVATE_KEY: z
    .string()
    .regex(/^0x[0-9a-fA-F]{64}$/, "must be 0x followed by 64 hex characters (run: npm run wallet)"),
  RPC_URL: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
  PORT: z.coerce.number().int().default(8787),
  CORS_ORIGIN: z.string().default("*"),
  PROJECT_ID: z
    .string()
    .regex(/^[a-z][a-z0-9_.-]{0,31}$/, "lowercase snake_case, max 32 chars")
    .default("mandi_board_v1"),
  REPORT_TTL_HOURS: z.coerce.number().positive().default(72),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error("Invalid environment. Fix backend/.env (see .env.example):")
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`)
  }
  process.exit(1)
}

export const config = parsed.data
