/**
 * useLessonSession.js
 *
 * React hook that drives the progressive language lesson session.
 * Wraps the pure runProgressiveLessonAction state machine from
 * progressive-language-lesson.js — keeps ALL lesson logic in one place,
 * replaces the vanilla event-delegation + dangerouslySetInnerHTML bridge.
 *
 * Returns the current session state plus typed action dispatchers so
 * phase components never import from progressive-language-lesson directly.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  loadProgressiveLessonCatalog,
  loadProgressiveLessonPack,
  createProgressiveLessonState,
  buildVocabOptions,
  runProgressiveLessonAction,
  getCurrentSpeechCue,
  SPEECH_LANG_MAP,
} from "@/progressive-language-lesson.js";
import { speakText } from "@/utils.js";

export function useLessonSession() {
  const [catalog,   setCatalog]   = useState(null);
  const [pack,      setPack]      = useState(null);
  const [session,   setSession]   = useState(null);
  const [loadError, setLoadError] = useState(null);

  const spokenKeyRef = useRef(null);

  // ── Load catalog on mount ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    loadProgressiveLessonCatalog()
      .then(cat => {
        if (cancelled) return;
        const state = createProgressiveLessonState(cat);
        setCatalog(cat);
        setSession(state);
      })
      .catch(err => { if (!cancelled) setLoadError(err.message); });
    return () => { cancelled = true; };
  }, []);

  // ── Load pack whenever packPath changes ────────────────────────────────────
  useEffect(() => {
    if (!session?.packPath) return;
    let cancelled = false;
    loadProgressiveLessonPack(session.packPath)
      .then(p => {
        if (cancelled) return;
        setPack(p);
        // Rebuild vocabOptions for new pack
        setSession(prev => prev ? {
          ...prev,
          vocabOptions: buildVocabOptions(p, prev.vocabIndex ?? 0, prev.targetLang),
        } : prev);
        // Auto-speak first listen cue (best-effort, may be blocked without prior gesture)
        setTimeout(() => {
          if (cancelled) return;
          setSession(cur => {
            if (!cur || cur.phase !== "listen") return cur;
            const cue = getCurrentSpeechCue(cur, p);
            if (cue && cue.key !== spokenKeyRef.current) {
              spokenKeyRef.current = cue.key;
              speakText(cue.text, cue.lang);
            }
            return cur;
          });
        }, 350);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.packPath]);

  // ── Generic action dispatcher ──────────────────────────────────────────────
  const dispatch = useCallback((actionType, data = {}) => {
    setSession(prev => {
      if (!prev || !pack) return prev;
      const { state: next, effect } = runProgressiveLessonAction(prev, pack, actionType, data);
      if (effect?.speak) {
        speakText(effect.speak.text, effect.speak.lang);
      }
      if (next.packPath !== prev.packPath) spokenKeyRef.current = null;
      return next;
    });
  }, [pack]);

  // Speak the current listen cue (call within user gesture to avoid autoplay blocks)
  const speakCurrentCue = useCallback(() => {
    if (!session || !pack || session.phase !== "listen") return;
    const cue = getCurrentSpeechCue(session, pack);
    if (!cue) return;
    spokenKeyRef.current = cue.key;
    speakText(cue.text, cue.lang);
  }, [session, pack]);

  // ── Selector-based setters (for <select> changes) ─────────────────────────
  const setPackSelection = useCallback((packId) => {
    if (!catalog) return;
    const catPack   = catalog.packs.find(p => p.id === packId);
    const newStage  = catPack?.stages[0];
    const newLesson = newStage?.lessons[0];
    spokenKeyRef.current = null;
    setSession(prev => ({
      ...prev,
      catalogPackId: packId,
      catalogStageId:  newStage?.id   ?? "",
      catalogLessonId: newLesson?.id  ?? "",
      packPath:        newLesson?.path ?? "",
      phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
    }));
  }, [catalog]);

  const setStageSelection = useCallback((stageId) => {
    if (!catalog || !session) return;
    const catPack   = catalog.packs.find(p => p.id === session.catalogPackId);
    const newStage  = catPack?.stages.find(s => s.id === stageId);
    const newLesson = newStage?.lessons[0];
    spokenKeyRef.current = null;
    setSession(prev => ({
      ...prev,
      catalogStageId:  stageId,
      catalogLessonId: newLesson?.id  ?? "",
      packPath:        newLesson?.path ?? "",
      phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
    }));
  }, [catalog, session?.catalogPackId]);

  const setLessonSelection = useCallback((lessonId) => {
    if (!catalog || !session) return;
    const catPack   = catalog.packs.find(p => p.id === session.catalogPackId);
    const catStage  = catPack?.stages.find(s => s.id === session.catalogStageId);
    const newLesson = catStage?.lessons.find(l => l.id === lessonId);
    if (!newLesson) return;
    spokenKeyRef.current = null;
    setSession(prev => ({ ...prev, catalogLessonId: lessonId, packPath: newLesson.path,
      phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0 }));
  }, [catalog, session?.catalogPackId, session?.catalogStageId]);

  const setLanguageSelection = useCallback((lang) => {
    if (!pack) return;
    spokenKeyRef.current = null;
    setSession(prev => {
      if (!prev) return prev;
      const { state: next } = runProgressiveLessonAction(prev, pack, "pl-change-language", { lang });
      return next;
    });
  }, [pack]);

  // Convenience for LanguageArcadePhase to advance past arcade → review
  const advanceToReview = useCallback(() => {
    setSession(prev => prev ? { ...prev, phase: "review" } : prev);
  }, []);

  return {
    catalog, pack, session, loadError,
    dispatch, speakCurrentCue,
    setPackSelection, setStageSelection, setLessonSelection, setLanguageSelection,
    advanceToReview,
    SPEECH_LANG_MAP,
  };
}
