// Generates a brand-new THROWAWAY wallet for the relayer. Testnet only.
// Usage: npm run wallet
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"

const privateKey = generatePrivateKey()
const account = privateKeyToAccount(privateKey)

console.log("\nNew testnet relayer wallet\n")
console.log("Address     :", account.address)
console.log("Private key :", privateKey)
console.log("\nNext steps:")
console.log("  1. Put the private key in backend/.env as PRIVATE_KEY=...  (never commit .env)")
console.log("  2. Get test GLM for the ADDRESS at https://hub.arkiv.network/faucet")
console.log("  3. Run: npm run hello\n")
