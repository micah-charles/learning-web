/**
 * Controls.jsx
 *
 * Shared UI primitives used across multiple pages.
 * All components use `lw-*` design-system classes and CSS variables —
 * no additional stylesheets or CSS modules needed.
 *
 * Exports:
 *   LabeledSelect  – labeled <select> with consistent styling
 *   PillGroup      – horizontal pill-button toggle (single or multi-select)
 *   FilterRow      – flex-wrap row that holds filter controls
 *   EmptyState     – "nothing to show" placeholder card
 *   LoadingText    – inline loading placeholder
 */

// ─── LabeledSelect ───────────────────────────────────────────────────────────

/**
 * A labeled <select> element with the standard lw- styling.
 *
 * @param {string}   label      - Text label shown above the select
 * @param {*}        value      - Controlled value
 * @param {Function} onChange   - Called with the new string value
 * @param {object}   [style]    - Extra style for the outer wrapper
 * @param {boolean}  [flex]     - Whether to set flex: "1 1 200px" (default true)
 * @param {ReactNode} children  - <option> elements
 */
export function LabeledSelect({ label, value, onChange, style, flex = true, children }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        ...(flex ? { flex: "1 1 200px" } : {}),
        ...style,
      }}
    >
      <label
        style={{
          fontSize: "0.8rem",
          color: "var(--lw-muted)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "8px 12px",
          borderRadius: "8px",
          border: "1.5px solid var(--lw-line)",
          background: "var(--lw-panel)",
          color: "var(--lw-ink)",
          fontFamily: "inherit",
          fontSize: "0.9rem",
          cursor: "pointer",
        }}
      >
        {children}
      </select>
    </div>
  );
}

// ─── PillGroup ────────────────────────────────────────────────────────────────

/**
 * Horizontal row of lw-nav-pill toggle buttons.
 *
 * @param {string}   [label]    - Optional label shown above the pills
 * @param {Array}    items      - [{ id, label }] or plain strings/numbers
 * @param {*}        value      - Currently active value (single-select)
 * @param {Function} onSelect   - Called with item id when a pill is clicked
 * @param {object}   [style]    - Extra style for the outer wrapper
 */
export function PillGroup({ label, items = [], value, onSelect, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        ...style,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--lw-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {items.map((item) => {
          const id    = typeof item === "object" ? item.id    : item;
          const text  = typeof item === "object" ? item.label : String(item);
          const active = String(value) === String(id);
          return (
            <button
              key={id}
              type="button"
              className={`lw-nav-pill${active ? " active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => onSelect(id)}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── ToggleGroup ──────────────────────────────────────────────────────────────

/**
 * Like PillGroup but supports multi-select (Set of selected ids).
 *
 * @param {string}   [label]      - Optional label
 * @param {Array}    items        - [{ id, label }] or plain strings/numbers
 * @param {Set|Array} selected    - Set or array of currently-selected ids
 * @param {Function} onToggle     - Called with item id to toggle
 * @param {object}   [style]      - Extra style
 */
export function ToggleGroup({ label, items = [], selected = [], onToggle, style }) {
  const selectedSet = selected instanceof Set ? selected : new Set(selected.map(String));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        ...style,
      }}
    >
      {label && (
        <span
          style={{
            fontSize: "0.8rem",
            color: "var(--lw-muted)",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {label}
        </span>
      )}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        {items.map((item) => {
          const id   = typeof item === "object" ? item.id    : item;
          const text = typeof item === "object" ? item.label : String(item);
          const active = selectedSet.has(String(id));
          return (
            <button
              key={id}
              type="button"
              className={`lw-nav-pill${active ? " active" : ""}`}
              style={{ padding: "6px 14px", fontSize: "0.85rem" }}
              onClick={() => onToggle(id)}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── FilterRow ────────────────────────────────────────────────────────────────

/**
 * A flex-wrap row that holds a row of filter controls.
 *
 * @param {ReactNode} children
 * @param {object}   [style]   - Extra style merged into the container
 */
export function FilterRow({ children, style }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "flex-end",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

/**
 * A centred "nothing here" placeholder block.
 *
 * @param {string} [title]   - Bold heading (default "Nothing here")
 * @param {string} [message] - Supporting sentence
 * @param {object} [style]   - Extra style
 */
export function EmptyState({ title = "Nothing here", message, style }) {
  return (
    <div className="lw-empty" style={style}>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}

// ─── LoadingText ──────────────────────────────────────────────────────────────

/**
 * Minimal inline loading indicator.
 *
 * @param {string} [text] - Text to show (default "Loading…")
 */
export function LoadingText({ text = "Loading…" }) {
  return (
    <p style={{ color: "var(--lw-muted)", fontStyle: "italic" }}>{text}</p>
  );
}
