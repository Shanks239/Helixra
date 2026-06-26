import { useRef } from "react"
import type { Recipient } from "../../lib/parseCSV"

interface Props {
  recipients: Recipient[]
  invalidCount: number
  isDragging: boolean
  setIsDragging: (v: boolean) => void
  onDrop: (e: React.DragEvent) => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function PanelRecipients({
  recipients,
  invalidCount,
  isDragging,
  setIsDragging,
  onDrop,
  onFileChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="panel panel-recipients">
      <div className="panel-header">
        <span className="panel-title">RECIPIENTS</span>
        {recipients.length > 0 && (
          <span className="panel-badge">
            {recipients.length - invalidCount} valid
            {invalidCount > 0 && (
              <span className="panel-badge-error"> · {invalidCount} invalid</span>
            )}
          </span>
        )}
      </div>
      <div className="panel-body">
        {recipients.length === 0 ? (
          <div
            className={`drop-zone ${isDragging ? "drop-zone--active" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="drop-zone-icon">⬆</div>
            <div className="drop-zone-label">Drop CSV or click to upload</div>
            <div className="drop-zone-hint">address, amount, label</div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
          </div>
        ) : (
          <>
            <div className="recipient-list">
              {recipients.map((r, i) => (
                <div key={i} className={`recipient-row ${!r.valid ? "recipient-row--invalid" : ""}`}>
                  <div className="recipient-row-left">
                    <span className="recipient-address">{truncate(r.address)}</span>
                    {r.label && <span className="recipient-label">{r.label}</span>}
                  </div>
                  <div className="recipient-row-right">
                    {r.valid ? (
                      <span className="recipient-amount">{r.amount.toString()}</span>
                    ) : (
                      <span className="recipient-error">{r.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-ghost" onClick={() => fileRef.current?.click()} style={{ marginTop: 16 }}>
              Replace CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              style={{ display: "none" }}
              onChange={onFileChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
