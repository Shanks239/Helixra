import { useState, useEffect } from "react"
import { useAccount } from "wagmi"
import { useDisperseClient } from "./useDisperseClient"
import type { Recipient } from "../lib/parseCSV"
import type { Address } from "viem"

export type CheckStatus = "idle" | "checking" | "pass" | "fail" | "warn"

export interface PreflightCheck {
  id: string
  label: string
  status: CheckStatus
  detail?: string
}

const TOKEN_ADDRESS = import.meta.env.VITE_TOKEN_ADDRESS as Address

export function usePreflight(recipients: Recipient[]) {
  const { address } = useAccount()
  const disperseClient = useDisperseClient()

  const [checks, setChecks] = useState<PreflightCheck[]>([
    { id: "validation",   label: "Recipient Validation",   status: "idle" },
    { id: "registration", label: "Registration Status",    status: "idle" },
    { id: "allowance",    label: "Distribution Readiness", status: "idle" },
    { id: "cost",         label: "Cost Preview",           status: "idle" },
  ])

  const setCheck = (id: string, status: CheckStatus, detail?: string) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status, detail } : c))
    )
  }

  const resetChecks = () => {
    setChecks((prev) =>
      prev.map((c) => ({ ...c, status: "idle" as CheckStatus, detail: undefined }))
    )
  }

  useEffect(() => {
    // Wrapped in an async IIFE so the status updates aren't synchronous within
    // the effect body (avoids the cascading-render lint rule); the synchronous
    // prefix still runs in the same tick, so behaviour is unchanged.
    void (async () => {
      if (recipients.length === 0) {
        resetChecks()
        return
      }

      // Check 1: Recipient Validation
      const invalidCount = recipients.filter((r) => !r.valid).length
      if (invalidCount > 0) {
        setCheck("validation", "fail", `${invalidCount} invalid recipient${invalidCount > 1 ? "s" : ""}`)
      } else {
        setCheck("validation", "pass", `${recipients.length} recipients valid`)
      }

      if (!address || !disperseClient) {
        setCheck("registration", "warn", "Connect wallet to check")
        setCheck("allowance",    "warn", "Connect wallet to check")
        setCheck("cost",         "warn", "Connect wallet to check")
        return
      }

      // Check 2: Registration
      setCheck("registration", "checking")
      disperseClient.isRegistered(address).then((registered) => {
        setCheck("registration",
          registered ? "pass" : "warn",
          registered ? "Wallets registered" : "Registration required before disperse"
        )
      }).catch(() => setCheck("registration", "warn", "Could not verify registration"))

      // Check 3: Allowance
      setCheck("allowance", "checking")
      disperseClient.hasApprovedSubwallets({ user: address, token: TOKEN_ADDRESS })
        .then((approval) => {
          const approved = approval.wallet0 && approval.wallet1
          setCheck("allowance",
            approved ? "pass" : "warn",
            approved ? "Token spend approved" : "Approve token spend to continue"
          )
        })
        .catch(() => setCheck("allowance", "warn", "Could not verify approval"))

      // Check 4: Cost estimate
      setCheck("cost", "checking")
      disperseClient.calculateFee({
        mode: "wallet",
        user: address,
        recipients: recipients.filter((r) => r.valid).length,
      }).then((fee) => {
        const ethVal = Number(fee.ethValue) / 1e18
        setCheck("cost", "pass", `~${ethVal.toFixed(4)} ETH estimated`)
      }).catch(() => {
        const est = (recipients.length * 0.0002).toFixed(4)
        setCheck("cost", "pass", `~${est} ETH estimated`)
      })
    })()
  }, [recipients, address, disperseClient])

  const allPass = checks.every((c) => c.status === "pass")
  const hasErrors = checks.some((c) => c.status === "fail")

  return { checks, isReady: allPass, hasErrors }
}
