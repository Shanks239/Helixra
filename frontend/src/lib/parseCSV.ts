import { isAddress } from "viem"

export type Recipient = {
  address: string
  amount: bigint
  label: string
  valid: boolean
  error?: string
}

export function parseCSV(raw: string): Recipient[] {
  const lines = raw.trim().split("\n").map((l) => l.trim()).filter(Boolean)
  const start = lines[0].toLowerCase().includes("address") ? 1 : 0
  return lines.slice(start).map((line) => {
    const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""))
    const address = parts[0] ?? ""
    const rawAmount = parts[1] ?? ""
    const label = parts[2] ?? ""

    // isAddress with { strict: false } accepts non-checksummed addresses
    if (!isAddress(address, { strict: false })) {
      return { address, amount: 0n, label, valid: false, error: "Invalid address" }
    }

    try {
      const amount = BigInt(rawAmount)
      if (amount <= 0n) throw new Error()
      return { address, amount, label, valid: true }
    } catch {
      return { address, amount: 0n, label, valid: false, error: "Invalid amount" }
    }
  })
}
