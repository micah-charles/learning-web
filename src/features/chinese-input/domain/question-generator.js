import { deterministicShuffle, createSeededRandom } from "./random.js";

export function eligibleCharacters(dataset, lesson, method) {
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

function rootKeysForLesson(lesson) {
  const active = new Set(lesson.activeKeys || []);
  const ordered = [
    ...(lesson.introducedKeys || []),
    ...(lesson.reviewedKeys || []),
    ...(lesson.activeKeys || []),
  ];
  return [...new Set(ordered)].filter((key) => active.has(key));
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
  const lessonRootKeys = rootKeysForLesson(lesson);
  let rootQuestionsGenerated = 0;
  const questions = Array.from({ length: questionCount }, (_, index) => {
    const fallbackCharacter = characters[index % characters.length];
    const type = rootQuestionsGenerated < rootQuestionTarget && index % 2 === 0
      ? "root-recognition"
      : "guided-typing";
    const rootKey = type === "root-recognition"
      ? lessonRootKeys[rootQuestionsGenerated % lessonRootKeys.length]
        || fallbackCharacter[method].keySequence[0]
      : "";
    const root = type === "root-recognition"
      ? dataset.roots.find((candidate) => candidate.key === rootKey)
      : null;
    const character = fallbackCharacter;
    const methodData = character[method];
    if (type === "root-recognition") rootQuestionsGenerated += 1;
    const expectedCodes = type === "root-recognition"
      ? [rootKey]
      : [...methodData.acceptedCodes];
    const expectedKeys = type === "root-recognition"
      ? [rootKey]
      : [...methodData.keySequence];
    return {
      id: `${lesson.id}-${seed}-${index + 1}`,
      lessonId: lesson.id,
      type,
      method,
      prompt: type === "root-recognition"
        ? "Press the keyboard key mapped to this Cangjie root."
        : `Enter the ${method === "quick" ? "Quick" : "Cangjie"} code for ${character.char}.`,
      characterId: type === "root-recognition" ? null : character.id,
      rootKey,
      rootLabel: root?.primaryRoot || methodData.rootSequence[0],
      rootLabelEn: root?.labelEn || "",
      expectedCodes,
      preferredCode: type === "root-recognition" ? expectedCodes[0] : methodData.preferredCode,
      expectedKeys,
      distractors: [],
      guidanceLevel: lesson.stage <= 2 ? "full" : "learned",
      hintSteps: type === "root-recognition"
        ? [
            `This is the ${root?.labelEn || "shown"} root.`,
            "The answer is one keyboard letter.",
            root?.mnemonic?.en || `${rootKey} represents ${root?.primaryRoot || "this root"}.`,
            rootKey,
          ]
        : [
            character.meaning.en,
            `${expectedKeys.length} key${expectedKeys.length === 1 ? "" : "s"}`,
            methodData.keySequence[0],
            methodData.preferredCode,
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
