import { useState } from "react"
import { useAccount, usePublicClient, useWalletClient } from "wagmi"
import { bytesToHex, keccak256, toBytes } from "viem"
import type { Address } from "viem"
import { useDisperseClient } from "./useDisperseClient"
import { getFhevmInstance } from "../lib/fhevm"
import { analyticsAbi } from "../lib/analyticsAbi"
import type { Recipient } from "../lib/parseCSV"

export type DisperseStage =
  | "idle"
  | "registering"
  | "approving"
  | "dispersing"
  | "recording"
  | "done"
  | "error"

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS as Address
const ANALYTICS_ADDRESS = import.meta.env.VITE_ANALYTICS_CONTRACT as Address

export function useDisperseFlow() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const disperseClient = useDisperseClient()
  const [stage, setStage] = useState<DisperseStage>("idle")
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const execute = async (recipients: Recipient[]) => {
    if (!disperseClient || !address) return
    setError(null)

    try {
      setStage("registering")
      const isRegistered = await disperseClient.isRegistered(address)
      if (!isRegistered) {
        const result = await disperseClient.register({ token: TOKEN_ADDRESS })
        setTxHash(result.hash)
      }

      setStage("approving")
      const approval = await disperseClient.hasApprovedSubwallets({
        user: address,
        token: TOKEN_ADDRESS,
      })
      if (!approval.wallet0 || !approval.wallet1) {
        await disperseClient.approveTokenOnWallets({ token: TOKEN_ADDRESS })
      }

      setStage("dispersing")
      const validRecipients = recipients.filter((r) => r.valid)
      const result = await disperseClient.disperse({
        token: TOKEN_ADDRESS,
        mode: "wallet",
        recipients: validRecipients.map((r) => r.address as Address),
        amounts: validRecipients.map((r) => r.amount),
      })
      setTxHash(result.hash)

      setStage("recording")
      const distributionId = keccak256(toBytes(result.hash))
      const handles = result.distributions[0]?.transferred ?? []

      if (handles.length > 0) {
        await disperseClient.batchDiscloseHandlesToParty({
          handles,
          party: ANALYTICS_ADDRESS,
        })
      }

      // Record the encrypted total/average on HelixraAnalytics. The contract's
      // recordBatch verifies fresh externalEuint64 inputs (bound to the
      // analytics contract + sender), so we re-encrypt the amounts here.
      if (walletClient && publicClient) {
        const instance = await getFhevmInstance()
        const input = instance.createEncryptedInput(ANALYTICS_ADDRESS, address)
        for (const r of validRecipients) input.add64(r.amount)
        const enc = await input.encrypt()

        const recordHash = await walletClient.writeContract({
          address: ANALYTICS_ADDRESS,
          abi: analyticsAbi,
          functionName: "recordBatch",
          args: [
            enc.handles.map((h) => bytesToHex(h)),
            bytesToHex(enc.inputProof),
            BigInt(validRecipients.length),
            distributionId,
          ],
        })
        await publicClient.waitForTransactionReceipt({ hash: recordHash })
      }

      console.log("Distribution complete. distributionId:", distributionId)
      setStage("done")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
      setStage("error")
    }
  }

  return { execute, stage, error, txHash }
}
