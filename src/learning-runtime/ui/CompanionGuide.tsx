export default function CompanionGuide({
  image,
  message,
  minimized,
  onToggle,
}: {
  image?: string;
  message: string;
  minimized: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`flr-companion${minimized ? " is-minimized" : ""}`} aria-label="FoxChild companion">
      {image && <img src={image} alt="FoxChild learning companion" width="112" height="112" />}
      {!minimized && <div><p className="flr-eyebrow">Your companion</p><p>{message}</p></div>}
      <button type="button" onClick={onToggle} aria-label={minimized ? "Show companion guidance" : "Minimise companion guidance"}>{minimized ? "✦" : "×"}</button>
    </aside>
  );
}
