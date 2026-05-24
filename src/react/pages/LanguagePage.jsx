/**
 * LanguagePage.jsx
 *
 * Progressive Language tab — bridges the vanilla progressive-language-lesson.js
 * engine into the React app shell.
 *
 * Strategy: render the vanilla HTML string into a ref-div via
 * dangerouslySetInnerHTML; delegate click events to runProgressiveLessonAction;
 * use the browser SpeechSynthesis API for audio cues.
 *
 * This keeps the exact same UI and interaction model without rewriting 995 lines
 * of carefully tuned lesson logic.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadProgressiveLessonCatalog,
  loadProgressiveLessonPack,
  createProgressiveLessonState,
  buildVocabOptions,
  runProgressiveLessonAction,
  getCurrentSpeechCue,
  renderProgressiveTab,
} from "@/progressive-language-lesson.js";
import { speakText } from "@/utils.js";

// ─── Auto-speak for listen phase ──────────────────────────────────────────────
// Best-effort: may be blocked on initial load (no prior user gesture).
// Navigation-triggered speak is handled inline in handleClick instead.

function scheduleAutoSpeak(state, pack, spokenRef) {
  if (!state || !pack || state.phase !== "listen") return;
  const cue = getCurrentSpeechCue(state, pack);
  if (!cue || cue.key === spokenRef.current) return;
  spokenRef.current = cue.key;
  setTimeout(() => speakText(cue.text, cue.lang), 350);
}

// Speak the current listen-phase cue immediately (within a user gesture).
function speakListenCue(state, pack, spokenRef) {
  if (!state || !pack || state.phase !== "listen") return;
  const cue = getCurrentSpeechCue(state, pack);
  if (!cue || cue.key === spokenRef.current) return;
  spokenRef.current = cue.key;
  speakText(cue.text, cue.lang);
}

// ─── LanguagePage ─────────────────────────────────────────────────────────────

export default function LanguagePage() {
  const [catalog, setCatalog] = useState(null);
  const [pack, setPack]       = useState(null);
  const [plState, setPlState] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const containerRef = useRef(null);
  const spokenKeyRef = useRef(null); // tracks last auto-spoken step key

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const cat = await loadProgressiveLessonCatalog();
        if (cancelled) return;
        const state = createProgressiveLessonState(cat);
        setCatalog(cat);
        setPlState(state);

        if (state.packPath) {
          const p = await loadProgressiveLessonPack(state.packPath);
          if (cancelled) return;
          const withOptions = {
            ...state,
            vocabOptions: buildVocabOptions(p, state.vocabIndex ?? 0, state.targetLang),
          };
          setPack(p);
          setPlState(withOptions);
          scheduleAutoSpeak(withOptions, p, spokenKeyRef);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      }
    }
    init();
    return () => { cancelled = true; };
  }, []);

  // ── Load pack whenever packPath changes ────────────────────────────────────
  useEffect(() => {
    if (!plState?.packPath) return;
    let cancelled = false;
    loadProgressiveLessonPack(plState.packPath).then((p) => {
      if (cancelled) return;
      const withOptions = {
        ...plState,
        vocabOptions: buildVocabOptions(p, plState.vocabIndex ?? 0, plState.targetLang),
      };
      setPack(p);
      setPlState(withOptions);
      scheduleAutoSpeak(withOptions, p, spokenKeyRef);
    }).catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plState?.packPath]);

  // ── Click delegation on the vanilla-rendered container ────────────────────
  const handleClick = useCallback(
    (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (!action || !action.startsWith("pl-")) return;
      e.preventDefault();
      if (!plState || !pack) return;

      const { state: newState, effect } = runProgressiveLessonAction(
        plState,
        pack,
        action,
        btn.dataset,
      );

      if (effect?.speak) {
        // Explicit speak effect (e.g. pl-replay button) — within user gesture.
        speakText(effect.speak.text, effect.speak.lang);
      } else {
        // For listen-phase navigation (Next/Back) speak the new cue inline so
        // the call is still within the user-gesture window (avoids browser
        // autoplay blocking that would occur inside a setTimeout).
        speakListenCue(newState, pack, spokenKeyRef);
      }

      setPlState(newState);
      if (newState.packPath !== plState.packPath) {
        spokenKeyRef.current = null; // new pack → reset spoken key
      }
    },
    [plState, pack],
  );

  // ── Change delegation (inputs + pl-* select elements) ─────────────────────
  const handleChange = useCallback(
    (e) => {
      const target = e.target;
      const value  = target.value;

      // ── pl-* <select> elements (rendered by progressive-language-lesson.js).
      // These have id="pl-*-select" but no data-action attribute, so they need
      // special ID-based handling.
      if (target.tagName === "SELECT" && target.id?.startsWith("pl-")) {
        if (!plState) return;

        if (target.id === "pl-language-select" && pack) {
          // Delegate to the action reducer — it resets all phase state cleanly.
          const { state: newState } = runProgressiveLessonAction(
            plState, pack, "pl-change-language", { lang: value },
          );
          setPlState(newState);
          spokenKeyRef.current = null;
          return;
        }

        if (target.id === "pl-pack-select" && catalog) {
          const newCatPack = catalog.packs.find(p => p.id === value);
          if (!newCatPack) return;
          const newStage  = newCatPack.stages[0];
          const newLesson = newStage?.lessons[0];
          spokenKeyRef.current = null;
          setPlState(prev => ({
            ...prev,
            catalogPackId:   value,
            catalogStageId:  newStage?.id   ?? "",
            catalogLessonId: newLesson?.id  ?? "",
            packPath:        newLesson?.path ?? "",
            phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
          }));
          return;
        }

        if (target.id === "pl-stage-select" && catalog) {
          const catPack   = catalog.packs.find(p => p.id === plState.catalogPackId);
          const newStage  = catPack?.stages.find(s => s.id === value);
          const newLesson = newStage?.lessons[0];
          spokenKeyRef.current = null;
          setPlState(prev => ({
            ...prev,
            catalogStageId:  value,
            catalogLessonId: newLesson?.id  ?? "",
            packPath:        newLesson?.path ?? "",
            phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
          }));
          return;
        }

        if (target.id === "pl-lesson-select" && catalog) {
          const catPack   = catalog.packs.find(p => p.id === plState.catalogPackId);
          const catStage  = catPack?.stages.find(s => s.id === plState.catalogStageId);
          const newLesson = catStage?.lessons.find(l => l.id === value);
          if (!newLesson) return;
          spokenKeyRef.current = null;
          setPlState(prev => ({
            ...prev,
            catalogLessonId: value,
            packPath:        newLesson.path,
            phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
          }));
          return;
        }
        return;
      }

      // ── Input elements with data-action (vocab typing / builder tiles)
      const input = target.closest("input[data-action]");
      if (!input) return;
      const action = input.dataset.action;
      if (!action || !action.startsWith("pl-")) return;
      if (!plState || !pack) return;

      const { state: newState, effect } = runProgressiveLessonAction(
        plState,
        pack,
        action,
        { ...input.dataset, value: input.value },
      );
      if (effect?.speak) speakText(effect.speak.text, effect.speak.lang);
      setPlState(newState);
    },
    [plState, pack, catalog],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <p style={{ color: "var(--lw-coral)" }}>Failed to load progressive lesson: {loadError}</p>
        </div>
      </div>
    );
  }

  if (!catalog || !plState) {
    return (
      <div className="lw-page">
        <div className="lw-card">
          <p style={{ color: "var(--lw-muted)", fontStyle: "italic" }}>Loading lessons…</p>
        </div>
      </div>
    );
  }

  const html = renderProgressiveTab(plState, catalog, pack);

  return (
    <div
      ref={containerRef}
      className="lw-page lw-pl-bridge"
      onClick={handleClick}
      onChange={handleChange}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
