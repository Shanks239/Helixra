import * as dotenv from "dotenv"
dotenv.config()

import { createPublicClient, http } from "viem"
import { sepolia } from "viem/chains"

const UNDERLYING = "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0"
const CUSDT = "0x4E7B06D78965594eB5EF5414c357ca21E1554491"

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

const selectors: Record<string, string> = {
  "mint(address,uint256)":            "40c10f19",
  "mint(address,uint64)":             "2893c5b0",
  "depositFor(address)":              "aa271e1a",
  "wrap(uint256)":                    "ea598cb0",
  "wrap(address,uint256)":            "46ae2be5",
  "deposit()":                        "d0e30db0",
  "approve(address,uint256)":         "095ea7b3",
  "transfer(address,uint256)":        "a9059cbb",
  "transferAndCall(address,uint256,bytes)": "4000aea0",
  "shield(uint256)":                  "3d18b912",
  "shield(address,uint256)":          "e1ebe077",
}

async function check(label: string, address: string) {
  const code = await client.getBytecode({ address: address as `0x${string}` })
  const codeStr = (code ?? "").toLowerCase()
  console.log(`\n=== ${label} (${address}) ===`)
  for (const [name, sel] of Object.entries(selectors)) {
    console.log(`  ${name}: ${codeStr.includes(sel) ? "✓ EXISTS" : "✗ not found"}`)
  }
}

async function main() {
  await check("Underlying USDT Mock", UNDERLYING)
  await check("cUSDTMock Wrapper", CUSDT)
}

main().catch(console.error)
