/**
 * useLessonSession.js
 *
 * Drives the progressive language lesson session.
 * Wraps the pure runProgressiveLessonAction state machine.
 *
 * Session memory (Features 1 & 2):
 *   - On mount: restores the most-recently-used language's next uncompleted lesson.
 *     Priority: language with the most lessons completed (furthest progress).
 *   - markLessonComplete(lessonId, targetLang): persists lesson completion and
 *     advances to the next lesson automatically.
 *   - Language-specific: German progress is stored separately from Japanese, etc.
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
import { loadStoredState, saveStoredState } from "@/storage.js";

// ── Lesson progress helpers ──────────────────────────────────────────────────

/** Read the full languageLadder progress object from storage. */
function readProgress() {
  return loadStoredState().prefs.languageLadder;
}

/** Persist a mutation to the languageLadder progress. */
function writeProgress(fn) {
  const state = loadStoredState();
  if (!state.prefs.languageLadder) state.prefs.languageLadder = { lastLang: "", langs: {} };
  fn(state.prefs.languageLadder);
  saveStoredState(state);
}

/**
 * Given the catalog and stored progress, find the best lesson to resume:
 * - Pick the language with the most completed lessons (furthest progress).
 * - Within that language, pick the first lesson NOT yet completed.
 * - Falls back to first lesson of first language if nothing is stored.
 *
 * @returns {{ packId, stageId, lessonId, packPath, targetLang } | null}
 */
function pickResumeLesson(catalog) {
  if (!catalog?.packs?.length) return null;

  const progress = readProgress();
  const langs = progress?.langs ?? {};

  // Find the language with the most completed lessons (highest progress).
  let bestLang = null;
  let bestCount = -1;
  for (const [code, info] of Object.entries(langs)) {
    const count = info.completedLessons?.length ?? 0;
    if (count > bestCount) { bestCount = count; bestLang = code; }
  }

  // Prefer the lastLang if it has progress too (recency tie-break).
  const lastLang = progress?.lastLang;
  if (lastLang && langs[lastLang] && (langs[lastLang].completedLessons?.length ?? 0) > 0) {
    bestLang = lastLang;
  }

  const targetLang = bestLang || null;
  const completed  = new Set(langs[targetLang]?.completedLessons ?? []);

  // Walk catalog: first lesson not yet in completedLessons.
  for (const catPack of catalog.packs) {
    for (const stage of catPack.stages) {
      for (const lesson of stage.lessons) {
        if (!completed.has(lesson.id)) {
          return {
            packId: catPack.id, stageId: stage.id,
            lessonId: lesson.id, packPath: lesson.path,
            targetLang,
          };
        }
      }
    }
  }
  return null; // all lessons complete — fall through to default
}

/**
 * Given the current lessonId in a catalog, return the next lesson descriptor
 * or null if there is none.
 */
function findNextLesson(catalog, currentLessonId) {
  for (const catPack of catalog.packs) {
    for (const stage of catPack.stages) {
      const idx = stage.lessons.findIndex(l => l.id === currentLessonId);
      if (idx !== -1) {
        const next = stage.lessons[idx + 1];
        return next
          ? { packId: catPack.id, stageId: stage.id, lessonId: next.id, packPath: next.path }
          : null;
      }
    }
  }
  return null;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

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
        setCatalog(cat);

        // Restore last position from session memory.
        const resume = pickResumeLesson(cat);
        let state = createProgressiveLessonState(cat);

        if (resume) {
          const catPack  = cat.packs.find(p => p.id === resume.packId);
          const catStage = catPack?.stages.find(s => s.id === resume.stageId);
          const lesson   = catStage?.lessons.find(l => l.id === resume.lessonId);
          if (lesson) {
            state = {
              ...state,
              catalogPackId:   resume.packId,
              catalogStageId:  resume.stageId,
              catalogLessonId: resume.lessonId,
              packPath:        resume.packPath,
              ...(resume.targetLang ? { targetLang: resume.targetLang } : {}),
            };
          }
        }
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
        setSession(prev => prev ? {
          ...prev,
          vocabOptions: buildVocabOptions(p, prev.vocabIndex ?? 0, prev.targetLang),
        } : prev);
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

  // ── Auto-speak each listen step ────────────────────────────────────────────
  useEffect(() => {
    if (!session || !pack || session.phase !== "listen") return;
    const cue = getCurrentSpeechCue(session, pack);
    if (!cue || cue.key === spokenKeyRef.current) return;
    const timer = setTimeout(() => {
      spokenKeyRef.current = cue.key;
      speakText(cue.text, cue.lang);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.chainIndex, session?.stepIndex, session?.targetLang, session?.phase, pack]);

  // ── Generic action dispatcher ──────────────────────────────────────────────
  const dispatch = useCallback((actionType, data = {}) => {
    setSession(prev => {
      if (!prev || !pack) return prev;
      const { state: next, effect } = runProgressiveLessonAction(prev, pack, actionType, data);
      if (effect?.speak) speakText(effect.speak.text, effect.speak.lang);
      if (next.packPath !== prev.packPath) spokenKeyRef.current = null;
      return next;
    });
  }, [pack]);

  const speakCurrentCue = useCallback(() => {
    if (!session || !pack || session.phase !== "listen") return;
    const cue = getCurrentSpeechCue(session, pack);
    if (!cue) return;
    spokenKeyRef.current = cue.key;
    speakText(cue.text, cue.lang);
  }, [session, pack]);

  // ── Selector-based setters ────────────────────────────────────────────────
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
    setSession(prev => ({
      ...prev, catalogLessonId: lessonId, packPath: newLesson.path,
      phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
    }));
  }, [catalog, session?.catalogPackId, session?.catalogStageId]);

  const setLanguageSelection = useCallback((lang) => {
    if (!pack || !session) return;
    spokenKeyRef.current = null;
    // Persist language choice as the "last used language" for this session.
    writeProgress(prog => { prog.lastLang = lang; });
    setSession(prev => {
      if (!prev) return prev;
      const { state: next } = runProgressiveLessonAction(prev, pack, "pl-change-language", { lang });
      return next;
    });
  }, [pack, session]);

  // ── Session memory: mark a lesson complete ────────────────────────────────
  /**
   * Called when the Arcade phase completes (all vocabulary + sentences passed).
   * Persists the completion and returns the next lesson info (or null if last).
   */
  const markLessonComplete = useCallback((lessonId, targetLang) => {
    if (!catalog || !lessonId) return null;
    writeProgress(prog => {
      if (!prog.langs) prog.langs = {};
      if (!prog.langs[targetLang]) {
        prog.langs[targetLang] = { completedLessons: [], currentLessonId: "", lastOpenedAt: "" };
      }
      const entry = prog.langs[targetLang];
      if (!entry.completedLessons.includes(lessonId)) {
        entry.completedLessons.push(lessonId);
      }
      entry.lastOpenedAt = new Date().toISOString();
      prog.lastLang = targetLang;
    });
    return findNextLesson(catalog, lessonId);
  }, [catalog]);

  /**
   * Jump to a specific lesson (e.g. the next one after marking complete).
   * If nextLesson is null, the session goes to review phase of the current lesson.
   */
  const goToLesson = useCallback((nextLesson, targetLang) => {
    if (!nextLesson) {
      // No more lessons — just show review of the current one.
      setSession(prev => prev ? { ...prev, phase: "review" } : prev);
      return;
    }
    // Update storage with the new "current" lesson for this language.
    writeProgress(prog => {
      if (!prog.langs) prog.langs = {};
      if (!prog.langs[targetLang]) {
        prog.langs[targetLang] = { completedLessons: [], currentLessonId: "", lastOpenedAt: "" };
      }
      prog.langs[targetLang].currentLessonId = nextLesson.lessonId;
      prog.langs[targetLang].lastOpenedAt = new Date().toISOString();
      prog.lastLang = targetLang;
    });
    spokenKeyRef.current = null;
    setSession(prev => ({
      ...prev,
      catalogPackId:   nextLesson.packId,
      catalogStageId:  nextLesson.stageId,
      catalogLessonId: nextLesson.lessonId,
      packPath:        nextLesson.packPath,
      phase: "listen", chainIndex: 0, stepIndex: 0, vocabIndex: 0,
      // Reset scoring for fresh lesson.
      answered: { vocab: {}, builder: {} },
      mistakes: [], score: { vocabCorrect: 0, vocabTotal: 0, builderCorrect: 0, builderTotal: 0 },
    }));
  }, []);

  const advanceToReview = useCallback(() => {
    setSession(prev => prev ? { ...prev, phase: "review" } : prev);
  }, []);

  return {
    catalog, pack, session, loadError,
    dispatch, speakCurrentCue,
    setPackSelection, setStageSelection, setLessonSelection, setLanguageSelection,
    markLessonComplete, goToLesson, advanceToReview,
    SPEECH_LANG_MAP,
  };
}
