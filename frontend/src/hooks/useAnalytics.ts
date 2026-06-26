import { useCallback, useEffect, useState } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import type { Address } from "viem"
import { getFhevmInstance } from "../lib/fhevm"
import { analyticsAbi } from "../lib/analyticsAbi"

const ANALYTICS_ADDRESS = import.meta.env.VITE_ANALYTICS_CONTRACT as Address

export interface DistributionRecord {
  id: string                 // full distributionId (bytes32 hex) — React key & decrypt target
  distributionId: string     // shortened, for display
  recipientCount: number
  claimedCount: number
  timestamp: number          // ms
  encTotalHandle: `0x${string}`
  encAverageHandle: `0x${string}`
  encTotalDecrypted?: bigint
  encAverageDecrypted?: bigint
  isDecrypting: boolean
}

function shorten(id: string) {
  return `${id.slice(0, 10)}…${id.slice(-6)}`
}

export function useAnalytics() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [distributions, setDistributions] = useState<DistributionRecord[]>([])

  // Load the connected owner's distributions from BatchRecorded events.
  useEffect(() => {
    let cancelled = false

    void (async () => {
      if (!publicClient || !address || !ANALYTICS_ADDRESS) {
        if (!cancelled) setDistributions([])
        return
      }
      try {
        const logs = await publicClient.getContractEvents({
          address: ANALYTICS_ADDRESS,
          abi: analyticsAbi,
          eventName: "BatchRecorded",
          args: { owner: address },
          fromBlock: "earliest",
          toBlock: "latest",
        })

        const records = await Promise.all(
          logs.map(async (log) => {
            const { distributionId, recipientCount, encTotalHandle, encAverageHandle } = log.args

            // Live claimed count (the event only carries the count at record time).
            const [, claimedCount] = await publicClient.readContract({
              address: ANALYTICS_ADDRESS,
              abi: analyticsAbi,
              functionName: "getDistributionHealth",
              args: [distributionId!],
            })

            const block = await publicClient.getBlock({ blockNumber: log.blockNumber })

            return {
              id: distributionId!,
              distributionId: shorten(distributionId!),
              recipientCount: Number(recipientCount),
              claimedCount: Number(claimedCount),
              timestamp: Number(block.timestamp) * 1000,
              encTotalHandle: encTotalHandle!,
              encAverageHandle: encAverageHandle!,
              isDecrypting: false,
            } satisfies DistributionRecord
          })
        )

        // newest first
        if (!cancelled) setDistributions(records.reverse())
      } catch (err) {
        console.error("[Helixra] failed to load analytics:", err)
        if (!cancelled) setDistributions([])
      }
    })()

    return () => {
      cancelled = true
    }
  }, [publicClient, address])

  // Decrypt the encrypted total + average for one distribution via the Zama
  // relayer's userDecrypt (requires an EIP-712 signature from the owner).
  const decrypt = useCallback(
    async (id: string) => {
      if (!walletClient || !address) return
      const target = distributions.find((d) => d.id === id)
      if (!target) return

      setDistributions((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isDecrypting: true } : d))
      )

      try {
        const instance = await getFhevmInstance()
        const keypair = instance.generateKeypair()
        const contractAddresses = [ANALYTICS_ADDRESS]
        const startTimestamp = Math.floor(Date.now() / 1000)
        const durationDays = 10

        const eip712 = instance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimestamp,
          durationDays
        )

        const signature = await walletClient.signTypedData({
          account: address,
          domain: eip712.domain,
          types: {
            UserDecryptRequestVerification:
              eip712.types.UserDecryptRequestVerification,
          },
          primaryType: "UserDecryptRequestVerification",
          message: {
            publicKey: eip712.message.publicKey,
            contractAddresses: eip712.message.contractAddresses,
            startTimestamp: BigInt(eip712.message.startTimestamp),
            durationDays: BigInt(eip712.message.durationDays),
            extraData: eip712.message.extraData,
          },
        })

        const result = await instance.userDecrypt(
          [
            { handle: target.encTotalHandle, contractAddress: ANALYTICS_ADDRESS },
            { handle: target.encAverageHandle, contractAddress: ANALYTICS_ADDRESS },
          ],
          keypair.privateKey,
          keypair.publicKey,
          signature.replace(/^0x/, ""),
          contractAddresses,
          address,
          startTimestamp,
          durationDays
        )

        const total = BigInt(result[target.encTotalHandle] as bigint)
        const average = BigInt(result[target.encAverageHandle] as bigint)

        setDistributions((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  isDecrypting: false,
                  encTotalDecrypted: total,
                  encAverageDecrypted: average,
                }
              : d
          )
        )
      } catch (err) {
        console.error("[Helixra] decrypt failed:", err)
        setDistributions((prev) =>
          prev.map((d) => (d.id === id ? { ...d, isDecrypting: false } : d))
        )
      }
    },
    [walletClient, address, distributions]
  )

  return { distributions, decrypt }
}
