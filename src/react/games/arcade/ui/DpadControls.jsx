/**
 * DpadControls.jsx — on-screen directional pad for touch (and mouse) play.
 * Swipe on the board also works; this is the explicit/precision option and the
 * keyboard-free path for younger players. Buttons call `onPress(dir)`.
 */
export default function DpadControls({ onPress }) {
  const press = (dir) => (e) => {
    // Prevent the tap from scrolling / losing focus from the board.
    e.preventDefault();
    onPress(dir);
  };
  return (
    <div className="arc-dpad" role="group" aria-label="Movement controls">
      <button type="button" className="arc-dpad-btn up"    onPointerDown={press("up")}    aria-label="Move up">▲</button>
      <button type="button" className="arc-dpad-btn left"  onPointerDown={press("left")}  aria-label="Move left">◀</button>
      <button type="button" className="arc-dpad-btn right" onPointerDown={press("right")} aria-label="Move right">▶</button>
      <button type="button" className="arc-dpad-btn down"  onPointerDown={press("down")}  aria-label="Move down">▼</button>
    </div>
  );
}
