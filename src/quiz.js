import { levelMatches, normalizeForCompare, shuffle, tokenizeSentence } from "./utils.js";
import { isWordMastered } from "./storage.js";
import { normLang } from "./lang-utils.js";

const MODE_DEFINITIONS = [
  {
    id: "passageQuestionChooseAnswer",
    kind: "choice",
    family: "passage",
    direction: null,
  },
  // ── German modes ───────────────────────────────────────────────────────
  {
    id: "englishWordChooseGerman",
    kind: "choice",
    family: "word",
    direction: "targetToStudy",
  },
  {
    id: "germanWordChooseEnglish",
    kind: "choice",
    family: "word",
    direction: "studyToTarget",
  },
  {
    id: "englishWordTypeGerman",
    kind: "typed",
    family: "word",
    direction: "targetToStudy",
  },
  {
    id: "germanWordTypeEnglish",
    kind: "typed",
    family: "word",
    direction: "studyToTarget",
  },
  {
    id: "englishSentenceBuildGerman",
    kind: "build",
    family: "sentence",
    direction: "targetToStudy",
  },
  {
    id: "germanSentenceBuildEnglish",
    kind: "build",
    family: "sentence",
    direction: "studyToTarget",
  },
  {
    id: "englishSentenceTypeGerman",
    kind: "typed",
    family: "sentence",
    direction: "targetToStudy",
  },
  {
    id: "sequenceOrder",
    kind: "sequence",
    family: "process",
    direction: null,
  },
  {
    id: "categorySort",
    kind: "sort",
    family: "process",
    direction: null,
  },
  {
    id: "fillBlank",
    kind: "gap",
    family: "vocab",
    direction: null,
  },
  {
    id: "multipleChoice",
    kind: "choice",
    family: "standalone",
    direction: null,
  },
  // Note: additional language modes (latinWordChooseEnglish, etc.) are
  // automatically supported by the generic isReverse parser in makeVocabChoiceFromUnified.
  // No MODE_DEFINITIONS entry needed for them.
  // ── Generic modes ─────────────────────────────────────────────────────
  {
    id: "vocabMatch",
    kind: "match",
    family: "vocab",
    direction: null,
  },
];

function datasetLabels(dataset = null) {
  return {
    studyLabel:    dataset && dataset.sourceLanguageLabel  ? dataset.sourceLanguageLabel  : "German",
    targetLabel:   dataset && dataset.targetLanguageLabel ? dataset.targetLanguageLabel : "English",
    studyCode:     normLang(dataset && dataset.sourceLanguageCode) || "de-DE",
    targetCode:    normLang(dataset && dataset.targetLanguageCode) || "en-GB",
    speechLanguage: normLang(dataset && dataset.speechLanguage)
                 || normLang(dataset && dataset.sourceLanguageCode)
                 || "de-DE",
  };
}

function buildModeTitle(definition, labels) {
  if (definition.family === "passage") {
    return "Question -> choose answer";
  }
  if (definition.family === "standalone") {
    return "Multiple choice";
  }
  // The prompt always shows the STUDY language; the user types/builds the TARGET language.
  const promptLabel = labels.studyLabel;
  const answerLabel = labels.targetLabel;
  const noun = definition.family === "sentence" ? "sentence" : "word";
  const verb = definition.kind === "choice" ? "choose" : definition.kind === "build" ? "build" : "type";
  return `${promptLabel} ${noun} -> ${verb} ${answerLabel}`;
}

function buildModeHelp(definition) {
  if (definition.kind === "choice") {
    return "tap options";
  }
  if (definition.kind === "build") {
    return "build from tiles";
  }
  return "type the answer";
}

function buildSupportedModes(dataset = null) {
  const supportsSentences = !dataset || dataset.supportsSentences !== false;
  return MODE_DEFINITIONS
    .filter((definition) => supportsSentences || definition.family !== "sentence")
    .map((definition) => {
      const labels = datasetLabels(dataset);
      return {
        ...definition,
        title: buildModeTitle(definition, labels),
        help: buildModeHelp(definition),
      };
    });
}

function dedupeStrings(items) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const text = String(item || "").trim();
    if (!text) {
      continue;
    }
    const key = normalizeForCompare(text);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(text);
  }
  return output;
}

function firstTopic(item) {
  return Array.isArray(item && item.topics) ? item.topics[0] || "" : "";
}

function cyclePick(items, count) {
  if (!items.length || count <= 0) {
    return [];
  }
  const output = [];
  let deck = shuffle(items);
  while (output.length < count) {
    if (!deck.length) {
      deck = shuffle(items);
    }
    output.push(deck.pop());
  }
  return output;
}

function distribute(total, groups) {
  const base = Math.floor(total / groups);
  const remainder = total % groups;
  return Array.from({ length: groups }, (_value, index) => base + (index < remainder ? 1 : 0));
}

function selectWordPool(words, config, persistedState) {
  let pool = words.filter((word) => levelMatches(word.level, config.year));
  if (!pool.length) {
    pool = [...words];
  }
  if (config.excludeMastered) {
    const unmastered = pool.filter((word) => !isWordMastered(persistedState, word.id));
    if (unmastered.length >= Math.min(5, pool.length)) {
      pool = unmastered;
    }
  }
  if (pool.length < 4) {
    throw new Error("Not enough words to build a quiz. Choose another pack or include mastered words.");
  }
  return pool;
}

function selectSentencePool(words, sentencePools, config) {
  if (!sentencePools.combined.length) {
    return [];
  }

  const wordIds = new Set(words.map((word) => word.id));
  const topics = new Set(words.map((word) => String(word.topic || "").toLowerCase()));
  const related = sentencePools.combined.filter((sentence) => {
    if (!levelMatches(sentence.level, config.year)) {
      return false;
    }
    if (sentence.target_vocab_id && wordIds.has(sentence.target_vocab_id)) {
      return true;
    }
    if (Array.isArray(sentence.vocab_ids) && sentence.vocab_ids.some((id) => wordIds.has(id))) {
      return true;
    }
    if (Array.isArray(sentence.topics) && sentence.topics.some((topic) => topics.has(String(topic).toLowerCase()))) {
      return true;
    }
    return false;
  });

  if (related.length) {
    return related;
  }

  const yearFiltered = sentencePools.combined.filter((sentence) => levelMatches(sentence.level, config.year));
  return yearFiltered.length ? yearFiltered : sentencePools.combined;
}

function buildSubtitle(item) {
  return [item.stage_label, item.topic].filter(Boolean).join(" · ");
}

function takeDistractorValues(words, field, expectedValue, excludedId) {
  const values = shuffle(
    words
      .filter((candidate) => candidate.id !== excludedId)
      .map((candidate) => candidate[field])
      .filter((value) => normalizeForCompare(value) !== normalizeForCompare(expectedValue)),
  );
  return dedupeStrings(values).slice(0, 3);
}

function collectAcceptedAnswers(primary, extras) {
  return dedupeStrings([primary, ...(Array.isArray(extras) ? extras : [])]);
}

function makeWordChoiceQuestions(words, count, allWords, dataset, modeId) {
  const picks = cyclePick(words, count);
  const labels = datasetLabels(dataset);
  const isReverse = modeId === "germanWordChooseEnglish";
  return picks.map((word, index) => {
    const prompt = isReverse ? word.de : word.en;
    const answer = isReverse ? word.en : word.de;
    const optionField = isReverse ? "en" : "de";
    const options = shuffle([answer, ...takeDistractorValues(allWords, optionField, answer, word.id)]);
    const definition = buildSupportedModes(dataset).find((mode) => mode.id === modeId);

    return {
      id: `choice-${modeId}-${word.id}-${index}`,
      modeId,
      modeTitle: definition ? definition.title : buildModeTitle(MODE_DEFINITIONS[0], labels),
      kind: "choice",
      prompt,
      answer,
      options,
      wordId: word.id,
      sourceItemId: word.id,
      topic: word.topic,
      pos: word.part_of_speech || word.pos || "",
      subtitle: buildSubtitle(word),
      speechText: word.de,
      speechLanguage: labels.speechLanguage,
    };
  });
}

function makeWordTypedQuestions(words, count, dataset, modeId) {
  const picks = cyclePick(words, count);
  const labels = datasetLabels(dataset);
  const isReverse = modeId === "germanWordTypeEnglish";
  const definition = buildSupportedModes(dataset).find((mode) => mode.id === modeId);

  return picks.map((word, index) => ({
    id: `typed-${modeId}-${word.id}-${index}`,
    modeId,
    modeTitle: definition ? definition.title : buildModeTitle(MODE_DEFINITIONS[0], labels),
    kind: "typed",
    prompt: isReverse ? word.de : word.en,
    answer: isReverse ? word.en : word.de,
    acceptedAnswers: isReverse
      ? collectAcceptedAnswers(word.en, word.accepted_translations)
      : collectAcceptedAnswers(word.de, word.accepted_answers),
    wordId: word.id,
    sourceItemId: word.id,
    topic: word.topic,
    pos: word.part_of_speech || word.pos || "",
    subtitle: buildSubtitle(word),
    speechText: word.de,
    speechLanguage: labels.speechLanguage,
    placeholder: `Type the ${isReverse ? labels.targetLabel : labels.studyLabel} answer`,
  }));
}

function buildSentenceQuestion(sentence, modeId, dataset, index) {
  const labels = datasetLabels(dataset);
  const definition = buildSupportedModes(dataset).find((mode) => mode.id === modeId);
  const question = {
    id: `${modeId}-${sentence.id}-${index}`,
    modeId,
    modeTitle: definition ? definition.title : buildModeTitle(MODE_DEFINITIONS[4], labels),
    kind: modeId.includes("Build") ? "build" : "typed",
    answer: modeId === "germanSentenceBuildEnglish" ? sentence.en : sentence.de,
    acceptedAnswers: [modeId === "germanSentenceBuildEnglish" ? sentence.en : sentence.de],
    wordId: sentence.target_vocab_id || (Array.isArray(sentence.vocab_ids) && sentence.vocab_ids.length ? sentence.vocab_ids[0] : null),
    sourceItemId: sentence.id,
    subtitle: Array.isArray(sentence.topics) ? sentence.topics.join(", ") : "",
  };

  if (modeId === "englishSentenceBuildGerman") {
    return {
      ...question,
      prompt: sentence.en,
      tiles: shuffle(tokenizeSentence(sentence.de)),
      speechText: sentence.de,
      speechLanguage: labels.speechLanguage,
    };
  }

  if (modeId === "germanSentenceBuildEnglish") {
    return {
      ...question,
      prompt: sentence.de,
      tiles: shuffle(tokenizeSentence(sentence.en)),
      speechText: sentence.de,
      speechLanguage: labels.speechLanguage,
    };
  }

  return {
    ...question,
    prompt: sentence.en,
    speechText: sentence.de,
    speechLanguage: labels.speechLanguage,
    placeholder: `Type the ${labels.studyLabel} sentence`,
  };
}

function makeSentenceQuestions(sentences, modeId, count, dataset) {
  const picks = cyclePick(sentences, count);
  return picks.map((sentence, index) => buildSentenceQuestion(sentence, modeId, dataset, index));
}

export function makeSequenceQuestions(items, count, dataset) {
  const picks = cyclePick(items, count);
  const labels = datasetLabels(dataset);
  return picks.map((item, index) => ({
    id: `seq-${item.id}-${index}`,
    modeId: "sequenceOrder",
    modeTitle: "Arrange in order",
    kind: "sequence",
    prompt: item.title,
    instruction: item.instruction,
    correctOrder: item.items,
    shuffledOrder: shuffle([...item.items]),
    speechText: item.items.join(". "),
    speechLanguage: labels.speechLanguage,
  }));
}

export function makeCategorySortQuestions(items, count, dataset) {
  const picks = cyclePick(items, count);
  const labels = datasetLabels(dataset);
  return picks.map((item, index) => {
    const shuffledItems = shuffle([...item.items]);
    const distractors = ["freeze-thaw", "plucking", "abrasion", "corrie", "arête", "U-shaped valley"];
    const extraText = shuffle(distractors)[0];
    const allItems = [...shuffledItems, { text: extraText, category: item.categories[0] }];
    return {
      id: `cat-${item.id}-${index}`,
      modeId: "categorySort",
      modeTitle: "Sort into categories",
      kind: "sort",
      prompt: item.title,
      instruction: item.instruction,
      categories: item.categories,
      items: shuffle(allItems),
      speechText: item.items.map((i) => i.text).join(", "),
      speechLanguage: labels.speechLanguage,
    };
  });
}

export function makeFillBlankQuestions(items, count, dataset) {
  const picks = cyclePick(items, count);
  const labels = datasetLabels(dataset);
  return picks.map((item, index) => {
    const wrongAnswers = shuffle(
      dedupeStrings(
        items
          .filter((i) => normalizeForCompare(i.answer) !== normalizeForCompare(item.answer))
          .map((i) => i.answer),
      ),
    ).slice(0, 3);
    return {
      id: `gap-${item.id}-${index}`,
      modeId: "fillBlank",
      modeTitle: "Multiple choice",
      kind: "choice",
      prompt: item.question || item.sentence,
      answer: item.answer,
      acceptedAnswers: [item.answer],
      hint: item.hint || "",
      options: shuffle([item.answer, ...wrongAnswers]),
      speechText: item.sentence,
      speechLanguage: labels.speechLanguage,
    };
  });
}

// ─── Unified pack factory functions ──────────────────────────────────

export function makeVocabChoiceFromUnified(unifiedItems, count, dataset, modeId) {
  const vocab = unifiedItems.filter((item) => item.type === "vocab");
  const picks = cyclePick(vocab, count);
  const labels = datasetLabels(dataset);

  // Parse the direction from the mode ID string itself — truly generic, no hardcoded languages.
  // Mode ID format: "{language}Word{Action}{language}"
  // e.g. "germanWordChooseEnglish"  → shown=German,  chosen=English  (studyToTarget)
  // e.g. "englishWordChooseGerman"  → shown=English, chosen=German   (targetToStudy)
  // e.g. "latinWordChooseEnglish"   → shown=Latin,   chosen=English  (studyToTarget)
  //
  // IMPORTANT: the regex must stop before "Word" or "Sentence" — NOT at "Choose/Type/Build" —
  // otherwise "englishWord" is captured instead of "english", making the label comparison fail.
  const shownLang = modeId.replace(/^(.+?)(Word|Sentence)(Choose|Type|Build)(.+)$/, "$1");
  // isReverse = the prompt is the TARGET language (English shown, user picks study language).
  const isReverse = shownLang.toLowerCase() === labels.targetLabel.toLowerCase();

  return picks.map((item, index) => {
    // ── Read translations (new format) with legacy fallback ──────────────
    const translations = item.data.translations || {};
    const src = translations[labels.studyCode]
             || translations[labels.speechLanguage]
             || translations["de-DE"]
             || translations["en-GB"]
             || item.data.sourceWord
             || item.data.de
             || "";
    const tgt = translations[labels.targetCode]
             || translations["en-GB"]
             || translations["de-DE"]
             || item.data.targetWord
             || item.data.en
             || "";

    const prompt   = isReverse ? tgt : src;
    const answer   = isReverse ? src : tgt;
    const optionF  = isReverse ? src : tgt;

    const wrongAnswers = vocab
      .filter((v) => v.id !== item.id)
      .map((v) => {
        const t = v.data.translations || {};
        const s = t[labels.studyCode] || t[labels.speechLanguage]
               || t["de-DE"] || t["en-GB"] || v.data.sourceWord || v.data.de || "";
        const g = t[labels.targetCode] || t["en-GB"] || t["de-DE"]
               || v.data.targetWord || v.data.en || "";
        return isReverse ? s : g;
      })
      .filter((v) => normalizeForCompare(v) !== normalizeForCompare(answer));

    const distractors = shuffle(dedupeStrings(wrongAnswers)).slice(0, 3);
    const options = shuffle([answer, ...distractors]);

    // ── Read example via new 'examples' dict with legacy fallback ─────────
    const examples = item.data.examples || {};
    const exampleSrc = examples[labels.studyCode]
                    || examples[labels.speechLanguage]
                    || examples["de-DE"]
                    || item.data.exampleSource
                    || null;

    return {
      id:          `choice-${modeId}-${item.id}-${index}`,
      modeId,
      modeTitle:   buildModeTitle({ id: modeId, kind: "choice", family: "word", direction: isReverse ? "targetToStudy" : "studyToTarget" }, labels),
      kind:        "choice",
      prompt,
      answer,
      options,
      wordId:      item.id,
      sourceItemId: item.id,
      topic:       Array.isArray(item.topics) ? item.topics[0] : (item.tags && item.tags[0]) || "",
      subtitle:    item.level || "",
      speechText:  src,
      speechLanguage: labels.speechLanguage,
      example:     exampleSrc,
      stimulus:    item.data.stimulus || null,
    };
  });
}

export function makeSequenceFromUnified(unifiedItems, count, dataset) {
  const sequences = unifiedItems.filter((item) => item.type === "sequence");
  const picks = cyclePick(sequences, count);
  const labels = datasetLabels(dataset);
  return picks.map((item, index) => ({
    id: `seq-${item.id}-${index}`,
    modeId: "sequenceOrder",
    modeTitle: item.data.title || "Arrange in order",
    kind: "sequence",
      prompt: item.data.title || "",
      instruction: item.data.instruction || "",
      correctOrder: item.data.items || [],
      shuffledOrder: shuffle([...(item.data.items || [])]),
      sourceItemId: item.id,
      speechText: (item.data.items || []).join(". "),
    speechLanguage: labels.speechLanguage,
    stimulus: item.data.stimulus || null,
  }));
}

export function makeCategorySortFromUnified(unifiedItems, count, dataset) {
  const sorts = unifiedItems.filter((item) => item.type === "categorySort");
  const picks = cyclePick(sorts, count);
  const labels = datasetLabels(dataset);
  return picks.map((item, index) => {
    const pairs = item.data.pairs || [];
    return {
      id: `cat-${item.id}-${index}`,
      modeId: "categorySort",
      modeTitle: item.data.title || "Sort into categories",
      kind: "sort",
      prompt: item.data.title || "",
      instruction: item.data.instruction || "",
      categories: item.data.categories || [],
      items: shuffle([...pairs]),
      sourceItemId: item.id,
      speechText: pairs.map((p) => p.text).join(", "),
      speechLanguage: labels.speechLanguage,
      stimulus: item.data.stimulus || null,
    };
  });
}

export function makeFillBlankFromUnified(unifiedItems, count, dataset, answerMode = "mixed") {
  const gaps = unifiedItems.filter((item) => item.type === "fillBlank");
  const picks = cyclePick(gaps, count);
  const labels = datasetLabels(dataset);
  const mode = answerMode === "choice" ? "mcq" : answerMode;
  return picks.map((item, index) => {
    const d = item.data || {};
    // Respect the user's answerMode selection:
    //   "typed"  → never show MCQ buttons; always render as free-text
    //   "mcq"    → always show MCQ buttons; generate options from pool when not explicit
    //   "mixed"  → MCQ only for items that carry explicit options; typed for the rest
    // The renderer uses `options.length > 0` to decide MCQ vs textarea.
    const hasExplicitOptions = Array.isArray(d.options) && d.options.length >= 2;
    let options;
    if (mode === "typed") {
      options = []; // force textarea regardless of item data
    } else if (hasExplicitOptions && (mode === "mcq" || mode === "mixed")) {
      options = shuffle([...d.options]);
    } else if (mode === "mcq") {
      // No explicit options: generate distractors from the pool
      const wrongAnswers = shuffle(
        dedupeStrings(
          gaps
            .filter((g) => g.id !== item.id)
            .map((g) => g.data.answer)
            .filter((v) => normalizeForCompare(v) !== normalizeForCompare(d.answer || "")),
        ),
      ).slice(0, 3);
      options = shuffle([d.answer, ...wrongAnswers]);
    } else {
      // mixed, no explicit options → typed
      options = [];
    }
    const isChoice = options.length > 0;
    const prompt = d.question || d.sentence || "";
    return {
      id: `gap-${item.id}-${index}`,
      modeId: "fillBlank",
      modeTitle: isChoice ? "Multiple choice" : "Fill in the blank",
      kind: isChoice ? "choice" : "gap",
      prompt,
      answer: d.answer || "",
      acceptedAnswers: [d.answer],
      hint: d.hint || "",
      options,
      sourceItemId: item.id,
      speechText: prompt,
      speechLanguage: labels.speechLanguage,
      stimulus: d.stimulus || null,
    };
  });
}

export function makeMultipleChoiceFromUnified(unifiedItems, count, dataset) {
  const choices = unifiedItems.filter((item) => {
    if (item.type !== "multipleChoice") return false;
    const d = item.data || {};
    const prompt = d.question || d.prompt || "";
    const answer = d.answer || "";
    const options = Array.isArray(d.options) ? d.options : [];
    return prompt && answer && options.length >= 2;
  });
  const picks = cyclePick(choices, count);
  const labels = datasetLabels(dataset);

  return picks.map((item, index) => {
    const d = item.data || {};
    const prompt = d.question || d.prompt || "";
    const answer = d.answer || "";
    const explicitOptions = Array.isArray(d.options)
      ? dedupeStrings(d.options)
      : [];
    const options = explicitOptions.some((option) => normalizeForCompare(option) === normalizeForCompare(answer))
      ? explicitOptions
      : dedupeStrings([answer, ...explicitOptions]);

    return {
      id: `mcq-${item.id}-${index}`,
      modeId: "multipleChoice",
      modeTitle: "Multiple choice",
      kind: "choice",
      prompt,
      answer,
      acceptedAnswers: [answer],
      hint: d.hint || "",
      options: shuffle(options),
      sourceItemId: item.id,
      speechText: prompt,
      speechLanguage: labels.speechLanguage,
      stimulus: d.stimulus || null,
      topic: firstTopic(item),
    };
  });
}

export function makePassageChoiceFromUnified(unifiedItems, count, dataset) {
  const labels = datasetLabels(dataset);
  const questions = [];

  for (const item of unifiedItems) {
    if (item.type !== "passage") {
      continue;
    }
    const data = item.data || {};
    const sourceTitle = data.sourceTitle || data.title || firstTopic(item) || "Passage";
    const rawQuestions = Array.isArray(data.questions) ? data.questions : [];

    for (const question of rawQuestions) {
      const options = dedupeStrings(question.options || []);
      const correctOptionIndex = Number.isInteger(question.correctOptionIndex)
        ? question.correctOptionIndex
        : Number.isInteger(question.correct_option_index)
          ? question.correct_option_index
          : -1;
      const correctAnswer = question.correctAnswer
        || question.correct_answer
        || question.modelAnswer
        || question.model_answer_en
        || (correctOptionIndex >= 0 ? options[correctOptionIndex] : "");

      if (!question.question || options.length < 2 || !correctAnswer) {
        continue;
      }

      questions.push({
        sourceItemId: `${item.id}::${question.id || questions.length}`,
        id: `passage-choice-${item.id}-${question.id || questions.length}`,
        modeId: "passageQuestionChooseAnswer",
        modeTitle: "Question -> choose answer",
        kind: "choice",
        prompt: question.question,
        answer: correctAnswer,
        options,
        subtitle: sourceTitle,
        topic: firstTopic(item),
        speechText: question.question,
        speechLanguage: labels.speechLanguage,
        stimulus: data.stimulus || null,
      });
    }
  }

  return cyclePick(questions, count);
}

export function makeSentenceFromUnified(unifiedItems, count, dataset, modeId) {
  const sentences = unifiedItems.filter((item) => item.type === "sentence");
  const picks = cyclePick(sentences, count);
  const labels = datasetLabels(dataset);
  const isBuild = modeId.includes("Build");

  return picks.map((item, index) => {
    // ── Read translations (new format) with legacy fallback ──────────────
    const translations = item.data.translations || {};
    const src = translations[labels.studyCode]
             || translations[labels.speechLanguage]
             || translations["de-DE"]
             || translations["en-GB"]
             || item.data.sourceSentence
             || "";
    const tgt = translations[labels.targetCode]
             || translations["en-GB"]
             || translations["de-DE"]
             || item.data.targetSentence
             || "";

    const prompt = isBuild
      ? (modeId === "englishSentenceBuildGerman" ? tgt : src)
      : src;
    const answer = isBuild
      ? (modeId === "englishSentenceBuildGerman" ? src : tgt)
      : tgt;

    return {
      id:             `${modeId}-${item.id}-${index}`,
      modeId,
      modeTitle:      buildModeTitle({ id: modeId, kind: isBuild ? "build" : "typed", family: "sentence", direction: null }, labels),
      kind:           isBuild ? "build" : "typed",
      prompt,
      answer,
      acceptedAnswers: [answer],
      tiles:          shuffle(tokenizeSentence(answer)),
      speechText:     src,
      speechLanguage: labels.speechLanguage,
      placeholder:    `Type the ${labels.studyLabel} sentence`,
      stimulus:       item.data.stimulus || null,
    };
  });
}

function interleave(questionGroups) {
  const decks = questionGroups.map((group) => [...group]);
  const merged = [];
  while (decks.some((group) => group.length)) {
    for (const group of decks) {
      if (group.length) {
        merged.push(group.shift());
      }
    }
  }
  return merged;
}

export function getQuestionModes(dataset = null) {
  return buildSupportedModes(dataset);
}

export function getDefaultQuestionModes(dataset = null) {
  const supportedModeIds = new Set(getQuestionModes(dataset).map((mode) => mode.id));
  const requested = Array.isArray(dataset && dataset.defaultQuizModes) && dataset.defaultQuizModes.length
    ? dataset.defaultQuizModes
    : ["englishWordChooseGerman", "englishSentenceBuildGerman", "germanSentenceBuildEnglish"];
  const filtered = requested.filter((modeId) => supportedModeIds.has(modeId));
  return filtered.length ? filtered : getQuestionModes(dataset).slice(0, 3).map((mode) => mode.id);
}

// ─── Subject First adapter ────────────────────────────────────────────────
//
// Translates the new high-level UI selections — { subject, direction, answerMode }
// — into the legacy mode-ID array that createQuizSession() consumes. Keeps the
// engine itself untouched; the UI never has to know the legacy IDs.
//
// Legacy mode-ID names still say "german"/"english" even when the pack is
// Latin/French/etc. — that's a naming hangover from before PR #11 made the
// engine generic. Internally the engine treats them as direction tokens
// (studyToTarget / targetToStudy), not language tokens.
//
//   subject:    "language" | "history" | "geography" | "science"
//   direction:  "studyToTarget" | "targetToStudy"   (language packs only)
//   answerMode: "mcq" | "typed" | "mixed"
export function resolveQuizModesForUI({
  subject = "language",
  direction = "studyToTarget",
  answerMode = "mixed",
  fillBlankCount = 0,
  multipleChoiceCount = 0,
  vocabCount = -1,
}) {
  const isReverse = direction === "targetToStudy";

  // Word-level choice/type mode IDs. The engine treats these as direction
  // tokens regardless of the literal "german"/"english" in the name.
  const choiceMode = isReverse ? "englishWordChooseGerman" : "germanWordChooseEnglish";
  const typedMode  = isReverse ? "englishWordTypeGerman"   : "germanWordTypeEnglish";
  // Sentence-build mode IDs (language packs only).
  const buildMode  = isReverse ? "englishSentenceBuildGerman" : "germanSentenceBuildEnglish";

  // Normalise UI label → canonical engine value.
  // "choice" is the React UI label; the legacy engine used "mcq".
  const mode = answerMode === "choice" ? "mcq" : answerMode;

  if (subject === "language") {
    const standaloneModes = [
      ...(multipleChoiceCount > 0 ? ["multipleChoice"] : []),
      ...(fillBlankCount > 0 ? ["fillBlank"] : []),
    ];

    // Grammar-only packs: no vocab items, only standalone quiz items.
    if (standaloneModes.length > 0 && vocabCount === 0) {
      return standaloneModes;
    }

    // Mixed packs: vocab + standalone grammar/question items.
    // Include standalone modes alongside the vocab modes so grammar questions are generated too.
    const vocabModes =
      mode === "mcq"   ? [choiceMode] :
      mode === "typed" ? [typedMode]  :
      mode === "build" ? [buildMode]  :
      [choiceMode, typedMode];  // mixed
    return standaloneModes.length > 0 ? [...vocabModes, ...standaloneModes] : vocabModes;
  }

  if (subject === "literature") {
    if (mode === "mcq")   return ["passageQuestionChooseAnswer"];
    if (mode === "typed") return ["fillBlank"];
    return ["passageQuestionChooseAnswer", "fillBlank", "categorySort"];
  }

  // Non-language packs: direction is ignored (prompt language matches the
  // pack's source). Use studyToTarget word modes; the engine will pull MCQ
  // options or typed answers from whatever vocab the pack has.
  // "build" has no sentence pools in non-language packs — fall back to mixed.
  if (mode === "mcq")   return ["germanWordChooseEnglish"];
  if (mode === "typed") return ["germanWordTypeEnglish"];
  return ["germanWordChooseEnglish", "germanWordTypeEnglish"];
}

export function createQuizSession({ words, sentencePools, config, persistedState, customWords = null, label = null, dataset = null, sequenceItems = [], categorySortItems = [], fillBlankItems = [], unifiedPack = null, passageUnifiedPack = null }) {
  const availableModes = getQuestionModes(dataset);
  const activeModes = availableModes.filter((mode) => config.modes.includes(mode.id));
  if (!activeModes.length) {
    throw new Error("Choose at least one compatible question mode for this dataset.");
  }

  const candidateWords = customWords && customWords.length ? customWords : words;
  const needsWordPool = activeModes.some((mode) => mode.family === "word" || mode.family === "sentence");
  const wordPool = needsWordPool ? selectWordPool(candidateWords, config, persistedState) : [];
  const needsSentences = activeModes.some((mode) => mode.family === "sentence");
  const sentencePool = needsSentences ? selectSentencePool(wordPool, sentencePools, config) : [];
  const rawUnifiedItems = unifiedPack && Array.isArray(unifiedPack.items) ? unifiedPack.items : null;

  // For stage-based packs (e.g. Cambridge Latin), filter non-vocab unified items
  // (fillBlank, sequence, etc.) to only the selected stages.  Vocab items are
  // already filtered upstream by filterWordsForScope; this mirrors that filtering
  // for the unified-item path so Stage selection works for grammar packs too.
  const selectedStages = Array.isArray(config.stages) && config.stages.length > 0
    ? new Set(config.stages.map(String))
    : null;
  const unifiedItems = rawUnifiedItems && selectedStages
    ? rawUnifiedItems.filter((item) => {
        if (item.type === "vocab") return true; // vocab already filtered via words
        const stageStr = String(item.level || "").replace(/^Stage\s+/i, "").trim();
        return !stageStr || isNaN(Number(stageStr)) || selectedStages.has(stageStr);
      })
    : rawUnifiedItems;

  const counts = distribute(Math.max(activeModes.length * 3, config.questionCount), activeModes.length);

  const questionGroups = activeModes.map((mode, index) => {
    const count = counts[index];
    switch (mode.id) {
      case "passageQuestionChooseAnswer":
        if (passageUnifiedPack && Array.isArray(passageUnifiedPack.items)) {
          return makePassageChoiceFromUnified(passageUnifiedPack.items, count, dataset);
        }
        return [];
      case "englishWordChooseGerman":
      case "germanWordChooseEnglish":
        if (unifiedItems) {
          return makeVocabChoiceFromUnified(unifiedItems, count, dataset, mode.id);
        }
        return makeWordChoiceQuestions(wordPool, count, wordPool, dataset, mode.id);
      case "englishWordTypeGerman":
      case "germanWordTypeEnglish":
        return makeWordTypedQuestions(wordPool, count, dataset, mode.id);
      case "englishSentenceBuildGerman":
      case "germanSentenceBuildEnglish":
      case "englishSentenceTypeGerman":
        if (unifiedItems && unifiedItems.some(i => i.type === "sentence")) {
          return makeSentenceFromUnified(unifiedItems, count, dataset, mode.id);
        }
        return makeSentenceQuestions(sentencePool, mode.id, count, dataset);
      case "sequenceOrder":
        if (unifiedItems) {
          return makeSequenceFromUnified(unifiedItems, count, dataset);
        }
        return makeSequenceQuestions(sequenceItems, count, dataset);
      case "categorySort":
        if (unifiedItems) {
          return makeCategorySortFromUnified(unifiedItems, count, dataset);
        }
        return makeCategorySortQuestions(categorySortItems, count, dataset);
      case "fillBlank":
        if (unifiedItems) {
          return makeFillBlankFromUnified(unifiedItems, count, dataset, config.answerMode);
        }
        return makeFillBlankQuestions(fillBlankItems, count, dataset);
      case "multipleChoice":
        if (unifiedItems) {
          return makeMultipleChoiceFromUnified(unifiedItems, count, dataset);
        }
        return [];
      default:
        return [];
    }
  });

  const questions = interleave(questionGroups);
  if (!questions.length) {
    throw new Error("No questions could be generated for the current pack. Try a different stage selection or question mix.");
  }

  return {
    id: `quiz-${Date.now()}`,
    label: label || "Quiz Cycle",
    questions,
    index: 0,
    score: 0,
    answers: [],
    awaitingNext: false,
    feedback: null,
    buildState: null,
    config,
  };
}

export function makeBuildState(question) {
  return {
    answerTiles: [],
    bankTiles: question.tiles.map((text, index) => ({
      id: `${question.id}-tile-${index}`,
      text,
    })),
  };
}

export function gradeQuestion(question, response, extra = null) {
  // Custom grading for new geography question types
  if (extra) {
    if (extra.isSequence) {
      const userOrder = (response || "").split(" || ")[0] || "";
      const correct = normalizeForCompare(userOrder) === normalizeForCompare((extra.correctOrder || []).join(" "));
      const correctOrderStr = (extra.correctOrder || []).join(" → ");
      return {
        correct,
        expected: correctOrderStr,
        actual: userOrder || response,
      };
    }
    if (extra.isSort) {
      return {
        correct: normalizeForCompare(response) === normalizeForCompare("sort:correct"),
        expected: "Sort all items into their correct categories",
        actual: response,
      };
    }
  }
  const actual = normalizeForCompare(response);
  const acceptedAnswers = Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length
    ? question.acceptedAnswers
    : [question.answer];
  const expectedNormalized = acceptedAnswers.map((value) => normalizeForCompare(value)).filter(Boolean);
  return {
    correct: expectedNormalized.includes(actual),
    expected: question.answer,
    actual: response,
  };
}
