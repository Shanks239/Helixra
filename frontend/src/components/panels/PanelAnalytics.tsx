import { useAnalytics } from "../../hooks/useAnalytics"

function timeAgo(ts: number) {
  const diff = Date.now() - ts
  const h = Math.floor(diff / 1000 / 60 / 60)
  if (h < 1) return "just now"
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function completionBps(claimed: number, total: number) {
  if (total === 0) return 0
  return Math.round((claimed / total) * 100)
}

export default function PanelAnalytics() {
  const { distributions, decrypt } = useAnalytics()

  return (
    <div className="panel panel-analytics">
      <div className="panel-header">
        <span className="panel-title">ANALYTICS</span>
        {distributions.length > 0 && (
          <span className="panel-badge">{distributions.length} distributions</span>
        )}
      </div>

      <div className="panel-body">
        {distributions.length === 0 ? (
          <p className="panel-empty">No distributions yet</p>
        ) : (
          <div className="analytics-list">
            {distributions.map((d) => {
              const pct = completionBps(d.claimedCount, d.recipientCount)
              const isComplete = d.claimedCount === d.recipientCount

              return (
                <div key={d.id} className="distribution-card">
                  <div className="dist-header">
                    <span className="dist-id">{d.distributionId}</span>
                    <span className="dist-time">{timeAgo(d.timestamp)}</span>
                  </div>

                  {/* Health bar */}
                  <div className="health-bar-track">
                    <div
                      className="health-bar-fill"
                      style={{ width: `${pct}%`, opacity: isComplete ? 1 : 0.7 }}
                    />
                  </div>
                  <div className="health-labels">
                    <span>{d.claimedCount} claimed</span>
                    <span>{d.recipientCount - d.claimedCount} remaining</span>
                    <span className={isComplete ? "health-complete" : ""}>{pct}%</span>
                  </div>

                  {/* Encrypted metrics */}
                  <div className="enc-metrics">
                    <div className="enc-metric">
                      <span className="enc-metric-label">TOTAL DISTRIBUTED</span>
                      {d.encTotalDecrypted !== undefined ? (
                        <span className="enc-metric-value">{d.encTotalDecrypted.toString()}</span>
                      ) : (
                        <div className="redacted-block">
                          <span className="redacted-text">██████████</span>
                        </div>
                      )}
                    </div>
                    <div className="enc-metric">
                      <span className="enc-metric-label">AVG ALLOCATION</span>
                      {d.encAverageDecrypted !== undefined ? (
                        <span className="enc-metric-value">{d.encAverageDecrypted.toString()}</span>
                      ) : (
                        <div className="redacted-block">
                          <span className="redacted-text">██████</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Decrypt button */}
                  {d.encTotalDecrypted === undefined && (
                    <button
                      className="btn-ghost btn-decrypt"
                      onClick={() => decrypt(d.id)}
                      disabled={d.isDecrypting}
                    >
                      {d.isDecrypting ? "Decrypting..." : "Decrypt Analytics"}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
