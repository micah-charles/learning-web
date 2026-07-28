import { deterministicShuffle, createSeededRandom } from "./random.js";

function eligibleCharacters(dataset, lesson, method) {
  const active = new Set(lesson.activeKeys || []);
  const explicitIds = lesson.characterIds || [];
  const candidates = explicitIds.length
    ? explicitIds.map((id) => dataset.characters.find((character) => character.id === id)).filter(Boolean)
    : dataset.characters;
  return candidates.filter((character) => {
    const methodData = character[method];
    if (!methodData || character.lessonEligibility?.[method] === false) return false;
    return methodData.keySequence.every((key) => active.has(key));
  });
}

export function generateSessionPlan({
  dataset,
  lesson,
  method = lesson?.method || "cangjie",
  seed = 1,
  questionCount = 12,
  createdAt = new Date(0).toISOString(),
}) {
  if (!dataset || !lesson) throw new Error("Dataset and lesson are required.");
  const random = createSeededRandom(seed);
  const eligible = eligibleCharacters(dataset, lesson, method);
  const characters = lesson.preserveCharacterOrder
    ? eligible
    : deterministicShuffle(eligible, random);
  if (!characters.length) throw new Error(`Lesson ${lesson.id} has no eligible ${method} characters.`);
  const rootWeight = lesson.activityMix?.rootRecognition || 0;
  const typingWeight = lesson.activityMix?.guidedTyping || 0;
  const rootQuestionTarget = lesson.stage <= 4 && rootWeight > 0
    ? Math.max(1, Math.round(questionCount * rootWeight / Math.max(1, rootWeight + typingWeight)))
    : 0;
  let rootQuestionsGenerated = 0;
  const questions = Array.from({ length: questionCount }, (_, index) => {
    const character = characters[index % characters.length];
    const methodData = character[method];
    const type = rootQuestionsGenerated < rootQuestionTarget && index % 2 === 0
      ? "root-recognition"
      : "guided-typing";
    if (type === "root-recognition") rootQuestionsGenerated += 1;
    const expectedCodes = type === "root-recognition"
      ? [methodData.keySequence[0]]
      : [...methodData.acceptedCodes];
    const expectedKeys = type === "root-recognition"
      ? [methodData.keySequence[0]]
      : [...methodData.keySequence];
    return {
      id: `${lesson.id}-${seed}-${index + 1}`,
      type,
      method,
      prompt: type === "root-recognition"
        ? `Press the key for ${methodData.rootSequence[0]}.`
        : `Enter the ${method === "quick" ? "Quick" : "Cangjie"} code for ${character.char}.`,
      characterId: character.id,
      expectedCodes,
      preferredCode: type === "root-recognition" ? expectedCodes[0] : methodData.preferredCode,
      expectedKeys,
      distractors: [],
      guidanceLevel: lesson.stage <= 2 ? "full" : "learned",
      hintSteps: [
        character.meaning.en,
        `${expectedKeys.length} key${expectedKeys.length === 1 ? "" : "s"}`,
        methodData.keySequence[0],
        type === "root-recognition" ? expectedCodes[0] : methodData.preferredCode,
      ],
      metadata: { stage: lesson.stage, datasetVersion: dataset.manifest.datasetVersion },
    };
  });
  return {
    sessionId: `${lesson.id}-${seed}`,
    datasetVersion: dataset.manifest.datasetVersion,
    lessonId: lesson.id,
    method,
    seed,
    questions,
    createdAt,
  };
}
