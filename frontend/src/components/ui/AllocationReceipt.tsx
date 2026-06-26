interface Props {
  allocation: bigint
  address: string
  distributionId: string
  label: string
  claimed: boolean
  onClaim?: () => void
  isLoading?: boolean
}

function truncate(addr: string) {
  if (!addr) return ""
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function AllocationReceipt({
  allocation,
  address,
  distributionId,
  label,
  claimed,
  onClaim,
  isLoading,
}: Props) {
  return (
    <div className="receipt">
      <div className="receipt-header">
        <span className="receipt-title">ALLOCATION RECEIPT</span>
        {claimed && <span className="receipt-badge">CLAIMED</span>}
      </div>

      <div className="receipt-amount">
        <span className="receipt-amount-label">YOUR ALLOCATION</span>
        <span className="receipt-amount-value">{allocation.toString()}</span>
      </div>

      <div className="receipt-rows">
        <div className="receipt-row">
          <span className="receipt-key">Wallet</span>
          <span className="receipt-val">{truncate(address)}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-key">Distribution</span>
          <span className="receipt-val">{distributionId}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-key">Label</span>
          <span className="receipt-val">{label}</span>
        </div>
        <div className="receipt-row">
          <span className="receipt-key">Status</span>
          <span className={`receipt-val ${claimed ? "status-claimed" : "status-ready"}`}>
            {claimed ? "Claimed" : "Ready to claim"}
          </span>
        </div>
        <div className="receipt-row">
          <span className="receipt-key">Verification</span>
          <span className="receipt-val status-verified">✓ EIP-712 verified</span>
        </div>
      </div>

      {!claimed && onClaim && (
        <button
          className="btn-primary"
          onClick={onClaim}
          disabled={isLoading}
          style={{ marginTop: 20 }}
        >
          {isLoading ? "Claiming..." : "Claim Tokens"}
        </button>
      )}
    </div>
  )
}
