import * as dotenv from "dotenv"
dotenv.config()

import { createPublicClient, http, keccak256, toBytes } from "viem"
import { sepolia } from "viem/chains"

const UNDERLYING = "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0"

const client = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

function sel(sig: string) {
  return keccak256(toBytes(sig)).slice(2, 10)
}

async function main() {
  // Check if proxy
  const implSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
  const impl = await client.getStorageAt({ address: UNDERLYING as `0x${string}`, slot: implSlot as `0x${string}` })
  console.log("EIP-1967 impl slot:", impl)

  const code = await client.getBytecode({ address: UNDERLYING as `0x${string}` })
  console.log("Bytecode length:", (code ?? "").length)

  // Check what the underlying token actually is
  const toCheck: Record<string, string> = {
    "transfer(address,uint256)":        sel("transfer(address,uint256)"),
    "approve(address,uint256)":         sel("approve(address,uint256)"),
    "mint(address,uint256)":            sel("mint(address,uint256)"),
    "confidentialTransfer(address,euint64,bytes)": sel("confidentialTransfer(address,euint64,bytes)"),
    "setOperator(address,bool)":        sel("setOperator(address,bool)"),
    "operator(address,address)":        sel("operator(address,address)"),
    "transferFrom(address,address,uint256)": sel("transferFrom(address,address,uint256)"),
    "paused()":                         sel("paused()"),
    "pause()":                          sel("pause()"),
  }

  const codeStr = (code ?? "").toLowerCase()
  console.log("\n=== Underlying token selectors ===")
  for (const [name, s] of Object.entries(toCheck)) {
    console.log(`  ${s}  ${name}: ${codeStr.includes(s) ? "✓ EXISTS" : "✗"}`)
  }
}

main().catch(console.error)
