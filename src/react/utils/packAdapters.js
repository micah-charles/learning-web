/**
 * packAdapters.js
 *
 * Normalises unified pack items (LearningItem[]) into the common question shape
 * used by React learning components.
 *
 * Target common question shape:
 * {
 *   id, type, question, source, target,
 *   correctAnswer, acceptedAnswers, options,
 *   hint, explanation, topic, difficulty, level, speechLanguage, passage, tags
 * }
 */

// ─── Helpers ───────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function groupByType(items) {
  return {
    mcq:       items.filter((i) => i.type === "mcq"),
    typing:    items.filter((i) => i.type === "typing"),
    flashcard: items.filter((i) => i.type === "flashcard"),
    sequence:  items.filter((i) => i.type === "sequence"),
    sort:      items.filter((i) => i.type === "sort"),
    gap:       items.filter((i) => i.type === "gap"),
    passage:   items.filter((i) => i.type === "passage"),
  };
}

// ─── Core normaliser ────────────────────────────────────────────────

/**
 * Normalise a unified LearningItem into the common question shape.
 * @param {object} item - { id, type, level, topics, tags, data }
 * @returns {object|null} common-shape question or null
 */
export function normaliseUnifiedItem(item) {
  if (!item || !item.type) return null;
  const d = item.data || {};

  switch (item.type) {
    case "vocab":
      return {
        id: item.id,
        type: "mcq",
        question: d.sourceWord || "",
        source: d.sourceWord || "",
        target: d.targetWord || "",
        correctAnswer: d.targetWord || "",
        options: [],
        acceptedAnswers: [d.targetWord || ""],
        hint: d.gender ? `Gender: ${d.gender}` : "",
        explanation: d.exampleSource && d.exampleTarget
          ? `${d.exampleSource}\n${d.exampleTarget}`
          : "",
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        difficulty: item.level || "",
        level: item.level || "",
        speechLanguage: d.speechLanguage || "de-DE",
        tags: item.tags || [],
      };

    case "sentence":
      return {
        id: item.id,
        type: "typing",
        question: d.sourceSentence || "",
        source: d.sourceSentence || "",
        target: d.targetSentence || "",
        correctAnswer: d.targetSentence || "",
        acceptedAnswers: [d.targetSentence || ""],
        hint: "",
        explanation: "",
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        level: item.level || "",
        speechLanguage: d.speechLanguage || "de-DE",
        tags: item.tags || [],
      };

    case "sequence":
      return {
        id: item.id,
        type: "sequence",
        question: d.title || "",
        source: d.instruction || "",
        correctAnswer: d.items || [],
        acceptedAnswers: [d.items?.join(" ") || ""],
        options: shuffle([...(d.items || [])]),
        hint: "",
        explanation: d.instruction || "",
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        level: item.level || "",
        speechLanguage: d.speechLanguage || "de-DE",
        tags: item.tags || [],
      };

    case "categorySort":
      return {
        id: item.id,
        type: "sort",
        question: d.title || "",
        source: d.instruction || "",
        correctAnswer: d.categories || [],
        acceptedAnswers: (d.pairs || []).map((p) => `${p.text}|${p.category}`),
        options: shuffle([...(d.pairs || [])]),
        hint: "",
        explanation: d.instruction || "",
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        level: item.level || "",
        speechLanguage: d.speechLanguage || "de-DE",
        tags: item.tags || [],
      };

    case "fillBlank":
      return {
        id: item.id,
        type: "gap",
        question: d.sentence || "",
        source: d.sentence || "",
        target: d.answer || "",
        correctAnswer: d.answer || "",
        acceptedAnswers: [d.answer || ""],
        options: [],
        hint: d.hint || "",
        explanation: `The answer is: ${d.answer}`,
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        level: item.level || "",
        speechLanguage: d.speechLanguage || "en-GB",
        tags: item.tags || [],
      };

    case "sentenceBuilder":
      return {
        id: item.id,
        type: "flashcard",
        question: d.prompt || "",
        source: d.prompt || "",
        target: d.answer || "",
        correctAnswer: d.answer || "",
        options: d.tiles || [],
        hint: d.cardType || "",
        explanation: "",
        topic: item.tags?.[0] || "",
        level: item.level || "",
        speechLanguage: "en-GB",
        tags: item.tags || [],
      };

    case "passage":
      return {
        id: item.id,
        type: "passage",
        question: d.sourceTitle || "",
        source: d.sourcePassage || "",
        target: d.targetPassage || "",
        correctAnswer: "",
        acceptedAnswers: [],
        options: [],
        hint: "",
        explanation: "",
        topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
        level: item.level || "",
        speechLanguage: d.speechLanguage || "de-DE",
        passage: {
          sourceTitle: d.sourceTitle || "",
          targetTitle: d.targetTitle || "",
          sourcePassage: d.sourcePassage || "",
          targetPassage: d.targetPassage || "",
          chapter: d.chapter || "",
          section: d.section || "",
          questions: (d.questions || []).map((q) => ({
            id: q.id,
            questionType: q.questionType || "open",
            question: q.question || "",
            options: q.options || [],
            correctOptionIndex: q.correctOptionIndex,
            modelAnswer: q.modelAnswer || "",
            acceptedKeywords: q.acceptedKeywords || [],
            difficulty: q.difficulty || "medium",
          })),
        },
        tags: item.tags || [],
      };

    default:
      return null;
  }
}

/**
 * Normalise an entire unified pack into the common shape.
 * @param {object} pack - unified pack { packId, title, items, ... }
 * @returns {{ packId, title, items, byType }|null}
 */
export function normalisePack(pack) {
  if (!pack) return null;
  if (Array.isArray(pack)) {
    const items = pack.map(normaliseUnifiedItem).filter(Boolean);
    return { packId: "unknown", title: "Pack", items, byType: groupByType(items) };
  }
  if (!pack.items) return null;
  const items = pack.items.map(normaliseUnifiedItem).filter(Boolean);
  return {
    packId: pack.packId || pack.id || "unknown",
    title: pack.title || pack.displayName || "Pack",
    subject: pack.subject || "",
    level: pack.level || "",
    language: pack.language || "",
    topics: pack.topics || [],
    sourceLanguageCode: pack.sourceLanguageCode || "de-DE",
    targetLanguageCode: pack.targetLanguageCode || "en-GB",
    speechLanguage: pack.speechLanguage || "de-DE",
    items,
    byType: groupByType(items),
  };
}

/**
 * Get questions filtered and shuffled for a specific game mode.
 * Distractor options are generated for MCQ and gap types.
 *
 * @param {object} pack  - result of normalisePack()
 * @param {string} mode  - "mcq"|"typing"|"flashcard"|"sequence"|"sort"|"gap"|"passage"
 * @param {object} opts
 * @param {number} [opts.count]          - max questions (default: all)
 * @param {number} [opts.distractorCount] - MCQ distractors (default: 3)
 * @returns {Array}
 */
export function getQuestionsForMode(pack, mode, opts = {}) {
  if (!pack || !pack.byType) return [];
  const { count = Infinity, distractorCount = 3 } = opts;
  const byType = pack.byType;

  switch (mode) {
    case "mcq":
      return shuffle(
        byType.mcq.map((q) => {
          if (q.options && q.options.length >= 2) return q;
          const others = byType.mcq.filter((o) => o.id !== q.id).slice(0, distractorCount);
          return {
            ...q,
            options: shuffle([q.correctAnswer, ...others.map((o) => o.correctAnswer)]),
          };
        }),
      ).slice(0, count);

    case "typing":
      return shuffle([...byType.typing, ...byType.gap].map((q) => ({ ...q, options: [] }))).slice(0, count);

    case "flashcard":
      return shuffle([...byType.flashcard, ...byType.mcq.map((q) => ({ ...q, type: "flashcard" }))]).slice(0, count);

    case "sequence":
      return shuffle(byType.sequence).slice(0, count);

    case "sort":
      return shuffle(byType.sort).slice(0, count);

    case "gap":
      return shuffle(
        byType.gap.map((q) => {
          if (q.options && q.options.length >= 2) return q;
          const others = byType.gap.filter((o) => o.id !== q.id).slice(0, distractorCount);
          return {
            ...q,
            options: shuffle([q.correctAnswer, ...others.map((o) => o.correctAnswer)]),
          };
        }),
      ).slice(0, count);

    case "passage":
      return shuffle(byType.passage).slice(0, count);

    default:
      return shuffle(byType.mcq).slice(0, count);
  }
}

/**
 * Build a flat list of correct answers for use as MCQ distractors.
 * @param {object} pack
 * @param {string} excludeId
 * @param {number} count
 * @returns {string[]}
 */
export function getDistractors(pack, excludeId, count = 3) {
  return pack.byType.mcq
    .filter((q) => q.id !== excludeId)
    .slice(0, count * 3)
    .map((q) => q.correctAnswer)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, count);
}
