import { useRecipients } from "../hooks/useRecipients";
import PanelRecipients from "../components/panels/PanelRecipients";
import PanelPreflight from "../components/panels/PanelPreflight";
import PanelAnalytics from "../components/panels/PanelAnalytics";

export default function Sender() {
  const {
    recipients,
    validRecipients,
    invalidCount,
    isDragging,
    setIsDragging,
    onDrop,
    onFileChange,
  } = useRecipients();

  return (
    <div className="workspace">
      <PanelRecipients
        recipients={recipients}
        invalidCount={invalidCount}
        isDragging={isDragging}
        setIsDragging={setIsDragging}
        onDrop={onDrop}
        onFileChange={onFileChange}
      />
      <PanelPreflight recipients={validRecipients} />
      <PanelAnalytics />
    </div>
  );
}
