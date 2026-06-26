import * as dotenv from "dotenv"
dotenv.config()

import { createPublicClient, http, keccak256, toBytes } from "viem"
import { sepolia } from "viem/chains"

const CUSDT = "0x4E7B06D78965594eB5EF5414c357ca21E1554491"

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
  "implementation()":                  sel("implementation()"),
  "balanceOf(address)":                sel("balanceOf(address)"),
  "totalSupply()":                     sel("totalSupply()"),
  "name()":                            sel("name()"),
  "approve(address,uint256)":          sel("approve(address,uint256)"),
  "mint(address,uint256)":             sel("mint(address,uint256)"),
  "mint(address,uint64)":              sel("mint(address,uint64)"),
  "confidentialTransfer(address,uint256)": sel("confidentialTransfer(address,uint256)"),
}

async function main() {
  const code = await client.getBytecode({ address: CUSDT as `0x${string}` })
  const codeStr = (code ?? "").toLowerCase()
  console.log("Bytecode length:", codeStr.length)
  console.log("\n=== cUSDTMock selectors ===")
  for (const [name, s] of Object.entries(toCheck)) {
    console.log(`  ${s}  ${name}: ${codeStr.includes(s) ? "✓ EXISTS" : "✗"}`)
  }

  // Also check implementation slot for proxy
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  const impl = await client.getStorageAt({ address: CUSDT as `0x${string}`, slot: implSlot as `0x${string}` })
  console.log("\nEIP-1967 implementation slot:", impl)
}

main().catch(console.error)
