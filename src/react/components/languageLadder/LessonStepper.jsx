/** LessonStepper — 5-step progress bar: Listen → Vocab → Builder → Arcade → Review */
const PHASES = [
  { id: "listen",  label: "Listen",     icon: "🎧" },
  { id: "vocab",   label: "Vocabulary", icon: "📖" },
  { id: "builder", label: "Builder",    icon: "🔧" },
  { id: "arcade",  label: "Arcade",     icon: "🎮" },
  { id: "review",  label: "Review",     icon: "✓"  },
];
const JUMPABLE = new Set(["listen", "vocab", "builder"]);

export default function LessonStepper({ currentPhase, onJump }) {
  const currentIdx = PHASES.findIndex(p => p.id === currentPhase);
  return (
    <nav className="pl-stepper" aria-label="Lesson phases">
      {PHASES.map((phase, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const cls    = done ? "done" : active ? "active" : "";
        const inner  = (
          <>
            <span className="pl-step-circle">{done ? "✓" : i + 1}</span>
            <span className="pl-step-label">{phase.icon} {phase.label}</span>
          </>
        );
        return (
          <span key={phase.id} style={{ display: "contents" }}>
            {i > 0 && <div className={`pl-step-line${done ? " done" : ""}`} />}
            {JUMPABLE.has(phase.id) && onJump
              ? <button className={`pl-step ${cls}`} onClick={() => onJump(phase.id)}
                  aria-current={active ? "step" : undefined}>{inner}</button>
              : <div className={`pl-step ${cls}`} aria-current={active ? "step" : undefined}>{inner}</div>
            }
          </span>
        );
      })}
    </nav>
  );
}
