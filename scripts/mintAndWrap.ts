import * as dotenv from "dotenv"
dotenv.config()

import { createWalletClient, createPublicClient, http, parseUnits } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { sepolia } from "viem/chains"

const UNDERLYING = "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0"
const CUSDT = "0x4E7B06D78965594eB5EF5414c357ca21E1554491"
const AMOUNT = parseUnits("10000", 6)

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`)

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
})

const ERC20_ABI = [
  { name: "mint",     type: "function", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { name: "approve",  type: "function", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
  { name: "allowance",type: "function", inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "balanceOf",type: "function", inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
] as const

async function main() {
  console.log("Account:", account.address)

  // Check current state
  const balance = await publicClient.readContract({ address: UNDERLYING, abi: ERC20_ABI, functionName: "balanceOf", args: [account.address] })
  const allowance = await publicClient.readContract({ address: UNDERLYING, abi: ERC20_ABI, functionName: "allowance", args: [account.address, CUSDT] })
  console.log("Underlying balance:", balance.toString())
  console.log("Current allowance:", allowance.toString())

  // Mint
  console.log("\nMinting...")
  const mintHash = await walletClient.writeContract({ address: UNDERLYING, abi: ERC20_ABI, functionName: "mint", args: [account.address, AMOUNT] })
  await publicClient.waitForTransactionReceipt({ hash: mintHash })
  console.log("Mint confirmed:", mintHash)

  // Reset allowance to 0 first if non-zero (some tokens require this)
  if (allowance > 0n) {
    console.log("\nResetting allowance to 0...")
    const resetHash = await walletClient.writeContract({ address: UNDERLYING, abi: ERC20_ABI, functionName: "approve", args: [CUSDT, 0n] })
    await publicClient.waitForTransactionReceipt({ hash: resetHash })
    console.log("Reset confirmed:", resetHash)
  }

  // Approve
  console.log("\nApproving...")
  const approveHash = await walletClient.writeContract({ address: UNDERLYING, abi: ERC20_ABI, functionName: "approve", args: [CUSDT, AMOUNT] })
  await publicClient.waitForTransactionReceipt({ hash: approveHash })
  console.log("Approve confirmed:", approveHash)

  // Wrap
  console.log("\nWrapping...")
  const wrapHash = await walletClient.writeContract({
    address: CUSDT,
    abi: [{ name: "wrap", type: "function", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [], stateMutability: "nonpayable" }],
    functionName: "wrap",
    args: [account.address, AMOUNT],
  })
  await publicClient.waitForTransactionReceipt({ hash: wrapHash })
  console.log("Wrap confirmed:", wrapHash)
  console.log("\nDone — you now hold cUSDTMock")
}

main().catch(console.error)
