type TimelineStage = "assigned" | "encrypted" | "available" | "decrypted" | "claimed"

interface Props {
  currentStage: TimelineStage
}

const STAGES: { id: TimelineStage; label: string }[] = [
  { id: "assigned",  label: "Assigned"  },
  { id: "encrypted", label: "Encrypted" },
  { id: "available", label: "Available" },
  { id: "decrypted", label: "Decrypted" },
  { id: "claimed",   label: "Claimed"   },
]

const ORDER: TimelineStage[] = ["assigned", "encrypted", "available", "decrypted", "claimed"]

export default function AllocationTimeline({ currentStage }: Props) {
  const currentIndex = ORDER.indexOf(currentStage)

  return (
    <div className="timeline">
      {STAGES.map((stage, i) => {
        const isPast    = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={stage.id} className="timeline-item">
            <div className={`timeline-dot ${isPast ? "dot-past" : isCurrent ? "dot-current" : "dot-future"}`} />
            {i < STAGES.length - 1 && (
              <div className={`timeline-line ${isPast ? "line-past" : "line-future"}`} />
            )}
            <span className={`timeline-label ${isCurrent ? "label-current" : i > currentIndex ? "label-future" : ""}`}>
              {stage.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
