/** LessonStepper — 5-step progress bar: Listen → Vocab → Builder → Arcade → Review */
const PHASES = [
  { id: "listen",  label: "Listen",     icon: "🎧" },
  { id: "vocab",   label: "Vocabulary", icon: "📖" },
  { id: "builder", label: "Builder",    icon: "🔧" },
  { id: "arcade",  label: "Arcade",     icon: "🎮" },
  { id: "review",  label: "Review",     icon: "✓"  },
];
const JUMPABLE = new Set(["listen", "vocab", "builder"]);

export default function LessonStepper({ currentPhase, onJump, showListen = true, session }) {
  const phases = showListen ? PHASES : PHASES.filter((phase) => phase.id !== "listen");
  const currentIdx = phases.findIndex(p => p.id === currentPhase);
  
  function getPhaseStatus(phaseId) {
    if (!session) return "pending";
    if (phaseId === "listen") return session.chainIndex > -1 ? "active" : "pending";
    if (phaseId === "vocab") return session.vocabIndex > -1 ? "active" : "pending";
    if (phaseId === "builder") return session.sentenceIndex > -1 ? "active" : "pending";
    if (phaseId === "arcade") return session.phase === "arcade" ? "active" : "pending";
    return "pending";
  }
  
  function getPhaseStatusIcon(phaseId) {
    const status = getPhaseStatus(phaseId);
    const currentIndex = phases.findIndex(p => p.id === currentPhase);
    const phaseIndex = phases.findIndex(p => p.id === phaseId);
    
    if (status === "active") return "▶";
    if (phaseIndex < currentIndex) return "✓";
    return "";
  }

  return (
    <nav className="pl-stepper" aria-label="Lesson phases">
      {phases.map((phase, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const cls    = done ? "done" : active ? "active" : "";
        const phaseStatus = getPhaseStatus(phase.id);
        const statusIcon = getPhaseStatusIcon(phase.id);
        
        // Add status class
        let statusCls = "";
        if (phaseStatus === "active" && !active) statusCls = " active";
        else if (done) statusCls = " done";
        
        const inner  = (
          <>
            <span className="pl-step-circle">{statusIcon || (done ? "✓" : i + 1)}</span>
            <span className="pl-step-label">{phase.icon} {phase.label}</span>
          </>
        );
        return (
          <span key={phase.id} style={{ display: "contents" }}>
            {i > 0 && <div className={`pl-step-line${done ? " done" : ""}`} />}
            {JUMPABLE.has(phase.id) && onJump
              ? <button className={`pl-step ${cls}`} data-testid={`lesson-step-${phase.id}`} onClick={() => onJump(phase.id)}
                  aria-current={active ? "step" : undefined}>{inner}</button>
              : <div className={`pl-step ${cls}`} data-testid={`lesson-step-${phase.id}`} aria-current={active ? "step" : undefined}>{inner}</div>
            }
          </span>
        );
      })}
    </nav>
  );
}
