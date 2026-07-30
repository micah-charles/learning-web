import { normalizeForCompare, shuffle } from "@/utils.js";

const answerKey = (value) => normalizeForCompare(value) || String(value || "").trim().toLocaleLowerCase();

export function toGenericChallenge(question) {
  if (!question) return null;
  const correctAnswer = String(question.correctAnswer || question.answer || "").trim();
  const prompt = String(question.questionText || question.prompt || question.sentence || "").trim();
  if (!prompt || !correctAnswer) return null;
  const seen = new Set([answerKey(correctAnswer)]);
  const distractors = (question.distractors || []).filter((answer) => {
    const key = answerKey(answer);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return {
    id: String(question.id || question.wordId || question.itemId || `challenge_${prompt}`),
    prompt,
    answers: shuffle([correctAnswer, ...distractors]).slice(0, 4),
    correctAnswer,
    hint: question.hint || `Look for ${correctAnswer.slice(0, 1).toUpperCase()}…`,
    topic: question.topic || "",
    speechText: question.speechText || correctAnswer,
    speechLanguage: question.speechLanguage || "en-GB",
    sourceId: question.wordId || question.itemId || question.id || "",
    metadata: { originalMode: question.mode || "generic" },
  };
}

export const toGenericChallenges = (questions) => (questions || []).map(toGenericChallenge).filter((challenge) => challenge?.answers.length >= 2);
export const evaluateChallenge = (challenge, response) => answerKey(response) === answerKey(challenge?.correctAnswer);
