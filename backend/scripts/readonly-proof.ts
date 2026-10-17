// Proves entities created with the readonly flag cannot be changed, even by their owner.
// Usage: npm run prove-readonly
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk"
import { str } from "@arkiv-network/sdk/attr"
import { config } from "../src/config"
import { EXPLORER_URL, publicClient, walletClient } from "../src/lib/arkiv"

async function main() {
  const { entityKey, txHash } = await walletClient.createEntity({
    payload: jsonToPayload({ note: "frozen" }),
    contentType: "application/json",
    attributes: {
      project: str(`${config.PROJECT_ID}_dev`),
      type: str("readonly_proof"),
      status: str("original"),
    },
    expires: ExpirationTime.fromMinutes(10),
    flags: { readonly: true },
  })
  console.log("Created readonly entity:", entityKey)
  console.log("Tx:", `${EXPLORER_URL}/tx/${txHash}`)

  console.log("\nTrying to patch status -> 'tampered' as the owner...")
  try {
    await walletClient.patchEntity({ entityKey, set: { status: str("tampered") } })
    console.log("UNEXPECTED: the patch succeeded, so readonly is not enforced. Put this in friction.md.")
    process.exitCode = 1
  } catch (err) {
    const name = err instanceof Error ? err.constructor.name : typeof err
    const message = err instanceof Error ? err.message : String(err)
    console.log(`Patch rejected as expected (${name}):`)
    console.log(message.split("\n").slice(0, 6).join("\n"))
  }

  const entity = await publicClient.getEntity(entityKey)
  console.log("\nStatus on chain is still:", JSON.stringify(entity.attributes.status))
}

main().catch((err) => {
  console.error("FAILED:", err)
  process.exitCode = 1
})
