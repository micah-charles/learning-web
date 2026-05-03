/**
 * packAdapters.js
 *
 * Normalises unified LearningItem packs into the common question shape used by
 * React learning components. Runtime loading intentionally supports only the
 * unified schema; legacy vocab/jsonl fallbacks belong in conversion scripts.
 */

const QUESTION_TYPES = ["mcq", "typing", "flashcard", "sequence", "sort", "gap", "passage"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function firstTopic(item) {
  return Array.isArray(item.topics) ? item.topics[0] || "" : item.topics || "";
}

function compactOptions(options) {
  return (options || []).filter((option) => option !== undefined && option !== null && option !== "");
}

export function groupByType(items) {
  return QUESTION_TYPES.reduce((acc, type) => {
    acc[type] = items.filter((item) => item.type === type);
    return acc;
  }, {});
}

/**
 * Normalise one unified LearningItem into the common question shape.
 */
export function normaliseUnifiedItem(item) {
  if (!item || !item.type) return null;

  const d = item.data || {};
  const common = {
    id: item.id,
    topic: firstTopic(item),
    difficulty: item.level || "",
    level: item.level || "",
    speechLanguage: d.speechLanguage || item.speechLanguage || "de-DE",
    tags: item.tags || [],
  };

  switch (item.type) {
    case "vocab": {
      // New: read from translations dict (BCP-47 keys). Legacy fallback preserved.
      const translations = d.translations || {};
      const examples     = d.examples     || {};
      const srcCode = item._srcCode || "de-DE";
      const tgtCode = item._tgtCode || "en-GB";
      const source = translations[srcCode]
                  || Object.values(translations)[0]
                  || d.sourceWord
                  || "";
      const target = translations[tgtCode]
                  || Object.values(translations).slice(1)[0]
                  || d.targetWord
                  || "";
      const exSrc = examples[srcCode]
                 || Object.values(examples)[0]
                 || d.exampleSource
                 || null;
      return {
        ...common,
        type: "mcq",
        question: source,
        source,
        target,
        correctAnswer: target,
        acceptedAnswers: compactOptions([target]),
        options: [],
        hint: d.gender ? `Gender: ${d.gender}` : "",
        explanation: exSrc || "",
      };
    }

    case "sentence": {
      // New: read from translations dict (BCP-47 keys). Legacy fallback preserved.
      const translations = d.translations || {};
      const srcCode = item._srcCode || "de-DE";
      const tgtCode = item._tgtCode || "en-GB";
      const source = translations[srcCode]
                  || Object.values(translations)[0]
                  || d.sourceSentence
                  || "";
      const target = translations[tgtCode]
                  || Object.values(translations).slice(1)[0]
                  || d.targetSentence
                  || "";
      return {
        ...common,
        type: "typing",
        question: source,
        source,
        target,
        correctAnswer: target,
        acceptedAnswers: compactOptions([target]),
        options: [],
        hint: "",
        explanation: "",
      };
    }

    case "sequence": {
      const correctOrder = d.items || d.correctOrder || [];
      const shuffledOrder = d.shuffledOrder || shuffle(correctOrder);
      return {
        ...common,
        type: "sequence",
        question: d.title || "Arrange in order",
        source: d.instruction || "",
        target: correctOrder.join(" | "),
        correctAnswer: correctOrder.join(" | "),
        acceptedAnswers: compactOptions([correctOrder.join(" | ")]),
        options: shuffledOrder,
        hint: "",
        explanation: d.instruction || "",
        correctOrder,
        shuffledOrder,
      };
    }

    case "categorySort": {
      const sortItems = d.items || d.pairs || [];
      const sortCategories = d.categories || [];
      return {
        ...common,
        type: "sort",
        question: d.title || "Sort into categories",
        source: d.instruction || "",
        target: "",
        correctAnswer: sortItems.map((p) => `${p.text}|${p.category}`).join(" || "),
        acceptedAnswers: sortItems.map((p) => `${p.text}|${p.category}`),
        options: sortItems,
        hint: "",
        explanation: d.instruction || "",
        sortCategories,
        sortItems,
      };
    }

    case "fillBlank": {
      const answer = d.answer || "";
      return {
        ...common,
        type: "gap",
        question: d.sentence || "",
        source: d.sentence || "",
        target: answer,
        correctAnswer: answer,
        acceptedAnswers: compactOptions([answer]),
        options: compactOptions(d.options),
        hint: d.hint || "",
        explanation: answer ? `The answer is: ${answer}` : "",
        speechLanguage: d.speechLanguage || "en-GB",
      };
    }

    case "sentenceBuilder": {
      const prompt = d.prompt || "";
      const answer = d.answer || "";
      return {
        ...common,
        type: "flashcard",
        question: prompt,
        source: prompt,
        target: answer,
        correctAnswer: answer,
        acceptedAnswers: compactOptions([answer]),
        options: d.tiles || [],
        hint: d.cardType || "",
        explanation: "",
        topic: item.tags?.[0] || firstTopic(item),
        speechLanguage: "en-GB",
      };
    }

    case "passage": {
      const questions = (d.questions || []).map((q, index) => {
        const correctOptionIndex = Number.isInteger(q.correctOptionIndex)
          ? q.correctOptionIndex
          : undefined;
        const correctAnswer =
          q.correctAnswer ||
          q.modelAnswer ||
          (correctOptionIndex !== undefined ? q.options?.[correctOptionIndex] : "");

        return {
          id: q.id || `${item.id}_q${index + 1}`,
          questionType: q.questionType || (q.options?.length ? "mcq" : "open"),
          question: q.question || "",
          options: q.options || [],
          correctOptionIndex,
          correctAnswer: correctAnswer || "",
          modelAnswer: q.modelAnswer || correctAnswer || "",
          acceptedKeywords: q.acceptedKeywords || [],
          difficulty: q.difficulty || "medium",
        };
      });

      return {
        ...common,
        type: "passage",
        question: d.sourceTitle || d.title || "Passage",
        source: d.sourcePassage || "",
        target: d.targetPassage || "",
        correctAnswer: "",
        acceptedAnswers: [],
        options: [],
        hint: "",
        explanation: "",
        passage: {
          sourceTitle: d.sourceTitle || d.title || "",
          targetTitle: d.targetTitle || "",
          sourcePassage: d.sourcePassage || "",
          targetPassage: d.targetPassage || "",
          chapter: d.chapter || "",
          section: d.section || "",
          level: item.level || "",
          questions,
        },
      };
    }

    default:
      return null;
  }
}

/**
 * Normalise an entire unified pack. Arrays are accepted only when they already
 * contain unified LearningItems with a `type`; legacy arrays intentionally
 * normalise to null so runtime callers notice bad data paths immediately.
 */
export function normalisePack(pack) {
  if (!pack) return null;

  if (Array.isArray(pack)) {
    if (!pack.every((item) => item && item.type)) return null;
    const items = pack.map(normaliseUnifiedItem).filter(Boolean);
    return { packId: "unknown", title: "Pack", items, byType: groupByType(items) };
  }

  if (!Array.isArray(pack.items)) return null;

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

function addDistractors(questions, distractorCount) {
  return questions.map((q) => {
    if (q.options && q.options.length >= 2) return q;
    const distractors = questions
      .filter((other) => other.id !== q.id && other.correctAnswer)
      .map((other) => other.correctAnswer)
      .filter((value, index, arr) => arr.indexOf(value) === index)
      .slice(0, distractorCount);

    return {
      ...q,
      options: shuffle(compactOptions([q.correctAnswer, ...distractors])),
    };
  });
}

/**
 * Get questions filtered and shuffled for a specific game mode.
 */
export function getQuestionsForMode(pack, mode, opts = {}) {
  if (!pack || !pack.byType) return [];
  const { count = Infinity, distractorCount = 3 } = opts;
  const byType = pack.byType;

  let questions;
  switch (mode) {
    case "mcq":
      questions = addDistractors(byType.mcq, distractorCount);
      break;
    case "typing":
      questions = [...byType.typing, ...byType.gap].map((q) => ({ ...q, options: [] }));
      break;
    case "flashcard":
      questions = [...byType.flashcard, ...byType.mcq.map((q) => ({ ...q, type: "flashcard" }))];
      break;
    case "sequence":
      questions = byType.sequence;
      break;
    case "sort":
      questions = byType.sort;
      break;
    case "gap":
      questions = addDistractors(byType.gap, distractorCount);
      break;
    case "passage":
      questions = byType.passage;
      break;
    default:
      questions = addDistractors(byType.mcq, distractorCount);
      break;
  }

  return shuffle(questions).slice(0, count);
}

export function getDistractors(pack, excludeId, count = 3) {
  if (!pack?.byType?.mcq) return [];
  return pack.byType.mcq
    .filter((q) => q.id !== excludeId)
    .map((q) => q.correctAnswer)
    .filter((value, index, arr) => value && arr.indexOf(value) === index)
    .slice(0, count);
}
