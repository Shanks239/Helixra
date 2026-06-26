import { usePreflight } from "../../hooks/usePreflight"
import { useDisperseFlow } from "../../hooks/useDisperseFlow"
import type { CheckStatus } from "../../hooks/usePreflight"
import type { Recipient } from "../../lib/parseCSV"

interface Props {
  recipients: Recipient[]
}

const STATUS_ICON: Record<CheckStatus, string> = {
  idle:     "○",
  checking: "◌",
  pass:     "✓",
  fail:     "✗",
  warn:     "△",
}

const STATUS_CLASS: Record<CheckStatus, string> = {
  idle:     "check-idle",
  checking: "check-checking",
  pass:     "check-pass",
  fail:     "check-fail",
  warn:     "check-warn",
}

const STAGE_LABEL: Record<string, string> = {
  idle:        "Execute Disperse",
  registering: "Registering wallets...",
  approving:   "Approving token...",
  dispersing:  "Dispersing...",
  recording:   "Recording analytics...",
  done:        "Complete",
  error:       "Retry",
}

export default function PanelPreflight({ recipients }: Props) {
  const { checks, isReady, hasErrors } = usePreflight(recipients)
  const { execute, stage, error, txHash } = useDisperseFlow()

  return (
    <div className="panel panel-preflight">
      <div className="panel-header">
        <span className="panel-title">PREFLIGHT</span>
        {recipients.length > 0 && (
          <span className={"panel-badge " + (hasErrors ? "panel-badge-error" : isReady ? "panel-badge-ready" : "")}>
            {hasErrors ? "action required" : isReady ? "ready" : "checking"}
          </span>
        )}
      </div>

      <div className="panel-body">
        {recipients.length === 0 ? (
          <p className="panel-empty">Awaiting recipients</p>
        ) : (
          <div className="checklist">
            {checks.map((check) => (
              <div key={check.id} className={"check-row " + STATUS_CLASS[check.status]}>
                <div className="check-row-left">
                  <span className={"check-icon " + STATUS_CLASS[check.status]}>
                    {check.status === "checking"
                      ? <span className="check-spinner">◌</span>
                      : STATUS_ICON[check.status]
                    }
                  </span>
                  <span className="check-label">{check.label}</span>
                </div>
                {check.detail && (
                  <span className="check-detail">{check.detail}</span>
                )}
              </div>
            ))}

            {error && (
              <div className="disperse-error">{error}</div>
            )}

            {txHash && stage === "done" && (
              <a
                className="tx-link"
                href={"https://sepolia.etherscan.io/tx/" + txHash}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Etherscan
              </a>
            )}

            <button
              className="btn-primary"
              style={{ marginTop: 24 }}
              disabled={!isReady || stage === "dispersing" || stage === "done"}
              onClick={() => execute(recipients)}
            >
              {STAGE_LABEL[stage] ?? "Execute Disperse"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}