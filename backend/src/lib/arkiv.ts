import { createPublicClient, createWalletClient } from "@arkiv-network/sdk"
import { tiramisu } from "@arkiv-network/sdk/chains"
import { http } from "viem"
import { nonceManager, privateKeyToAccount } from "viem/accounts"
import { config } from "../config"

// RPC_URL (with an Arkiv access key appended) is optional. http(undefined) falls back to the
// public Tiramisu RPC, which is heavily rate limited.
const transport = () => http(config.RPC_URL, { timeout: 15_000, retryCount: 2 })

export const publicClient = createPublicClient({
  chain: tiramisu,
  transport: transport(),
})

// The relayer: one server-side wallet that signs every write, so farmers never need a wallet.
// nonceManager = safe for several writes in one process (docs: "Concurrent writes and nonces").
// Only run ONE backend process with this key, or nonces will collide.
export const account = privateKeyToAccount(config.PRIVATE_KEY as `0x${string}`, { nonceManager })

export const walletClient = createWalletClient({
  chain: tiramisu,
  transport: transport(),
  account,
})

export const EXPLORER_URL = "https://tiramisu.explorer.arkiv.network"

// Serialise writes so a burst of requests cannot interleave awkwardly.
let queue: Promise<unknown> = Promise.resolve()
export function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task)
  queue = run.catch(() => undefined)
  return run
}
