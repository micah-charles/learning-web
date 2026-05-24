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

// ─── Speech helper ────────────────────────────────────────────────────────────

function speak(text, lang) {
  if (!text || typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = lang || "en-GB";
  window.speechSynthesis.speak(utt);
}

// ─── Auto-speak for listen phase ──────────────────────────────────────────────

function scheduleAutoSpeak(state, pack, spokenRef) {
  if (!state || !pack || state.phase !== "listen") return;
  const cue = getCurrentSpeechCue(state, pack);
  if (!cue || cue.key === spokenRef.current) return;
  spokenRef.current = cue.key;
  setTimeout(() => speak(cue.text, cue.lang), 350);
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
        speak(effect.speak.text, effect.speak.lang);
      }

      // If pack changed (lesson navigation), the packPath watcher will reload.
      setPlState(newState);
      if (newState.packPath === plState.packPath) {
        scheduleAutoSpeak(newState, pack, spokenKeyRef);
      } else {
        spokenKeyRef.current = null; // new pack → reset spoken key
      }
    },
    [plState, pack],
  );

  // ── Input delegation (vocab typing / builder) ──────────────────────────────
  const handleChange = useCallback(
    (e) => {
      const input = e.target.closest("input[data-action]");
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
      if (effect?.speak) speak(effect.speak.text, effect.speak.lang);
      setPlState(newState);
    },
    [plState, pack],
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
