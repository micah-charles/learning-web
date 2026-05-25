/**
 * progressive-language-lesson.js
 *
 * Vanilla JS module for the Progressive Language tab.
 * Provides: catalog loading, pack loading, state management,
 * action reducer, and HTML render functions.
 *
 * No framework. Follows the Learning Web vanilla JS + Vite pattern.
 */

import { escapeHtml, shuffle } from "./utils.js";

// ── Constants ─────────────────────────────────────────────────────────────────

export const TARGET_LANGUAGES = [
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
];

const SPEECH_LANG_MAP = {
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-HK",
  ja: "ja-JP",
  en: "en-GB",
};

const PHASES = [
  { id: "listen",  label: "Listen",     icon: "🎧" },
  { id: "vocab",   label: "Vocabulary", icon: "📖" },
  { id: "builder", label: "Builder",    icon: "🔧" },
  { id: "review",  label: "Review",     icon: "✓"  },
];

// ── Data loading ──────────────────────────────────────────────────────────────

export async function loadProgressiveLessonCatalog() {
  const res = await fetch("./data/ProgressiveLanguagePacks/manifest.json");
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`);
  return res.json();
}

export async function loadProgressiveLessonPack(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Pack fetch failed (${path}): ${res.status}`);
  return res.json();
}

// ── Display helpers ───────────────────────────────────────────────────────────

export function getDisplayText(translation, lang) {
  if (!translation) return "";
  const mainText = translation.text || translation.base || "";
  if (!mainText) return "";
  const { article } = translation;
  if (article && (lang === "de" || lang === "fr" || lang === "es")) {
    if (article.endsWith("'") || article.endsWith("’")) return article + mainText;
    return `${article} ${mainText}`;
  }
  return mainText;
}

export function getReadingHint(translation, lang) {
  if (!translation) return "";
  if (lang === "zh") return translation.reading || translation.pinyin || "";
  if (lang === "ja") return translation.reading || translation.romaji || "";
  return "";
}

function getLangLabel(code) {
  return TARGET_LANGUAGES.find(l => l.code === code)?.label || code;
}

function getLangFlag(code) {
  return TARGET_LANGUAGES.find(l => l.code === code)?.flag || "";
}

// ── State ─────────────────────────────────────────────────────────────────────

function freshState(overrides = {}) {
  return {
    catalogPackId:   "",
    catalogStageId:  "",
    catalogLessonId: "",
    packPath:        "",
    targetLang:      "de",
    phase:           "listen",
    // Listen
    chainIndex:      0,
    stepIndex:       0,
    showGrammar:     false,
    showGrammarLabels: false,
    spokenStepKey:   "",
    // Vocab
    vocabIndex:      0,
    vocabOptions:    [],
    vocabFeedback:   null,
    // Builder
    sentenceIndex:   0,
    selectedTiles:   [],
    bankTiles:       [],
    builderFeedback: null,
    showBuilderGrammar: false,
    // Tracking
    answered:        { vocab: {}, builder: {} },
    mistakes:        [],
    score:           { vocabCorrect: 0, vocabTotal: 0, builderCorrect: 0, builderTotal: 0 },
    ...overrides,
  };
}

export function createProgressiveLessonState(catalog) {
  const firstPack   = catalog.packs[0];
  const firstStage  = firstPack?.stages[0];
  const firstLesson = firstStage?.lessons[0];
  return freshState({
    catalogPackId:   firstPack?.id   ?? "",
    catalogStageId:  firstStage?.id  ?? "",
    catalogLessonId: firstLesson?.id ?? "",
    packPath:        firstLesson?.path ?? "",
  });
}

// ── Vocab helpers ─────────────────────────────────────────────────────────────

export function buildVocabOptions(pack, vocabIndex, targetLang) {
  const vocab = pack?.vocabulary || [];
  const current = vocab[vocabIndex];
  if (!current) return [];
  const correctText = getDisplayText(current.translations?.[targetLang], targetLang);
  const distractors = vocab
    .filter((_, i) => i !== vocabIndex)
    .map(v => getDisplayText(v.translations?.[targetLang], targetLang))
    .filter(t => t && t !== correctText);
  const seen = new Set([correctText]);
  const unique = shuffle(distractors).filter(t => { if (seen.has(t)) return false; seen.add(t); return true; });
  return shuffle([
    { text: correctText, correct: true },
    ...unique.slice(0, 3).map(t => ({ text: t, correct: false })),
  ]);
}

// ── Tile helpers ──────────────────────────────────────────────────────────────

function makeBankTiles(pack, sentenceIndex, targetLang) {
  const sentence = pack?.sentenceBuilders?.[sentenceIndex];
  const translation = sentence?.translations?.[targetLang];
  if (!translation) return [];
  const tiles = (translation.tiles || translation.text?.split(" ") || [])
    .map((text, i) => ({ id: `t${i}_${encodeURIComponent(text)}`, text }));
  return shuffle(tiles);
}

export function compareTiles(selected, expected) {
  if (!Array.isArray(selected) || !Array.isArray(expected)) return false;
  if (selected.length !== expected.length) return false;
  return selected.every((tile, i) => tile.text === expected[i]);
}

// ── Speech cue ────────────────────────────────────────────────────────────────

export function getCurrentSpeechCue(state, pack) {
  if (state.phase !== "listen") return null;
  const chain = pack?.phraseProgressionChains?.[state.chainIndex];
  const step  = chain?.steps?.[state.stepIndex];
  const text  = step?.translations?.[state.targetLang]?.text;
  if (!text) return null;
  return {
    text,
    lang: SPEECH_LANG_MAP[state.targetLang] || "en-GB",
    key:  `${state.chainIndex}-${state.stepIndex}-${state.targetLang}`,
  };
}

// ── Action reducer ────────────────────────────────────────────────────────────
// Returns { state, effect }  where effect is null | { speak: {text, lang} }

export function runProgressiveLessonAction(state, pack, actionType, data = {}) {
  const chains   = pack?.phraseProgressionChains || [];
  const vocab    = pack?.vocabulary || [];
  const builders = pack?.sentenceBuilders || [];

  switch (actionType) {

    // ── Jump to phase ───────────────────────────────────────────────────────
    case "pl-jump-phase": {
      const phase = data.phase;
      if (phase === "listen") {
        return {
          state: { ...state, phase: "listen", vocabFeedback: null, builderFeedback: null, showGrammar: false },
          effect: null,
        };
      }
      if (phase === "vocab") {
        const idx = Math.min(state.vocabIndex, Math.max(0, vocab.length - 1));
        return {
          state: {
            ...state, phase: "vocab",
            vocabIndex: idx,
            vocabOptions: buildVocabOptions(pack, idx, state.targetLang),
            vocabFeedback: null, builderFeedback: null,
          },
          effect: null,
        };
      }
      if (phase === "builder") {
        const idx = Math.min(state.sentenceIndex, Math.max(0, builders.length - 1));
        return {
          state: {
            ...state, phase: "builder",
            sentenceIndex: idx,
            bankTiles: makeBankTiles(pack, idx, state.targetLang),
            selectedTiles: [], builderFeedback: null, showBuilderGrammar: false,
          },
          effect: null,
        };
      }
      return { state, effect: null };
    }

    // ── Listen: replay ──────────────────────────────────────────────────────
    case "pl-replay": {
      const cue = getCurrentSpeechCue(state, pack);
      return { state, effect: cue ? { speak: cue } : null };
    }

    // ── Listen: back ────────────────────────────────────────────────────────
    case "pl-listen-back": {
      if (state.stepIndex > 0) {
        return { state: { ...state, stepIndex: state.stepIndex - 1, showGrammar: false }, effect: null };
      }
      if (state.chainIndex > 0) {
        const prevChain = chains[state.chainIndex - 1];
        const lastStep  = Math.max(0, (prevChain?.steps?.length ?? 1) - 1);
        return { state: { ...state, chainIndex: state.chainIndex - 1, stepIndex: lastStep, showGrammar: false }, effect: null };
      }
      return { state, effect: null };
    }

    // ── Listen: next ────────────────────────────────────────────────────────
    case "pl-listen-next": {
      const chain = chains[state.chainIndex];
      if (state.stepIndex < (chain?.steps?.length ?? 0) - 1) {
        const next = { ...state, stepIndex: state.stepIndex + 1, showGrammar: false };
        return { state: next, effect: null };
      }
      if (state.chainIndex < chains.length - 1) {
        const next = { ...state, chainIndex: state.chainIndex + 1, stepIndex: 0, showGrammar: false };
        return { state: next, effect: null };
      }
      // Advance to vocab
      return {
        state: {
          ...state, phase: "vocab",
          vocabIndex: 0,
          vocabOptions: buildVocabOptions(pack, 0, state.targetLang),
          vocabFeedback: null, showGrammar: false,
        },
        effect: null,
      };
    }

    case "pl-toggle-grammar": {
      return { state: { ...state, showGrammar: !state.showGrammar }, effect: null };
    }

    case "pl-toggle-grammar-labels": {
      return { state: { ...state, showGrammarLabels: !state.showGrammarLabels }, effect: null };
    }

    // ── Vocab: answer ───────────────────────────────────────────────────────
    case "pl-vocab-answer": {
      const conceptId = vocab[state.vocabIndex]?.conceptId;
      if (!conceptId) return { state, effect: null };
      const correct       = data.correct === "true";
      const isFirstAttempt = !state.answered.vocab[conceptId];
      const newAnswered   = { ...state.answered, vocab: { ...state.answered.vocab, [conceptId]: true } };
      const newScore      = { ...state.score };
      const newMistakes   = [...state.mistakes];

      if (isFirstAttempt) {
        newScore.vocabTotal += 1;
        if (correct) {
          newScore.vocabCorrect += 1;
        } else {
          const cv = vocab[state.vocabIndex];
          newMistakes.push({
            phase:    "Vocabulary",
            conceptId,
            prompt:   getDisplayText(cv?.translations?.en, "en"),
            expected: getDisplayText(cv?.translations?.[state.targetLang], state.targetLang),
            selected: data.selectedText || "",
          });
        }
      }

      return {
        state: {
          ...state, answered: newAnswered,
          vocabFeedback: { correct, selectedText: data.selectedText || "" },
          score: newScore, mistakes: newMistakes,
        },
        effect: null,
      };
    }

    // ── Vocab: next ─────────────────────────────────────────────────────────
    case "pl-vocab-next": {
      if (state.vocabIndex < vocab.length - 1) {
        const idx = state.vocabIndex + 1;
        return {
          state: { ...state, vocabIndex: idx, vocabOptions: buildVocabOptions(pack, idx, state.targetLang), vocabFeedback: null },
          effect: null,
        };
      }
      // Advance to builder
      return {
        state: {
          ...state, phase: "builder",
          sentenceIndex: 0,
          bankTiles: makeBankTiles(pack, 0, state.targetLang),
          selectedTiles: [], builderFeedback: null, vocabFeedback: null,
        },
        effect: null,
      };
    }

    // ── Vocab: back ─────────────────────────────────────────────────────────
    case "pl-vocab-back": {
      if (state.vocabIndex > 0) {
        const idx = state.vocabIndex - 1;
        return {
          state: { ...state, vocabIndex: idx, vocabOptions: buildVocabOptions(pack, idx, state.targetLang), vocabFeedback: null },
          effect: null,
        };
      }
      const lastChain = chains.length - 1;
      return {
        state: {
          ...state, phase: "listen",
          chainIndex: Math.max(0, lastChain),
          stepIndex:  Math.max(0, (chains[lastChain]?.steps?.length ?? 1) - 1),
          vocabFeedback: null,
        },
        effect: null,
      };
    }

    // ── Builder: pick tile ──────────────────────────────────────────────────
    case "pl-builder-pick": {
      const tile = state.bankTiles.find(t => t.id === data.tileId);
      if (!tile) return { state, effect: null };
      return {
        state: {
          ...state,
          selectedTiles: [...state.selectedTiles, tile],
          bankTiles:     state.bankTiles.filter(t => t.id !== data.tileId),
          builderFeedback: null,
        },
        effect: null,
      };
    }

    // ── Builder: return tile ────────────────────────────────────────────────
    case "pl-builder-remove": {
      const tile = state.selectedTiles.find(t => t.id === data.tileId);
      if (!tile) return { state, effect: null };
      return {
        state: {
          ...state,
          bankTiles:     [...state.bankTiles, tile],
          selectedTiles: state.selectedTiles.filter(t => t.id !== data.tileId),
          builderFeedback: null,
        },
        effect: null,
      };
    }

    // ── Builder: reset ──────────────────────────────────────────────────────
    case "pl-builder-reset": {
      return {
        state: {
          ...state,
          selectedTiles: [],
          bankTiles:     makeBankTiles(pack, state.sentenceIndex, state.targetLang),
          builderFeedback: null,
        },
        effect: null,
      };
    }

    // ── Builder: check ──────────────────────────────────────────────────────
    case "pl-builder-check": {
      const sentence   = builders[state.sentenceIndex];
      const trans      = sentence?.translations?.[state.targetLang];
      const expected   = trans?.tiles || [];
      const correct    = compareTiles(state.selectedTiles, expected);
      const sid        = sentence?.sentenceId;
      const isFirst    = sid && !state.answered.builder[sid];
      const newAnswered = sid
        ? { ...state.answered, builder: { ...state.answered.builder, [sid]: true } }
        : state.answered;
      const newScore    = { ...state.score };
      const newMistakes = [...state.mistakes];

      if (isFirst) {
        newScore.builderTotal += 1;
        if (correct) {
          newScore.builderCorrect += 1;
        } else {
          newMistakes.push({
            phase:    "Sentence builder",
            conceptId:(sentence.concepts || [])[0] || sid,
            prompt:   sentence.translations?.en?.text || "",
            expected: expected.join(" "),
            selected: state.selectedTiles.map(t => t.text).join(" "),
          });
        }
      }

      return {
        state: { ...state, answered: newAnswered, builderFeedback: { correct }, score: newScore, mistakes: newMistakes },
        effect: null,
      };
    }

    // ── Builder: next ───────────────────────────────────────────────────────
    case "pl-builder-next": {
      if (state.sentenceIndex < builders.length - 1) {
        const idx = state.sentenceIndex + 1;
        return {
          state: {
            ...state,
            sentenceIndex: idx,
            bankTiles:     makeBankTiles(pack, idx, state.targetLang),
            selectedTiles: [], builderFeedback: null,
          },
          effect: null,
        };
      }
      return { state: { ...state, phase: "review", builderFeedback: null }, effect: null };
    }

    // ── Builder: back ───────────────────────────────────────────────────────
    case "pl-builder-back": {
      if (state.sentenceIndex > 0) {
        const idx = state.sentenceIndex - 1;
        return {
          state: {
            ...state,
            sentenceIndex: idx,
            bankTiles:     makeBankTiles(pack, idx, state.targetLang),
            selectedTiles: [], builderFeedback: null,
          },
          effect: null,
        };
      }
      const lastVocab = Math.max(0, vocab.length - 1);
      return {
        state: {
          ...state, phase: "vocab",
          vocabIndex:   lastVocab,
          vocabOptions: buildVocabOptions(pack, lastVocab, state.targetLang),
          vocabFeedback: null, builderFeedback: null,
        },
        effect: null,
      };
    }

    case "pl-toggle-builder-grammar": {
      return { state: { ...state, showBuilderGrammar: !state.showBuilderGrammar }, effect: null };
    }

    // ── Review: restart / change language ───────────────────────────────────
    case "pl-restart": {
      return {
        state: freshState({
          catalogPackId:   state.catalogPackId,
          catalogStageId:  state.catalogStageId,
          catalogLessonId: state.catalogLessonId,
          packPath:        state.packPath,
          targetLang:      state.targetLang,
          vocabOptions:    buildVocabOptions(pack, 0, state.targetLang),
        }),
        effect: null,
      };
    }

    case "pl-change-language": {
      const lang = data.lang || "de";
      return {
        state: freshState({
          catalogPackId:   state.catalogPackId,
          catalogStageId:  state.catalogStageId,
          catalogLessonId: state.catalogLessonId,
          packPath:        state.packPath,
          targetLang:      lang,
          vocabOptions:    buildVocabOptions(pack, 0, lang),
        }),
        effect: null,
      };
    }

    default:
      return { state, effect: null };
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// Rendering
// ═════════════════════════════════════════════════════════════════════════════

function foxFace(expr = "calm") {
  return `<img src="./brand/fox-tutor/transparent/${escapeHtml(expr)}.png" class="fox-mascot" alt="" aria-hidden="true"/>`;
}

function plFeedback(correct, okMsg, errMsg) {
  const expr = correct ? "happy" : "sad";
  return `
    <div class="feedback ${correct ? "correct" : "wrong"}" style="margin-top:14px;">
      <div class="feedback-header">
        <span class="feedback-icon">${foxFace(expr)}</span>
        <strong>${escapeHtml(correct ? okMsg : errMsg)}</strong>
      </div>
    </div>`;
}

// ── Header card ───────────────────────────────────────────────────────────────

function renderHeaderCard(state, catalog, pack) {
  const catPack  = catalog.packs.find(p => p.id === state.catalogPackId);
  const catStage = catPack?.stages.find(s => s.id === state.catalogStageId);

  const packOpts = catalog.packs.map(p =>
    `<option value="${escapeHtml(p.id)}" ${p.id === state.catalogPackId ? "selected" : ""}>${escapeHtml(p.label)}</option>`
  ).join("");
  const stageOpts = (catPack?.stages || []).map(s =>
    `<option value="${escapeHtml(s.id)}" ${s.id === state.catalogStageId ? "selected" : ""}>${escapeHtml(s.label)}</option>`
  ).join("");
  const lessonOpts = (catStage?.lessons || []).map(l =>
    `<option value="${escapeHtml(l.id)}" ${l.id === state.catalogLessonId ? "selected" : ""}>${escapeHtml(l.label)}</option>`
  ).join("");
  const langOpts = TARGET_LANGUAGES.map(l =>
    `<option value="${escapeHtml(l.code)}" ${l.code === state.targetLang ? "selected" : ""}>${escapeHtml(l.flag)} ${escapeHtml(l.label)}</option>`
  ).join("");

  const phaseIdx = PHASES.findIndex(p => p.id === state.phase);
  const phasePct  = Math.round((phaseIdx / PHASES.length) * 100);

  const grammarTargets = pack?.sourceTopic?.grammarTargets?.[state.targetLang] || [];
  const grammarBadges  = grammarTargets.slice(0, 3).map(g =>
    `<span class="badge amber">${escapeHtml(g.replace(/_/g, " "))}</span>`
  ).join("");

  return `
    <div class="pl-header-card section-card">
      <p class="eyebrow" style="color:var(--fox-teal);margin-bottom:4px;">Language Ladder</p>
      <h2 class="pl-lesson-title">${escapeHtml(pack?.title || catStage?.lessons.find(l => l.id === state.catalogLessonId)?.label || "Lesson")}</h2>
      ${pack?.description ? `<p class="muted tiny pl-lesson-desc">${escapeHtml(pack.description)}</p>` : ""}
      <div class="pl-meta-row">
        <span class="badge blue">EN</span>
        <span class="pl-arrow">→</span>
        <span class="badge coral">${escapeHtml(getLangFlag(state.targetLang))} ${escapeHtml(getLangLabel(state.targetLang))}</span>
        ${grammarBadges}
      </div>
      <div class="pl-header-controls">
        <label class="pl-ctrl-label">Pack<select id="pl-pack-select">${packOpts}</select></label>
        <label class="pl-ctrl-label">Stage<select id="pl-stage-select">${stageOpts}</select></label>
        <label class="pl-ctrl-label">Lesson<select id="pl-lesson-select">${lessonOpts}</select></label>
        <label class="pl-ctrl-label">Language<select id="pl-language-select">${langOpts}</select></label>
      </div>
      ${phasePct > 0 ? `
        <div class="pl-lesson-progress-bar" title="${phasePct}% through lesson">
          <div class="pl-lesson-progress-fill" style="width:${phasePct}%"></div>
        </div>` : ""}
    </div>`;
}

// ── Phase stepper ─────────────────────────────────────────────────────────────

function renderStepper(currentPhase) {
  const currentIdx = PHASES.findIndex(p => p.id === currentPhase);
  return `
    <nav class="pl-stepper" aria-label="Lesson phases">
      ${PHASES.map((phase, i) => {
        const done   = i < currentIdx;
        const active = i === currentIdx;
        const cls    = done ? "done" : active ? "active" : "";
        const isJumpable = i < 3; // Review is not a direct jump target
        const inner  = `
          <span class="pl-step-circle">${done ? "✓" : i + 1}</span>
          <span class="pl-step-label">${escapeHtml(phase.icon)} ${escapeHtml(phase.label)}</span>`;
        return `
          ${i > 0 ? `<div class="pl-step-line ${done ? "done" : ""}"></div>` : ""}
          ${isJumpable
            ? `<button class="pl-step ${cls}" data-action="pl-jump-phase" data-phase="${phase.id}" aria-current="${active ? "step" : "false"}" title="Go to ${phase.label}">${inner}</button>`
            : `<div class="pl-step ${cls}" aria-current="${active ? "step" : "false"}">${inner}</div>`
          }`;
      }).join("")}
    </nav>`;
}

// ── Grammar helpers ───────────────────────────────────────────────────────────

function hasGrammarAnalysis(translation) {
  const a = translation?.analysis;
  return !!(a?.grammarExplanation?.length || a?.tokens?.length || a?.sentencePattern);
}

function renderGrammarPanel(translation, targetLang) {
  if (!hasGrammarAnalysis(translation)) return "";
  const a = translation.analysis;
  const lang = getLangLabel(targetLang);

  const patternHtml = a.sentencePattern
    ? `<div class="pl-gram-row"><span class="pl-gram-key">Pattern</span><span class="pl-gram-val">${escapeHtml(a.sentencePattern)}</span></div>`
    : "";
  const literalHtml = a.literalOrderExplanation
    ? `<div class="pl-gram-row"><span class="pl-gram-key">Word order</span><span class="pl-gram-val pl-gram-literal">${escapeHtml(a.literalOrderExplanation)}</span></div>`
    : "";
  const explHtml = (a.grammarExplanation || []).length
    ? `<ul class="pl-gram-list">${a.grammarExplanation.map(e => `<li>${escapeHtml(e)}</li>`).join("")}</ul>`
    : "";
  const tokenDetails = (a.tokens || []).map(t => `
    <div class="pl-tok-detail">
      <span class="pl-tok-surface">${escapeHtml(t.text)}</span>
      ${t.meaning   ? `<span class="pl-tok-meaning">${escapeHtml(t.meaning)}</span>` : ""}
      ${t.grammarNote ? `<span class="pl-tok-note muted tiny">${escapeHtml(t.grammarNote)}</span>` : ""}
    </div>`).join("");

  return `
    <div class="pl-grammar-panel">
      <div class="pl-gram-head"><span>📚 ${escapeHtml(lang)} Grammar</span></div>
      <div class="pl-gram-body">
        ${patternHtml}${literalHtml}${explHtml}
        ${tokenDetails ? `<div class="pl-tok-details">${tokenDetails}</div>` : ""}
      </div>
    </div>`;
}

function renderTokenRow(translation, showLabels = false) {
  const tokens = translation?.analysis?.tokens;
  if (!tokens?.length) {
    const text = translation?.text || "";
    return text ? `<div class="pl-tok-row pl-tok-plain"><span>${escapeHtml(text)}</span></div>` : "";
  }
  return `
    <div class="pl-tok-row">
      ${tokens.map(t => `
        <div class="pl-tok" tabindex="0" title="${escapeHtml(t.meaning || "")}" aria-label="${escapeHtml(t.text)}: ${escapeHtml(t.meaning || "")}">
          <span class="pl-tok-surface">${escapeHtml(t.text)}</span>
          ${showLabels && t.meaning ? `<span class="pl-tok-gloss">${escapeHtml(t.meaning)}</span>` : ""}
        </div>`).join("")}
    </div>`;
}

// ── Listen phase ──────────────────────────────────────────────────────────────

function renderListenPhase(state, pack) {
  const chains = pack.phraseProgressionChains || [];
  if (!chains.length) return `<div class="section-card pl-lesson-card"><p class="muted">No phrase chains in this pack.</p></div>`;

  const totalSteps = chains.reduce((n, c) => n + (c.steps?.length || 0), 0);
  const doneBefore  = chains.slice(0, state.chainIndex).reduce((n, c) => n + (c.steps?.length || 0), 0);
  const doneSteps   = doneBefore + state.stepIndex + 1;
  const pct         = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const chain = chains[state.chainIndex];
  const step  = chain?.steps?.[state.stepIndex];
  if (!step) return `<div class="section-card pl-lesson-card"><p class="muted">No step data.</p></div>`;

  const enText     = step.translations?.en?.text || "";
  const targetTr   = step.translations?.[state.targetLang];
  const targetText = targetTr?.text || "";
  const reading    = getReadingHint(targetTr, state.targetLang);
  const focus      = step.focus ? step.focus.replace(/_/g, " ") : "";
  const hasGrammar = hasGrammarAnalysis(targetTr);
  const isFirst    = state.chainIndex === 0 && state.stepIndex === 0;
  const isLast     = state.chainIndex === chains.length - 1 && state.stepIndex === (chain?.steps?.length ?? 1) - 1;
  const speechLang = SPEECH_LANG_MAP[state.targetLang] || "en-GB";

  return `
    <div class="section-card pl-lesson-card">
      <div class="pl-phase-bar">
        <div class="pl-phase-bar-track"><div class="pl-phase-bar-fill" style="width:${pct}%"></div></div>
        <div class="pl-phase-bar-meta">
          <span class="pl-phase-name">🎧 Listen &amp; Repeat</span>
          <span class="muted tiny">Step ${doneSteps} / ${totalSteps}</span>
        </div>
      </div>

      ${focus ? `<div class="pl-focus-row"><span class="mode-chip blue">${escapeHtml(focus)}</span>${chain?.difficulty ? `<span class="muted tiny" style="margin-left:6px;">${escapeHtml(chain.difficulty)}</span>` : ""}</div>` : ""}

      <div class="pl-phrase-grid">
        <div class="pl-phrase-card en">
          <div class="pl-phrase-lang">English</div>
          <div class="pl-phrase-text">${escapeHtml(enText)}</div>
        </div>
        <div class="pl-phrase-card target">
          <div class="pl-phrase-lang">${escapeHtml(getLangFlag(state.targetLang))} ${escapeHtml(getLangLabel(state.targetLang))}</div>
          <div class="pl-phrase-text">${escapeHtml(targetText)}</div>
          ${reading ? `<div class="pl-phrase-reading">${escapeHtml(reading)}</div>` : ""}
          <div class="pl-audio-row">
            <button class="pl-audio-btn" data-action="pl-replay" title="Play audio">
              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/></svg>
              Play
            </button>
          </div>
        </div>
      </div>

      ${renderTokenRow(targetTr, state.showGrammarLabels)}

      ${hasGrammar ? `
        <div class="pl-grammar-row-actions">
          <button class="pl-gram-chip ${state.showGrammar ? "active" : ""}" data-action="pl-toggle-grammar">
            📚 ${state.showGrammar ? "Hide" : "Show"} grammar
          </button>
          <button class="button ghost pl-labels-btn" data-action="pl-toggle-grammar-labels" style="font-size:0.8rem;padding:4px 10px;">
            ${state.showGrammarLabels ? "Hide labels" : "Show word labels"}
          </button>
        </div>
        ${state.showGrammar ? renderGrammarPanel(targetTr, state.targetLang) : ""}
      ` : ""}

      <div class="pl-nav-row">
        <button class="button ghost" data-action="pl-listen-back" ${isFirst ? "disabled" : ""}>← Back</button>
        <button class="button" data-action="pl-listen-next">${isLast ? "Vocabulary →" : "Next →"}</button>
      </div>
    </div>`;
}

// ── Vocab phase ───────────────────────────────────────────────────────────────

function renderVocabPhase(state, pack) {
  const vocab = pack.vocabulary || [];
  if (!vocab.length) return `<div class="section-card pl-lesson-card"><p class="muted">No vocabulary in this pack.</p></div>`;

  const current  = vocab[state.vocabIndex];
  const pct      = Math.round((state.vocabIndex / vocab.length) * 100);
  const enText   = getDisplayText(current?.translations?.en, "en");
  const reading  = getReadingHint(current?.translations?.[state.targetLang], state.targetLang);
  const isLast   = state.vocabIndex >= vocab.length - 1;
  const answered = current?.conceptId && state.answered.vocab[current.conceptId];
  const options  = state.vocabOptions.length ? state.vocabOptions : buildVocabOptions(pack, state.vocabIndex, state.targetLang);

  const optionBtns = options.map(opt => {
    let cls = "option-button";
    if (answered) {
      if (opt.correct)                                                cls += " is-correct";
      else if (state.vocabFeedback?.selectedText === opt.text)        cls += " is-wrong";
    }
    return `
      <button class="${cls}"
        data-action="pl-vocab-answer"
        data-correct="${opt.correct}"
        data-selected-text="${escapeHtml(opt.text)}"
        data-concept-id="${escapeHtml(current?.conceptId || "")}"
        ${answered ? "disabled" : ""}>${escapeHtml(opt.text)}</button>`;
  }).join("");

  return `
    <div class="section-card pl-lesson-card">
      <div class="pl-phase-bar">
        <div class="pl-phase-bar-track"><div class="pl-phase-bar-fill" style="width:${pct}%"></div></div>
        <div class="pl-phase-bar-meta">
          <span class="pl-phase-name">📖 Vocabulary</span>
          <span class="muted tiny">${state.vocabIndex + 1} / ${vocab.length}</span>
        </div>
      </div>

      <div class="question-box">
        <div class="question-box-top">
          <div class="question-box-copy">
            <span class="mode-chip blue">What is the ${escapeHtml(getLangLabel(state.targetLang))} for…</span>
            <div class="question-prompt">${escapeHtml(enText)}</div>
            ${reading ? `<p class="muted tiny">${escapeHtml(reading)}</p>` : ""}
            <div class="badge-row" style="margin-top:6px;gap:5px;">
              ${current?.type ? `<span class="badge blue">${escapeHtml(current.type)}</span>` : ""}
              ${current?.semanticCategory ? `<span class="badge amber">${escapeHtml(current.semanticCategory)}</span>` : ""}
            </div>
          </div>
        </div>
      </div>

      <div class="option-grid" style="margin-top:14px;">${optionBtns}</div>

      ${state.vocabFeedback ? plFeedback(
        state.vocabFeedback.correct,
        "Correct! Well done.",
        `The ${getLangLabel(state.targetLang)} word was: ${getDisplayText(current?.translations?.[state.targetLang], state.targetLang)}`
      ) : ""}

      <div class="pl-nav-row" style="margin-top:${answered ? "14px" : "10px"};">
        <button class="button ghost" data-action="pl-vocab-back">← Back</button>
        ${answered ? `<button class="button" data-action="pl-vocab-next">${isLast ? "Builder →" : "Next word →"}</button>` : ""}
      </div>
    </div>`;
}

// ── Builder phase ─────────────────────────────────────────────────────────────

function renderBuilderPhase(state, pack) {
  const builders = pack.sentenceBuilders || [];
  if (!builders.length) return `<div class="section-card pl-lesson-card"><p class="muted">No sentence builders in this pack.</p></div>`;

  const sentence = builders[state.sentenceIndex];
  const targetTr = sentence?.translations?.[state.targetLang];
  const enText   = sentence?.translations?.en?.text || "";
  const pct      = Math.round((state.sentenceIndex / builders.length) * 100);
  const hasGram  = hasGrammarAnalysis(targetTr);
  const sid      = sentence?.sentenceId;
  const answered = sid && state.answered.builder[sid];
  const isLast   = state.sentenceIndex >= builders.length - 1;

  const answerArea = state.selectedTiles.length
    ? state.selectedTiles.map(t => `
        <button class="tile answer${answered ? (state.builderFeedback?.correct ? "" : " shake") : ""}"
                data-action="${answered ? "" : "pl-builder-remove"}"
                data-tile-id="${escapeHtml(t.id)}"
                ${answered ? "disabled" : ""}>${escapeHtml(t.text)}</button>`).join("")
    : `<span class="muted tiny" style="padding:8px 12px;display:block;">Tap tiles below to build the sentence</span>`;

  const bankArea = state.bankTiles.length
    ? state.bankTiles.map(t => `
        <button class="tile" data-action="${answered ? "" : "pl-builder-pick"}" data-tile-id="${escapeHtml(t.id)}" ${answered ? "disabled" : ""}>${escapeHtml(t.text)}</button>`).join("")
    : `<span class="muted tiny" style="padding:8px 12px;display:block;">All tiles placed</span>`;

  return `
    <div class="section-card pl-lesson-card">
      <div class="pl-phase-bar">
        <div class="pl-phase-bar-track"><div class="pl-phase-bar-fill" style="width:${pct}%"></div></div>
        <div class="pl-phase-bar-meta">
          <span class="pl-phase-name">🔧 Sentence Builder</span>
          <span class="muted tiny">${state.sentenceIndex + 1} / ${builders.length}</span>
        </div>
      </div>

      <div class="question-box">
        <div class="question-box-top">
          <div class="question-box-copy">
            <span class="mode-chip blue">Build in ${escapeHtml(getLangLabel(state.targetLang))}</span>
            <div class="question-prompt">${escapeHtml(enText)}</div>
            ${(sentence?.concepts || []).length ? `
              <div class="badge-row" style="margin-top:6px;gap:5px;">
                ${sentence.concepts.slice(0, 3).map(c => `<span class="badge amber">${escapeHtml(c)}</span>`).join("")}
              </div>` : ""}
          </div>
          ${hasGram ? `
            <button class="button ghost pl-gram-icon-btn" data-action="pl-toggle-builder-grammar" title="Grammar help">📚</button>` : ""}
        </div>
      </div>

      ${state.showBuilderGrammar && targetTr ? renderGrammarPanel(targetTr, state.targetLang) : ""}

      <div class="builder-shell" style="margin-top:16px;">
        <div class="pl-builder-zone">
          <div class="pl-builder-zone-head">
            <label class="pl-zone-label">Your answer</label>
          </div>
          <div class="tile-area ${answered && state.builderFeedback?.correct ? "answer-correct" : answered && state.builderFeedback && !state.builderFeedback.correct ? "answer-wrong" : ""}">${answerArea}</div>
        </div>
        <div class="pl-builder-zone">
          <div class="pl-builder-zone-head">
            <label class="pl-zone-label">Tiles</label>
            ${hasGram ? `
              <button class="button ghost pl-labels-btn" data-action="pl-toggle-grammar-labels" style="font-size:0.78rem;padding:3px 8px;">
                ${state.showGrammarLabels ? "Hide labels" : "Word labels"}
              </button>` : ""}
          </div>
          <div class="tile-area">${bankArea}</div>
        </div>
      </div>

      ${state.showGrammarLabels && targetTr ? renderTokenRow(targetTr, true) : ""}

      ${state.builderFeedback ? plFeedback(
        state.builderFeedback.correct,
        "Perfect! 🎉",
        "Not quite — try rearranging the tiles."
      ) : ""}

      <div class="pl-nav-row">
        <button class="button ghost" data-action="pl-builder-back">← Back</button>
        ${!answered ? `
          <button class="button secondary" data-action="pl-builder-reset">Reset</button>
          <button class="button" data-action="pl-builder-check" ${!state.selectedTiles.length ? "disabled" : ""}>Check answer</button>
        ` : `
          <button class="button" data-action="pl-builder-next">${isLast ? "Finish →" : "Next →"}</button>
        `}
      </div>
    </div>`;
}

// ── Review phase ──────────────────────────────────────────────────────────────

function renderReviewPhase(state, pack) {
  const { score, mistakes } = state;
  const total   = score.vocabTotal + score.builderTotal;
  const correct = score.vocabCorrect + score.builderCorrect;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const fox     = pct >= 80 ? "happy" : pct >= 50 ? "calm" : "sad";
  const color   = pct >= 70 ? "var(--color-success)" : pct >= 50 ? "var(--color-attention)" : "var(--color-error)";

  const mistakeItems = mistakes.map(m => `
    <div class="pl-mistake">
      <span class="badge ${m.phase === "Vocabulary" ? "blue" : "amber"}">${escapeHtml(m.phase)}</span>
      <div class="pl-mistake-body">
        <div class="pl-mistake-prompt">${escapeHtml(m.prompt)}</div>
        <div class="pl-mistake-compare">
          <span class="badge coral">${escapeHtml(m.selected || "(nothing)")}</span>
          <span class="muted tiny">→</span>
          <span class="badge green">${escapeHtml(m.expected)}</span>
        </div>
      </div>
    </div>`).join("");

  const langBtns = TARGET_LANGUAGES
    .filter(l => l.code !== state.targetLang)
    .slice(0, 2)
    .map(l => `<button class="button ghost" data-action="pl-change-language" data-lang="${l.code}" style="font-size:0.85rem;">${l.flag} Try in ${escapeHtml(l.label)}</button>`)
    .join("");

  return `
    <div class="section-card pl-lesson-card pl-review-card">
      <div class="pl-review-hero">
        ${foxFace(fox)}
        <div>
          <h2 class="pl-review-title">Lesson complete!</h2>
          <p class="muted tiny">${escapeHtml(pack?.title || "")}</p>
        </div>
      </div>

      <div class="pl-score-grid">
        <div class="pl-score-item">
          <span class="pl-score-big" style="color:${color};">${pct}%</span>
          <span class="pl-score-lbl">Overall</span>
        </div>
        <div class="pl-score-item">
          <span class="pl-score-big">${score.vocabCorrect}<span class="pl-score-denom">/${score.vocabTotal}</span></span>
          <span class="pl-score-lbl">Vocabulary</span>
        </div>
        <div class="pl-score-item">
          <span class="pl-score-big">${score.builderCorrect}<span class="pl-score-denom">/${score.builderTotal}</span></span>
          <span class="pl-score-lbl">Sentences</span>
        </div>
        ${mistakes.length ? `
          <div class="pl-score-item">
            <span class="pl-score-big" style="color:var(--color-attention);">${mistakes.length}</span>
            <span class="pl-score-lbl">To revisit</span>
          </div>` : ""}
      </div>

      ${mistakes.length ? `
        <div class="pl-mistakes">
          <h3 class="pl-mistakes-title">Items to review</h3>
          <div class="pl-mistake-list">${mistakeItems}</div>
        </div>` : `<p class="pl-perfect">🎉 No mistakes — excellent work!</p>`}

      <div class="pl-nav-row pl-review-nav">
        <button class="button" data-action="pl-restart">🔄 Restart</button>
        ${langBtns}
      </div>
    </div>`;
}

// ── Public render entry ───────────────────────────────────────────────────────

export function renderProgressiveTab(state, catalog, pack) {
  if (!catalog) {
    return `<div class="section-card"><p class="muted">Loading catalog…</p></div>`;
  }
  if (!pack) {
    return `<div class="section-card"><p class="muted">Loading lesson…</p></div>`;
  }

  let phaseContent;
  switch (state.phase) {
    case "listen":  phaseContent = renderListenPhase(state, pack);  break;
    case "vocab":   phaseContent = renderVocabPhase(state, pack);   break;
    case "builder": phaseContent = renderBuilderPhase(state, pack); break;
    default:        phaseContent = renderReviewPhase(state, pack);  break;
  }

  return `
    <div class="section-stack pl-shell">
      ${renderHeaderCard(state, catalog, pack)}
      ${renderStepper(state.phase)}
      ${phaseContent}
    </div>`;
}
