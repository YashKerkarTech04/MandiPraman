// Smoke test: write one short-lived entity to Tiramisu, read it back by key and by query.
// Usage: npm run hello
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk"
import { str, u64 } from "@arkiv-network/sdk/attr"
import { eq } from "@arkiv-network/sdk/query"
import { config } from "../src/config"
import { account, EXPLORER_URL, publicClient, walletClient } from "../src/lib/arkiv"

async function main() {
  console.log("Relayer address:", account.address)
  const balance = await publicClient.getBalance({ address: account.address })
  console.log("Balance (wei GLM):", balance.toString())
  if (balance === 0n) {
    console.log("\nBalance is 0. Get test GLM at https://hub.arkiv.network/faucet and run again.")
    process.exit(1)
  }

  const { entityKey, txHash, expiresAt } = await walletClient.createEntity({
    payload: jsonToPayload({ hello: "mandi board" }),
    contentType: "application/json",
    attributes: {
      project: str(`${config.PROJECT_ID}_dev`),
      type: str("hello"),
      created_at_ms: u64(Date.now()),
    },
    expires: ExpirationTime.fromMinutes(10),
  })
  console.log("\nCreated entity :", entityKey)
  console.log("Tx             :", `${EXPLORER_URL}/tx/${txHash}`)
  console.log("Expires at blk :", expiresAt.toString())

  const entity = await publicClient.getEntity(entityKey)
  console.log("\nRead by key    :", entity.toJson(), "| owner:", entity.owner)

  const page = await publicClient
    .select({ key: true, attributes: true })
    .where(eq("project", str(`${config.PROJECT_ID}_dev`)), eq("type", str("hello")))
    .fetch()
  console.log("Read by query  :", page.entities.length, "hello entities found at block", page.blockNumber.toString())
}

main().catch((err) => {
  console.error("\nFAILED:", err)
  console.error("\nIf this is confusing, write it in /arkiv/friction.md (exact message + step + SDK version).")
  process.exit(1)
})
