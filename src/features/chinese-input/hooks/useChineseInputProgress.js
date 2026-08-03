import { useCallback } from "react";
import { useProgress } from "../../../react/context/ProgressContext.jsx";
import {
  CHINESE_INPUT_EVENT_LIMIT,
  CHINESE_INPUT_SESSION_LIMIT,
  appendBounded,
} from "../domain/progress-migration.js";
import { updateCharacterMastery, updateRootMastery } from "../domain/mastery-engine.js";
import { migrateChineseInputCurriculumProgress } from "../domain/curriculum-migration.js";

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
    sessionId = "",
    occurredAt = new Date().toISOString(),
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
      if (rootKey) {
        lab.roots[rootKey] = updateRootMastery(lab.roots[rootKey], result, {
          durationMs: result.durationMs,
          now: Date.parse(occurredAt),
        });
      }
      const event = {
        eventVersion: 1,
        eventType: "chinese-input-attempt",
        occurredAt,
        sessionId: sessionId || question.id.split("-").slice(0, -1).join("-"),
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
    });
  }, [updateProgress]);

  const completeSession = useCallback((session) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      if (lab.activeSession?.plan?.sessionId === session.sessionId) lab.activeSession = null;
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

  const beginSession = useCallback((plan) => {
    if (!plan?.sessionId) return;
    updateProgress((state) => {
      state.progress.chineseInputLab.activeSession = {
        plan,
        status: "active",
        startedAt: new Date().toISOString(),
        lastCheckpointAt: new Date().toISOString(),
      };
    });
  }, [updateProgress]);

  const abandonSession = useCallback((reason = "user-exit") => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      if (lab.activeSession) {
        const abandonedAt = new Date().toISOString();
        lab.sessions = appendBounded(lab.sessions, {
          sessionId: lab.activeSession.plan.sessionId,
          lessonId: lab.activeSession.plan.chapterRefs?.[0]?.chapterId || "",
          method: lab.activeSession.plan.presentation?.method || "",
          datasetVersion: lab.activeSession.plan.contentRevision,
          status: "abandoned",
          abandonedAt,
          abandonmentReason: reason,
        }, CHINESE_INPUT_SESSION_LIMIT);
      }
      lab.activeSession = null;
    });
  }, [updateProgress]);

  const completeGameSession = useCallback((session) => {
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      lab.gameSessions = appendBounded(lab.gameSessions, session, CHINESE_INPUT_SESSION_LIMIT);
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

  const discoverNode = useCallback((id, kind = "knowledge") => {
    if (!id) return;
    updateProgress((state) => {
      const lab = state.progress.chineseInputLab;
      const previous = lab.discoveredNodes?.[id];
      lab.discoveredNodes[id] = {
        ...(previous || {}),
        kind,
        discoveredAt: previous?.discoveredAt || new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
      };
    });
  }, [updateProgress]);

  return {
    prefs,
    moduleProgress,
    updatePrefs,
    recordAttempt,
    completeSession,
    beginSession,
    abandonSession,
    completeGameSession,
    discoverNode,
    migrateCurriculum,
  };
}
