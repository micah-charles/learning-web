import { useCallback } from "react";
import { useProgress } from "../../../react/context/ProgressContext.jsx";
import {
  CHINESE_INPUT_EVENT_LIMIT,
  CHINESE_INPUT_SESSION_LIMIT,
  appendBounded,
} from "../domain/progress-migration.js";
import { updateCharacterMastery, updateRootMastery } from "../domain/mastery-engine.js";
import { migrateChineseInputCurriculumProgress } from "../domain/curriculum-migration.js";
import { evaluateAffectedWords } from "../domain/word-unlock-engine.js";

export default function useChineseInputProgress() {
  const { progress, updateProgress } = useProgress();
  const prefs = progress?.prefs?.chineseInputLab || {};
  const moduleProgress = progress?.progress?.chineseInputLab || {};

  const updatePrefs = useCallback((patch) => {
    updateProgress((state) => {
      Object.assign(state.prefs.chineseInputLab, patch);
    });
  }, [updateProgress]);

  const recordAttempt = useCallback(({
    lessonId,
    question,
    character,
    result,
    hintCount,
    firstTry,
    rootKey,
    occurredAt = new Date().toISOString(),
    wordIndex,
  }) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      const method = question.method;
      if (question.type !== "root-recognition") {
        const previousCharacter = lab.characters[character.id] || { cangjie: {}, quick: {} };
        lab.characters[character.id] = {
          ...previousCharacter,
          [method]: updateCharacterMastery(previousCharacter[method], result, {
            hintCount,
            firstTry,
            now: Date.parse(occurredAt),
          }),
        };
      }
      if (rootKey && !question.metadata?.inputToolKey) {
        lab.roots[rootKey] = updateRootMastery(lab.roots[rootKey], result, {
          durationMs: result.durationMs,
          now: Date.parse(occurredAt),
        });
      }
      const event = {
        eventVersion: 1,
        eventType: "chinese-input-attempt",
        occurredAt,
        sessionId: question.id.split("-").slice(0, -1).join("-"),
        lessonId,
        questionId: question.id,
        method,
        characterId: character?.id || null,
        codeLength: result.normalisedInput.length,
        correct: result.correct,
        errorType: result.errorType,
        hintLevel: hintCount,
        durationMs: result.durationMs,
        datasetVersion: question.metadata.datasetVersion,
      };
      lab.attemptEvents = appendBounded(lab.attemptEvents, event, CHINESE_INPUT_EVENT_LIMIT);
      if (wordIndex && character?.id) {
        const projection = evaluateAffectedWords({
          changedCharacterIds: [character.id],
          dependencyIndex: wordIndex,
          progress: lab,
          now: occurredAt,
        });
        for (const nextWord of projection.updatedWords) lab.words[nextWord.wordId] = nextWord;
        for (const discovery of projection.discoveries) {
          lab.wordDiscoveryEvents = appendBounded(
            lab.wordDiscoveryEvents,
            { ...discovery, sessionId: event.sessionId },
            CHINESE_INPUT_EVENT_LIMIT,
          );
        }
      }
    });
  }, [updateProgress]);

  const completeSession = useCallback((session) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      lab.sessions = appendBounded(lab.sessions, session, CHINESE_INPUT_SESSION_LIMIT);
      const previous = lab.lessons[session.lessonId] || {};
      lab.lessons[session.lessonId] = {
        ...previous,
        status: session.passed ? "completed" : "practising",
        attempts: (previous.attempts || 0) + 1,
        lastScore: session.accuracy,
        completedAt: session.passed ? session.completedAt : previous.completedAt,
        lastOpenedAt: session.completedAt,
      };
      state.prefs.chineseInputLab.lastLessonId = session.lessonId;
    });
  }, [updateProgress]);

  const completeGameSession = useCallback((session) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      lab.gameSessions = appendBounded(lab.gameSessions, session, CHINESE_INPUT_SESSION_LIMIT);
    });
  }, [updateProgress]);

  const recordWordAttempt = useCallback(({ wordId, mode, correct, hintCount = 0, occurredAt = new Date().toISOString() }) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      const previous = lab.words[wordId] || {
        wordId, state: "discovered", attempts: 0, correct: 0, hintCount: 0,
        meaningMastery: 0, readingMastery: 0, typingMastery: 0, contextMastery: 0,
      };
      const dimension = mode === "meaning" ? "meaningMastery" : mode === "reading" ? "readingMastery" : mode === "typing" ? "typingMastery" : "contextMastery";
      const nextMastery = Math.max(0, Math.min(100, (previous[dimension] || 0) + (correct ? 20 : -12) - hintCount * 3));
      const next = {
        ...previous,
        state: correct && nextMastery >= 80 ? "secure" : "learning",
        attempts: (previous.attempts || 0) + 1,
        correct: (previous.correct || 0) + (correct ? 1 : 0),
        hintCount: (previous.hintCount || 0) + hintCount,
        [dimension]: nextMastery,
        lastAttemptAt: occurredAt,
      };
      lab.words[wordId] = next;
      lab.attemptEvents = appendBounded(lab.attemptEvents, { eventVersion: 1, eventType: "chinese-input-word-attempt", occurredAt, wordId, mode, correct, hintLevel: hintCount, datasetVersion: lab.datasetVersion }, CHINESE_INPUT_EVENT_LIMIT);
    });
  }, [updateProgress]);

  const discoverNode = useCallback((id, kind = "knowledge") => {
    if (!id) return;
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      lab.discoveredNodes[id] = {
        ...(lab.discoveredNodes[id] || {}),
        kind,
        discoveredAt: lab.discoveredNodes[id]?.discoveredAt || new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
      };
    });
  }, [updateProgress]);

  const migrateCurriculum = useCallback(({ migration, lessons, inputDigest }) => {
    updateProgress((state) => {
      const current = state.progress.chineseInputLab;
      if (current.curriculumInputDigest === inputDigest) return;
      state.progress.chineseInputLab = migrateChineseInputCurriculumProgress(
        current,
        migration,
        lessons,
        inputDigest,
      );
    });
  }, [updateProgress]);

  return {
    prefs,
    moduleProgress,
    updatePrefs,
    recordAttempt,
    completeSession,
    completeGameSession,
    recordWordAttempt,
    discoverNode,
    migrateCurriculum,
  };
}
