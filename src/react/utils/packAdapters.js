/**
 * packAdapters.js
 *
 * Adapter functions that normalise existing learning pack formats into a
 * common shape usable by React components.
 *
 * LEGACY: Supports all existing field name variants (de/en, vocab.json,
 * unified pack, quiz session objects, etc.). Comments marked "LEGACY:"
 * indicate exactly which source format each field maps from.
 *
 * Target common question shape:
 * {
 *   id: string,
 *   type: "mcq" | "typing" | "flashcard" | "sequence" | "sort" | "gap" | "passage",
 *   question: string,         // display text shown to the student
 *   options: string[],        // MCQ options (null for other types)
 *   correctAnswer: string,    // the answer (string; array for typed accept-list)
 *   acceptedAnswers: string[], // array form for typed/keyword marking
 *   hint: string,
 *   explanation: string,
 *   source: string,           // word/sentence in the study language
 *   target: string,          // translation/answer in target language
 *   topic: string,
 *   difficulty: string,
 *   level: string,
 *   speechLanguage: string,   // BCP 47 for TTS
 *   // Passage-specific:
 *   passage: { sourcePassage, targetPassage, sourceTitle, targetTitle, questions },
 * }
 */

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Normalise a string for comparison (used by scoring). */
export function toNorm(str) {
  return (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[‑–]/g, "-")
    .replace(/['"'']/g, "'")
    .replace(/[,.:;!?]+/g, "")
    .replace(/\s+/g, " ");
}

/** Shuffle a copy of an array (Fisher-Yates). */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core normalisers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a unified pack item (LearningItem) into the common question shape.
 * @param {object} item - unified LearningItem { id, type, level, topics, tags, data }
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
        question: d.sourceWord || d.de || "",
        source: d.sourceWord || d.de || "",
        target: d.targetWord || d.en || "",
        correctAnswer: d.targetWord || d.en || "",
        options: [], // will be filled by getQuestionsForMode
        acceptedAnswers: [d.targetWord || d.en || ""],
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
        question: d.sourceSentence || d.de || "",
        source: d.sourceSentence || d.de || "",
        target: d.targetSentence || d.en || "",
        correctAnswer: d.targetSentence || d.en || "",
        acceptedAnswers: [d.targetSentence || d.en || ""],
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
        options: [], // filled by quiz engine
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
        question: d.sourceTitle || d.title_de || "",
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
          sourceTitle: d.sourceTitle || d.title_de || "",
          targetTitle: d.targetTitle || d.title_en || "",
          sourcePassage: d.sourcePassage || "",
          targetPassage: d.targetPassage || "",
          chapter: d.chapter || "",
          section: d.section || "",
          questions: (d.questions || []).map((q) => ({
            id: q.id,
            questionType: q.questionType || "open",
            question: q.question || q.question_en || "",
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
 * Normalise a quiz question object (from quiz.js factory functions) into common shape.
 * These objects have different field names from unified items — this bridges the gap.
 * @param {object} q - question from createQuizSession
 * @returns {object} common-shape question
 */
export function normaliseQuizQuestion(q) {
  const source =
    q.speechText ||
    q.prompt ||
    "";
  return {
    id: q.id,
    type: q.kind === "choice" ? "mcq"
       : q.kind === "typed" ? "typing"
       : q.kind === "build" ? "flashcard"
       : q.kind === "sequence" ? "sequence"
       : q.kind === "sort" ? "sort"
       : q.kind === "gap" ? "gap"
       : "mcq",
    question: q.prompt || "",
    source,
    target: q.answer || "",
    correctAnswer: q.answer || "",
    acceptedAnswers: q.acceptedAnswers || [q.answer],
    options: q.options || [],
    hint: q.hint || "",
    explanation: q.subtitle || "",
    topic: q.topic || "",
    difficulty: q.subtitle || "",
    level: q.subtitle || "",
    speechLanguage: q.speechLanguage || "de-DE",
    // Sequence-specific (preserve full order data)
    correctOrder: q.correctOrder || [],
    shuffledOrder: q.shuffledOrder || [],
    // Sort-specific
    sortCategories: q.categories || [],
    sortItems: q.items || [],
    // Passage-specific
    passage: q.passageId ? q : null,
    // Quiz-mode metadata
    modeId: q.modeId || "",
    modeTitle: q.modeTitle || "",
    rawKind: q.kind,
  };
}

/**
 * Normalise an old-format vocab.json entry.
 * LEGACY: maps 'de/en' → 'sourceWord/targetWord' and fills defaults.
 * @param {object} entry - single entry from vocab.json
 * @param {object} opts - { sourceLang, targetLang }
 * @returns {object} common-shape vocab item
 */
export function normaliseVocabEntry(entry, opts = {}) {
  return {
    id: entry.id || `vocab_${Math.random().toString(36).slice(2, 8)}`,
    type: "mcq",
    question: entry.de || entry.sourceWord || "",
    source: entry.de || entry.sourceWord || "",
    target: entry.en || entry.targetWord || "",
    correctAnswer: entry.en || entry.targetWord || "",
    options: [],
    acceptedAnswers: [entry.en || entry.targetWord || ""],
    hint: entry.gender ? `Gender: ${entry.gender}` : "",
    explanation:
      entry.exampleDe && entry.exampleEn
        ? `${entry.exampleDe}\n${entry.exampleEn}`
        : "",
    topic: entry.topic || "",
    difficulty: entry.level || "",
    level: entry.level || "",
    speechLanguage: opts.sourceLang || "de-DE",
    tags: entry.tags || [],
    // LEGACY raw fields preserved for reference
    _raw_de: entry.de,
    _raw_en: entry.en,
    _raw_pos: entry.pos || entry.part_of_speech,
    _raw_gender: entry.gender,
    _raw_plural: entry.plural,
  };
}

/**
 * Normalise an entire pack into the common shape.
 * Handles: unified pack (LearningItem[]), old vocab JSON, or mixed array.
 * @param {object|Array} rawPack - the pack object or array
 * @returns {{packId, title, items, byType: object}}
 */
export function normalisePack(rawPack) {
  if (!rawPack) return null;

  // Array → treat as list of items
  if (Array.isArray(rawPack)) {
    const items = rawPack
      .map(normaliseUnifiedItem)
      .filter(Boolean);
    return {
      packId: "unknown",
      title: "Pack",
      items,
      byType: groupByType(items),
    };
  }

  // Unified pack shape
  if (rawPack.items) {
    const items = rawPack.items
      .map(normaliseUnifiedItem)
      .filter(Boolean);
    return {
      packId: rawPack.packId || rawPack.id || "unknown",
      title: rawPack.title || rawPack.displayName || "Pack",
      subject: rawPack.subject || "",
      level: rawPack.level || "",
      language: rawPack.language || "",
      topics: rawPack.topics || [],
      sourceLanguageCode: rawPack.sourceLanguageCode || "de-DE",
      targetLanguageCode: rawPack.targetLanguageCode || "en-GB",
      speechLanguage: rawPack.speechLanguage || "de-DE",
      items,
      byType: groupByType(items),
    };
  }

  // Old vocab.json array at pack level (no unified structure)
  // LEGACY: detected by presence of 'de'/'en' fields
  if (Array.isArray(rawPack.vocab || rawPack.words)) {
    const items = (rawPack.vocab || rawPack.words).map((e) => normaliseVocabEntry(e));
    return {
      packId: rawPack.id || "legacy",
      title: rawPack.title || rawPack.displayName || "Legacy Pack",
      items,
      byType: groupByType(items),
    };
  }

  return null;
}

/**
 * Group an array of common questions by their `type` field.
 * @param {Array} items
 * @returns {object} { mcq: [], typing: [], flashcard: [], sequence: [], sort: [], gap: [], passage: [] }
 */
export function groupByType(items) {
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

/**
 * Get questions filtered and shuffled for a specific game mode.
 * Distractor options are added for MCQ types.
 *
 * @param {object} pack - result of normalisePack()
 * @param {string} mode - "mcq" | "typing" | "flashcard" | "sequence" | "sort" | "gap" | "passage"
 * @param {object} opts
 * @param {number} [opts.count] - max number of questions to return (default: all)
 * @param {number} [opts.distractorCount] - number of distractors for MCQ (default: 3)
 * @returns {Array} normalised questions ready for the quiz engine
 */
export function getQuestionsForMode(pack, mode, opts = {}) {
  if (!pack || !pack.byType) return [];
  const { count = Infinity, distractorCount = 3 } = opts;
  const byType = pack.byType;

  let questions = [];

  switch (mode) {
    case "mcq":
      questions = byType.mcq;
      // Add distractor options if not already present
      questions = questions.map((q) => {
        if (q.options && q.options.length >= 2) return q;
        const others = byType.mcq.filter((o) => o.id !== q.id).slice(0, distractorCount);
        const distractors = others.map((o) => o.correctAnswer);
        return {
          ...q,
          options: shuffle([q.correctAnswer, ...distractors]),
        };
      });
      break;

    case "typing":
      questions = byType.typing;
      // Also use gap type for typing practice
      questions = [...questions, ...byType.gap].map((q) => ({
        ...q,
        options: [],
      }));
      break;

    case "flashcard":
      questions = byType.flashcard;
      // Also treat vocab items as flashcards (front/back)
      questions = [...questions, ...byType.mcq.map((q) => ({ ...q, type: "flashcard" }))];
      break;

    case "sequence":
      questions = byType.sequence;
      break;

    case "sort":
      questions = byType.sort;
      break;

    case "gap":
      questions = byType.gap;
      // Add MCQ options for gap-fill
      questions = questions.map((q) => {
        if (q.options && q.options.length >= 2) return q;
        const others = byType.gap.filter((o) => o.id !== q.id).slice(0, distractorCount);
        return {
          ...q,
          options: shuffle([q.correctAnswer, ...others.map((o) => o.correctAnswer)]),
        };
      });
      break;

    case "passage":
      questions = byType.passage;
      break;

    default:
      questions = byType.mcq;
  }

  return shuffle(questions).slice(0, count);
}

/**
 * Build a flat list of MCQ options from a pack (for use as distractors).
 * @param {object} pack - result of normalisePack()
 * @param {string} excludeId - don't include this item's own answer
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