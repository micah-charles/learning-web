import { isReviewDue } from "../domain/review-scheduler.js";
import { INPUT_TOOL_KEYS } from "../data/keyboard-layout.js";

export const FLOWER_ACTIONS = [
  { id: "continue", label: "Continue Journey", shortLabel: "Continue", icon: "▶" },
  { id: "explore", label: "Explore Knowledge", shortLabel: "Explore", icon: "⌕" },
  { id: "review", label: "Review", shortLabel: "Review", icon: "↻" },
  { id: "football", label: "Football Challenge", shortLabel: "Football", icon: "⚽" },
  { id: "collection", label: "Collection", shortLabel: "Collection", icon: "▣" },
  { id: "keyboard", label: "Keyboard", shortLabel: "Keyboard", icon: "⌨" },
  { id: "progress", label: "Knowledge Garden", shortLabel: "Progress", icon: "◔" },
  { id: "search", label: "Search", shortLabel: "Search", icon: "⌕" },
];

export const READINESS_BANDS = {
  ready: { label: "Ready", stars: 5 },
  "good-challenge": { label: "Good Challenge", stars: 4 },
  "stretch-challenge": { label: "Stretch Challenge", stars: 3 },
  advanced: { label: "Advanced", stars: 2 },
  "very-difficult": { label: "Very Difficult Right Now", stars: 1 },
};

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

function average(values) {
  const usable = values.filter(Number.isFinite);
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : 0;
}

function masteryForCharacter(moduleProgress, characterId, method) {
  return moduleProgress.characters?.[characterId]?.[method] || {};
}

function semanticActivityName(lesson) {
  if (lesson.method === "quick") {
    return lesson.introducedKeys?.length ? "Quick Introduction" : "Quick Typing Practice";
  }
  const mix = lesson.activityMix || {};
  if (lesson.introducedKeys?.length) return "Keyboard Exploration";
  if ((mix.rootRecognition || 0) >= (mix.guidedTyping || 0)) return "Root Recognition";
  if ((mix.characterBuild || 0) >= 2) return "Character Construction";
  if ((lesson.activeKeys?.length || 0) >= 20) return "Typing Challenge";
  return "Whole-character Analysis";
}

export function readinessForLesson(lesson, moduleProgress) {
  const prerequisites = lesson.prerequisites || [];
  const met = prerequisites.filter((id) => moduleProgress.lessons?.[id]?.status === "completed").length;
  const ratio = prerequisites.length ? met / prerequisites.length : 1;
  const practisedCharacters = (lesson.characterIds || []).filter(
    (id) => masteryForCharacter(moduleProgress, id, lesson.method).attempts > 0,
  ).length;
  const familiarity = lesson.characterIds?.length ? practisedCharacters / lesson.characterIds.length : 0;
  const score = prerequisites.length
    ? Math.round((ratio * 0.7 + familiarity * 0.3) * 100)
    : 100;
  const band = score >= 80
    ? "ready"
    : score >= 60
      ? "good-challenge"
      : score >= 40
        ? "stretch-challenge"
        : score >= 20
          ? "advanced"
          : "very-difficult";
  const explanation = prerequisites.length === 0
    ? "You can begin here with no prior journey required."
    : met === prerequisites.length
      ? "You have practised the knowledge this journey builds on."
      : met > 0
        ? `You have explored ${met} of ${prerequisites.length} recommended foundations.`
        : "This introduces several roots you have not practised yet, but it remains available.";
  return { band, score, explanation, ...READINESS_BANDS[band] };
}

export function deriveAdventureRank(xp = 0) {
  if (xp >= 5000) return { title: "Knowledge Wayfinder", nextAt: 8000 };
  if (xp >= 2000) return { title: "Character Builder", nextAt: 5000 };
  if (xp >= 750) return { title: "Root Seeker", nextAt: 2000 };
  return { title: "Input Explorer", nextAt: 750 };
}

export function selectRecommendedLesson(dataset, moduleProgress, method, preferredId = "") {
  const lessons = dataset.lessons.filter((lesson) => lesson.method === method);
  if (!lessons.length) return null;
  const preferred = lessons.find((lesson) => lesson.id === preferredId);
  if (preferred && moduleProgress.lessons?.[preferred.id]?.status !== "completed") return preferred;
  return lessons.find((lesson) => moduleProgress.lessons?.[lesson.id]?.status !== "completed")
    || preferred
    || lessons[0];
}

function outcomesForLesson(lesson, dataset) {
  const rootKeys = (lesson.introducedKeys?.length ? lesson.introducedKeys : lesson.activeKeys || []).slice(0, 2);
  const roots = rootKeys
    .map((key) => dataset.roots.find((root) => root.key === key))
    .filter(Boolean);
  const characters = (lesson.characterIds || [])
    .slice(0, 3)
    .map((id) => dataset.characters.find((character) => character.id === id))
    .filter(Boolean);
  const outcomes = [];
  for (const root of roots) outcomes.push(`Recognise ${root.primaryRoot} on the ${root.key} key`);
  if (characters.length) outcomes.push(`Type ${characters.map((character) => character.char).join("、")} from verified codes`);
  outcomes.push(lesson.method === "quick" ? "Recall the first-and-last Quick pattern" : "Complete one mixed code-recall challenge");
  return outcomes.slice(0, 4);
}

function recentAccuracy(moduleProgress, method) {
  const events = (moduleProgress.attemptEvents || []).filter((event) => event.method === method).slice(-30);
  return events.length ? events.filter((event) => event.correct).length / events.length * 100 : 0;
}

function masteryDimensions(dataset, moduleProgress, method) {
  const rootKeys = dataset.roots.filter((root) => !INPUT_TOOL_KEYS.has(root.key)).map((root) => root.key);
  const roots = rootKeys.map((key) => moduleProgress.roots?.[key] || {});
  const characterRecords = dataset.characters
    .map((character) => masteryForCharacter(moduleProgress, character.id, method))
    .filter((record) => record.attempts);
  const events = (moduleProgress.attemptEvents || []).filter((event) => event.method === method).slice(-50);
  const sessions = (moduleProgress.sessions || []).filter((session) => session.method === method);
  const due = characterRecords.filter((record) => isReviewDue(record)).length;
  const accuracy = recentAccuracy(moduleProgress, method);
  const averageDuration = average(events.map((event) => event.durationMs).filter((value) => value > 0));
  const discovered = new Set([
    ...Object.keys(moduleProgress.discoveredNodes || {}),
    ...dataset.characters.filter((character) => masteryForCharacter(moduleProgress, character.id, method).attempts).map((character) => character.id),
  ]).size;
  return [
    { id: "keyboard", label: "Keyboard familiarity", value: clamp(roots.filter((root) => root.exposures > 0).length / Math.max(1, rootKeys.length) * 100) },
    { id: "roots", label: "Root recognition", value: clamp(average(roots.map((root) => root.masteryScore || 0))) },
    { id: "construction", label: "Character construction", value: clamp(average(characterRecords.map((record) => record.masteryScore || 0))) },
    { id: "recall", label: "Character recall", value: clamp(characterRecords.filter((record) => (record.streak || 0) >= 2).length / Math.max(1, characterRecords.length) * 100) },
    { id: "accuracy", label: "Typing accuracy", value: clamp(accuracy) },
    { id: "speed", label: "Typing speed", value: clamp(averageDuration ? 100 - Math.min(100, averageDuration / 45) : 0) },
    { id: "review", label: "Review health", value: clamp(characterRecords.length ? (characterRecords.length - due) / characterRecords.length * 100 : 100) },
    { id: "collection", label: "Exploration", value: clamp(discovered / Math.max(1, Math.min(dataset.characters.length, 100)) * 100) },
    { id: "journeys", label: "Journey confidence", value: clamp(average(sessions.slice(-10).map((session) => session.accuracy || 0))) },
  ];
}

export function buildKingdomModel({
  dataset,
  moduleProgress,
  miniGameProfile,
  method,
  preferredJourneyId = "",
  currentRootKey = "A",
}) {
  const lesson = selectRecommendedLesson(dataset, moduleProgress, method, preferredJourneyId);
  const readiness = lesson ? readinessForLesson(lesson, moduleProgress) : READINESS_BANDS.ready;
  const currentRoot = dataset.roots.find((root) => root.key === currentRootKey) || dataset.roots[0];
  const relatedCharacters = dataset.characters
    .filter((character) => character[method]?.keySequence?.includes(currentRoot.key))
    .slice(0, 6);
  const dimensions = masteryDimensions(dataset, moduleProgress, method);
  const dueCount = Object.values(moduleProgress.characters || {}).filter((record) => isReviewDue(record?.[method])).length;
  const rank = deriveAdventureRank(miniGameProfile.xp);
  const learnedRootCount = dataset.roots
    .filter((root) => !INPUT_TOOL_KEYS.has(root.key))
    .filter((root) => (moduleProgress.roots?.[root.key]?.exposures || 0) > 0)
    .length;
  const recommendationReason = dueCount >= 5
    ? `You have ${dueCount} characters ready for review. This journey keeps new work light while recall settles.`
    : lesson?.introducedKeys?.length
      ? `These roots extend the ${learnedRootCount || "first"} keyboard mappings in your knowledge garden.`
      : "This is the next useful practice based on your completed and recent journeys.";
  return {
    currentRoot,
    relatedCharacters,
    dimensions,
    dueCount,
    recentAccuracy: Math.round(recentAccuracy(moduleProgress, method)),
    masteredCharacterCount: dataset.characters.filter(
      (character) => (masteryForCharacter(moduleProgress, character.id, method).masteryScore || 0) >= 80,
    ).length,
    practisedRootCount: learnedRootCount,
    rank: {
      ...rank,
      xp: miniGameProfile.xp,
      progress: clamp(miniGameProfile.xp / rank.nextAt * 100),
    },
    journey: lesson ? {
      id: lesson.id,
      lesson,
      title: semanticActivityName(lesson),
      subtitle: lesson.title?.zhHant || "",
      estimatedMinutes: lesson.estimatedMinutes || 5,
      readiness,
      reason: recommendationReason,
      outcomes: outcomesForLesson(lesson, dataset),
      reward: { xp: 80, coins: 12 },
      saved: moduleProgress.lessons?.[lesson.id] || null,
    } : null,
    companionMessage: dueCount >= 5
      ? "A few characters are ready to revisit. Review is a suggestion, never a gate."
      : currentRoot
        ? `${currentRoot.key} maps to ${currentRoot.primaryRoot}. Explore it now, or choose any other root.`
        : "Choose any learning action from the Flower.",
  };
}

function practiceLesson(baseLesson, id, title, characterIds, method, minimumAccuracy = 0.8) {
  return {
    ...baseLesson,
    id,
    method,
    title: { en: title, zhHant: "足球挑戰" },
    characterIds,
    preserveCharacterOrder: true,
    introducedKeys: [],
    reviewedKeys: [],
    activeKeys: [],
    activityMix: { keyboardExplore: 0, rootRecognition: 0, guidedTyping: 12, characterBuild: 0 },
    passCriteria: { minimumAccuracy, minimumQuestions: Math.min(15, Math.max(6, characterIds.length)) },
    prerequisites: [],
    estimatedMinutes: 5,
    accessibilityNotes: "Football challenge supports keyboard, touch and pointer input.",
  };
}

function characterIdsByWeakness(dataset, moduleProgress, method) {
  return dataset.characters
    .filter((character) => masteryForCharacter(moduleProgress, character.id, method).attempts)
    .sort((left, right) => (
      (masteryForCharacter(moduleProgress, left.id, method).masteryScore || 0)
      - (masteryForCharacter(moduleProgress, right.id, method).masteryScore || 0)
    ))
    .slice(0, 20)
    .map((character) => character.id);
}

export const FOOTBALL_CHALLENGES = [
  { id: "current-journey", label: "Current Journey", description: "Characters from today’s recommended journey." },
  { id: "current-root", label: "Current Root", description: "Characters that use the root in focus." },
  { id: "review-queue", label: "Review Queue", description: "Due and weaker characters from local review evidence." },
  { id: "weak-characters", label: "Weak Characters", description: "The lowest current mastery scores first." },
  { id: "random-daily", label: "Daily Mix", description: "A stable daily selection from verified characters." },
  { id: "speed", label: "Speed", description: "Shorter codes for faster recall." },
  { id: "accuracy", label: "Accuracy", description: "Longer codes where order matters." },
  { id: "mixed-review", label: "Mixed Review", description: "A blend of practised and new characters." },
  { id: "boss", label: "Boss Challenge", description: "A demanding mixed set with a higher pass target." },
];

export function buildFootballChallengeLesson({
  challengeId,
  dataset,
  moduleProgress,
  method,
  journeyLesson,
  reviewLesson,
  currentRootKey,
  now = new Date(),
}) {
  const baseLesson = journeyLesson || dataset.lessons.find((lesson) => lesson.method === method);
  if (!baseLesson) return null;
  const eligible = dataset.characters.filter((character) => character[method]?.preferredCode);
  const weak = characterIdsByWeakness(dataset, moduleProgress, method);
  let ids;
  if (challengeId === "current-journey") ids = baseLesson.characterIds;
  else if (challengeId === "current-root") {
    ids = eligible.filter((character) => character[method].keySequence.includes(currentRootKey)).slice(0, 20).map((character) => character.id);
  } else if (challengeId === "review-queue") ids = reviewLesson?.characterIds?.length ? reviewLesson.characterIds : weak;
  else if (challengeId === "weak-characters") ids = weak;
  else if (challengeId === "speed") {
    ids = [...eligible].sort((a, b) => a[method].preferredCode.length - b[method].preferredCode.length).slice(0, 20).map((character) => character.id);
  } else if (challengeId === "accuracy") {
    ids = eligible.filter((character) => character[method].preferredCode.length >= 3).slice(0, 20).map((character) => character.id);
  } else if (challengeId === "mixed-review") {
    const practised = eligible.filter((character) => masteryForCharacter(moduleProgress, character.id, method).attempts).slice(0, 10);
    const newCharacters = eligible.filter((character) => !masteryForCharacter(moduleProgress, character.id, method).attempts).slice(0, 10);
    ids = [...practised, ...newCharacters].map((character) => character.id);
  } else {
    const day = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000);
    const offset = day % Math.max(1, eligible.length);
    ids = [...eligible.slice(offset), ...eligible.slice(0, offset)].slice(0, challengeId === "boss" ? 24 : 16).map((character) => character.id);
  }
  if (!ids?.length) ids = baseLesson.characterIds;
  const challenge = FOOTBALL_CHALLENGES.find((item) => item.id === challengeId) || FOOTBALL_CHALLENGES[0];
  const lesson = practiceLesson(
    baseLesson,
    `football-${challenge.id}-${method}`,
    challenge.label,
    [...new Set(ids)],
    method,
    challenge.id === "boss" ? 0.9 : 0.8,
  );
  const keys = new Set(lesson.characterIds.flatMap((id) => (
    dataset.characters.find((character) => character.id === id)?.[method]?.keySequence || []
  )));
  lesson.activeKeys = [...keys].sort();
  return lesson;
}
