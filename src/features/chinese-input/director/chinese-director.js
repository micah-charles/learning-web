import { isReviewDue } from "../domain/review-scheduler.js";
import { buildLearnerSignals, buildRecommendation } from "../../../learning-director/domain/recommendation.js";
import { buildSessionPlan } from "../../../learning-director/domain/session-plan.js";

function masteryForCharacter(moduleProgress, characterId, method) { return moduleProgress.characters?.[characterId]?.[method] || {}; }

export function buildChineseReviewLesson(dataset, moduleProgress, method, now = Date.now()) {
  const candidates = dataset.characters.map((character) => ({ character, mastery: masteryForCharacter(moduleProgress, character.id, method) }))
    .filter(({ mastery }) => mastery.attempts && (isReviewDue(mastery, now) || (mastery.masteryScore || 0) < 80))
    .sort((left, right) => {
      const leftDue = isReviewDue(left.mastery, now) ? 0 : 1;
      const rightDue = isReviewDue(right.mastery, now) ? 0 : 1;
      return leftDue - rightDue || (left.mastery.masteryScore || 0) - (right.mastery.masteryScore || 0) || left.character.id.localeCompare(right.character.id);
    }).slice(0, 20);
  if (!candidates.length) return null;
  return {
    id: `adaptive-review-${method}`, kind: "review", method, stage: 5, order: 99,
    title: { en: "Strengthen your recall", zhHant: "適應性複習" },
    focusLabel: `${candidates.length} characters ready to revisit`, introducedKeys: [], reviewedKeys: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"), activeKeys: Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ"),
    characterIds: candidates.map(({ character }) => character.id), preserveCharacterOrder: true,
    activityMix: { keyboardExplore: 0, rootRecognition: 0, guidedTyping: 10, characterBuild: 0 }, passCriteria: { minimumAccuracy: 0.8, minimumQuestions: 10 }, prerequisites: [], estimatedMinutes: 6,
    accessibilityNotes: "Weak and due characters are presented first without a time limit.",
  };
}

function chapterCandidate(lesson, moduleProgress, method, now) {
  const saved = moduleProgress.lessons?.[lesson.id];
  const lastAttempt = (moduleProgress.attemptEvents || []).filter((event) => event.lessonId === lesson.id && event.method === method).at(-1);
  return { ...lesson, kind: "chapter", focusLabel: lesson.title?.en || "verified keyboard practice", outcomeLabel: lesson.characterIds?.length ? `${lesson.characterIds.length} verified characters` : "verified keyboard practice", supportsArena: true, lastAttemptAt: lastAttempt?.occurredAt || saved?.lastOpenedAt || "", recentlyUsed: Boolean(lastAttempt && now - Date.parse(lastAttempt.occurredAt) < 24 * 60 * 60 * 1000), weaknessValue: (lesson.activeKeys || []).length <= 5 ? 4 : 0 };
}

export function buildChineseDirectorModel({ dataset, moduleProgress, method, preferredId = "", intent = "journey", currentRootKey = "A", now = Date.now() } = {}) {
  const lessons = dataset.lessons.filter((lesson) => lesson.method === method).map((lesson) => chapterCandidate(lesson, moduleProgress, method, now));
  const reviewLesson = buildChineseReviewLesson(dataset, moduleProgress, method, now);
  const learner = buildLearnerSignals({ moduleProgress, method, now });
  const seed = `${dataset.manifest.datasetVersion}:${method}:${new Date(now).toISOString().slice(0, 10)}`;
  const recommendation = buildRecommendation({ candidates: reviewLesson ? [reviewLesson, ...lessons] : lessons, learner, intent, preferredId, now, seed });
  const sessionPlan = recommendation.selected ? buildSessionPlan({
    request: {
      requestId: `${recommendation.selected.id}:${method}:${seed}`,
      worldId: "chinese-input",
      learnerSnapshotId: `local:${method}:${moduleProgress.attemptEvents?.length || 0}`,
      intent: recommendation.intent,
      targetMinutes: recommendation.estimatedMinutes || 5,
      locale: "en-GB",
      method,
      now: new Date(now).toISOString(),
      seed,
    },
    candidate: recommendation.selected,
    reviewCandidate: reviewLesson,
    learnerSnapshot: learner,
    recommendation,
    worldId: "chinese-input",
    contentRevision: dataset.manifest.datasetVersion,
    estimatedMinutes: recommendation.estimatedMinutes || 5,
  }) : null;
  const currentRoot = dataset.roots.find((root) => root.key === currentRootKey) || dataset.roots[0];
  const relatedCharacters = dataset.characters.filter((character) => character[method]?.keySequence?.includes(currentRoot?.key)).slice(0, 6);
  return { ...recommendation, learner, reviewLesson, lessons, currentRoot, relatedCharacters, method, sessionPlan };
}
