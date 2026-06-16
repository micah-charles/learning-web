export default function VoicePracticeModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--lw-bg, #fff)",
          borderRadius: "16px",
          padding: "24px",
          maxWidth: "520px",
          width: "90vw",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{title || "Voice Practice"}</h3>
          <button
            type="button"
            className="lw-btn lw-btn-ghost"
            onClick={onClose}
            style={{ fontSize: "1.2rem", padding: "4px 10px", minWidth: "44px", minHeight: "44px" }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
