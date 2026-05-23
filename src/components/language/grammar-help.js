import { escapeHtml, humanizeLabel } from "../../utils.js";

export function hasGrammarAnalysis(analysis) {
  return !!(
    analysis &&
    (
      analysis.sentencePattern ||
      analysis.literalOrderExplanation ||
      (Array.isArray(analysis.grammarExplanation) && analysis.grammarExplanation.length) ||
      (Array.isArray(analysis.tokens) && analysis.tokens.length)
    )
  );
}

export function renderSentencePatternCard(analysis) {
  if (!analysis || (!analysis.sentencePattern && !analysis.literalOrderExplanation)) return "";
  return `
    <section class="grammar-section grammar-pattern-card">
      ${analysis.sentencePattern ? `
        <p class="grammar-section-label">Sentence Pattern</p>
        <strong>${escapeHtml(analysis.sentencePattern)}</strong>
      ` : ""}
      ${analysis.literalOrderExplanation ? `
        <p class="grammar-section-label">Literal Order</p>
        <span>${escapeHtml(analysis.literalOrderExplanation)}</span>
      ` : ""}
    </section>
  `;
}

export function renderGrammarHelpPanel(analysis, { id = "", open = false, includeTokens = true, compact = false, hideSummary = false } = {}) {
  if (!hasGrammarAnalysis(analysis)) return "";
  const panel = `
    <div class="grammar-help-panel ${compact ? "is-compact" : ""}" ${id ? `id="${escapeHtml(id)}"` : ""}>
      ${renderSentencePatternCard(analysis)}
      ${renderGrammarNotes(analysis)}
      ${includeTokens ? renderGrammarTokenTable(analysis.tokens || []) : ""}
    </div>
  `;

  if (hideSummary) return panel;

  return `
    <details class="grammar-help-details" ${open ? "open" : ""}>
      <summary>Grammar help</summary>
      ${panel}
    </details>
  `;
}

export function renderGrammarTokenTooltip(token, { label = null, className = "" } = {}) {
  if (!token) return "";
  const visibleLabel = label || token.text || token.type || "";
  const tooltip = [
    token.type ? humanizeLabel(token.type) : "",
    token.role ? humanizeLabel(token.role) : "",
    token.meaning || "",
    token.grammarNote || "",
  ].filter(Boolean);

  return `
    <span class="grammar-token-tip ${className}" tabindex="0">
      ${escapeHtml(visibleLabel)}
      ${tooltip.length ? `<span class="grammar-token-popup" role="tooltip">${tooltip.map(escapeHtml).join("<br>")}</span>` : ""}
    </span>
  `;
}

export function renderGrammarTokenTable(tokens = []) {
  if (!Array.isArray(tokens) || !tokens.length) return "";
  return `
    <section class="grammar-section">
      <p class="grammar-section-label">Token Breakdown</p>
      <div class="grammar-token-table-wrap">
        <table class="grammar-token-table">
          <thead>
            <tr>
              <th>Token</th>
              <th>Type</th>
              <th>Role</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            ${tokens.map((token) => `
              <tr>
                <td>${renderGrammarTokenTooltip(token)}</td>
                <td>${escapeHtml(humanizeLabel(token.type || ""))}</td>
                <td>${escapeHtml(humanizeLabel(token.role || ""))}</td>
                <td>
                  ${escapeHtml(token.meaning || "")}
                  ${token.grammarNote ? `<p class="tiny muted">${escapeHtml(token.grammarNote)}</p>` : ""}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderGrammarNotes(analysis) {
  const notes = Array.isArray(analysis?.grammarExplanation) ? analysis.grammarExplanation : [];
  if (!notes.length) return "";
  return `
    <section class="grammar-section">
      <p class="grammar-section-label">Grammar Notes</p>
      <ul class="grammar-notes">
        ${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
      </ul>
    </section>
  `;
}
