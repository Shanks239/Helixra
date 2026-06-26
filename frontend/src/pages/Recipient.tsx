import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useState } from "react"
import AllocationTimeline from "../components/ui/AllocationTimeline"
import AllocationReceipt from "../components/ui/AllocationReceipt"

type Stage = "connect" | "register" | "decrypt" | "claim" | "done"

export default function Recipient() {
  const { isConnected, address } = useAccount()
  const [stage, setStage] = useState<Stage>("connect")
  const [isLoading, setIsLoading] = useState(false)
  const [allocation, setAllocation] = useState<bigint | null>(null)

  const handleRegister = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStage("decrypt")
    }, 1500)
  }

  const handleDecrypt = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setAllocation(1000n)
      setStage("claim")
    }, 2000)
  }

  const handleClaim = () => {
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      setStage("done")
    }, 1500)
  }

  // Auto-advance from connect to register when wallet connects
  if (isConnected && stage === "connect") {
    setStage("register")
  }

  const timelineStage =
    stage === "connect"   ? "assigned"  :
    stage === "register"  ? "encrypted" :
    stage === "decrypt"   ? "available" :
    stage === "claim"     ? "decrypted" :
    "claimed"

  return (
    <div className="recipient-page">
      <div className="recipient-inner">

        <div className="recipient-brand">HELIXRA</div>
        <h1 className="recipient-title">Your Allocation</h1>
        <p className="recipient-subtitle">
          You have a confidential token allocation waiting. Connect your wallet to claim it.
        </p>

        <AllocationTimeline currentStage={timelineStage} />

        <div className="recipient-card">
          {stage === "connect" && (
            <div className="recipient-step">
              <p className="step-label">Step 1 — Connect Wallet</p>
              <p className="step-hint">Connect the wallet that received this distribution.</p>
              <div style={{ marginTop: 20 }}>
                <ConnectButton />
              </div>
            </div>
          )}

          {stage === "register" && (
            <div className="recipient-step">
              <p className="step-label">Step 2 — Register</p>
              <p className="step-hint">
                Register your wallet with the Helixra disperse contract to enable confidential transfers.
              </p>
              <button
                className="btn-primary"
                onClick={handleRegister}
                disabled={isLoading}
                style={{ marginTop: 20 }}
              >
                {isLoading ? "Registering..." : "Register Wallet"}
              </button>
            </div>
          )}

          {stage === "decrypt" && (
            <div className="recipient-step">
              <p className="step-label">Step 3 — Decrypt Allocation</p>
              <p className="step-hint">
                Sign a message to decrypt your allocation amount. Only you can see this value.
              </p>
              <div className="encrypted-preview">
                <span className="enc-label">YOUR ALLOCATION</span>
                <div className="redacted-block" style={{ marginTop: 8 }}>
                  <span className="redacted-text" style={{ fontSize: 24 }}>████████</span>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={handleDecrypt}
                disabled={isLoading}
                style={{ marginTop: 20 }}
              >
                {isLoading ? "Decrypting..." : "Sign to Decrypt"}
              </button>
            </div>
          )}

          {(stage === "claim" || stage === "done") && allocation !== null && (
            <AllocationReceipt
              allocation={allocation}
              address={address ?? ""}
              distributionId="0xabc123...def456"
              label="Seed Investor - Tranche 1"
              claimed={stage === "done"}
              onClaim={stage === "claim" ? handleClaim : undefined}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  )
}
