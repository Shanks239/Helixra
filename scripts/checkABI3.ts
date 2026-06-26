import * as dotenv from "dotenv"
dotenv.config()

import { createPublicClient, http, keccak256, toBytes } from "viem"
import { sepolia } from "viem/chains"

const IMPL = "0x528f2f29ddeb466cfbfb7a31ce92bfb3c343973c"

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

function sel(sig: string) {
  return keccak256(toBytes(sig)).slice(2, 10)
}

const toCheck: Record<string, string> = {
  "wrap(uint256)":                     sel("wrap(uint256)"),
  "wrap(address,uint256)":             sel("wrap(address,uint256)"),
  "depositFor(address)":               sel("depositFor(address)"),
  "deposit()":                         sel("deposit()"),
  "deposit(uint256)":                  sel("deposit(uint256)"),
  "shield(uint256)":                   sel("shield(uint256)"),
  "balanceOf(address)":                sel("balanceOf(address)"),
  "totalSupply()":                     sel("totalSupply()"),
  "name()":                            sel("name()"),
  "approve(address,uint256)":          sel("approve(address,uint256)"),
  "mint(address,uint256)":             sel("mint(address,uint256)"),
  "mint(address,uint64)":              sel("mint(address,uint64)"),
  "underlying()":                      sel("underlying()"),
  "depositFor(address,uint256)":       sel("depositFor(address,uint256)"),
  "withdrawTo(address,uint256)":       sel("withdrawTo(address,uint256)"),
  "onTransferReceived(address,address,uint256,bytes)": sel("onTransferReceived(address,address,uint256,bytes)"),
}

async function main() {
  const code = await client.getBytecode({ address: IMPL as `0x${string}` })
  const codeStr = (code ?? "").toLowerCase()
  console.log("Implementation bytecode length:", codeStr.length)
  console.log("\n=== Implementation selectors ===")
  for (const [name, s] of Object.entries(toCheck)) {
    console.log(`  ${s}  ${name}: ${codeStr.includes(s) ? "✓ EXISTS" : "✗"}`)
  }
}

main().catch(console.error)
