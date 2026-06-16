export interface VocabRecord {
  id: string;
  source: string;
  target: string;
  topic?: string;
}

export interface BuilderRecord {
  id: string;
  prompt: string;
  answer: string;
  tiles: string[];
}

export interface PassageQuestionRecord {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  sourceRef?: {
    paragraph?: number;
    quote?: string;
  } | null;
}

export interface PassageRecord {
  id: string;
  title: string;
  sourceText: string;
  targetText: string;
  questions: PassageQuestionRecord[];
}

export function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function resolveCorrectAnswer(item: { correctAnswer?: string; answer?: string; target?: string }): string {
  return String(item.correctAnswer || item.answer || item.target || "").trim();
}

export function resolveIncorrectAnswer(
  item: { options?: string[]; correctAnswer?: string; answer?: string; target?: string },
): string | null {
  const correct = normalizeText(resolveCorrectAnswer(item));
  const options = item.options || [];
  return options.find((option) => normalizeText(option) !== correct) || null;
}

export function resolveSentenceOrder(item: { tiles?: string[]; answer?: string }): string[] {
  if (Array.isArray(item.tiles) && item.tiles.length > 0) return [...item.tiles];
  return String(item.answer || "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function resolveQuestionText(item: { question?: string; prompt?: string; source?: string }): string {
  return String(item.question || item.prompt || item.source || "").trim();
}

export function findVocabRecordForPrompt(prompt: string, records: VocabRecord[]): VocabRecord | undefined {
  const normalizedPrompt = normalizeText(prompt);
  return records.find((record) =>
    normalizeText(record.source) === normalizedPrompt || normalizeText(record.target) === normalizedPrompt,
  );
}

export function findBuilderRecordForPrompt(prompt: string, records: BuilderRecord[]): BuilderRecord | undefined {
  const normalizedPrompt = normalizeText(prompt);
  return records.find((record) => normalizeText(record.prompt) === normalizedPrompt);
}

export function findPassageForTitle(title: string, passages: PassageRecord[]): PassageRecord | undefined {
  const normalizedTitle = normalizeText(title);
  return passages.find((passage) => normalizeText(passage.title) === normalizedTitle);
}

export function findPassageQuestionByPrompt(prompt: string, questions: PassageQuestionRecord[]): PassageQuestionRecord | undefined {
  const normalizedPrompt = normalizeText(prompt);
  return questions.find((question) => normalizeText(question.question) === normalizedPrompt);
}
