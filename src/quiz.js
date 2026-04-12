import { humanizeLabel, levelMatches, normalizeForCompare, sampleSize, shuffle, tokenizeSentence } from "./utils.js";
import { isWordMastered } from "./storage.js";

export const QUESTION_MODES = [
  {
    id: "englishWordChooseGerman",
    title: "1) English word -> choose German",
    kind: "choice",
  },
  {
    id: "englishSentenceBuildGerman",
    title: "2) English sentence -> build German",
    kind: "build",
  },
  {
    id: "germanSentenceBuildEnglish",
    title: "3) German sentence -> build English",
    kind: "build",
  },
  {
    id: "englishWordTypeGerman",
    title: "4) English word -> type German",
    kind: "typed",
  },
  {
    id: "englishSentenceTypeGerman",
    title: "5) English sentence -> type German",
    kind: "typed",
  },
];

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

function makeWordChoiceQuestions(words, count, allWords) {
  const picks = cyclePick(words, count);
  return picks.map((word, index) => {
    const distractors = sampleSize(
      allWords.filter((candidate) => candidate.id !== word.id && candidate.de !== word.de),
      3,
    );
    const options = shuffle([word.de, ...distractors.map((item) => item.de)]);
    return {
      id: `choice-${word.id}-${index}`,
      modeId: "englishWordChooseGerman",
      modeTitle: humanizeLabel("english word choose german"),
      kind: "choice",
      prompt: word.en,
      answer: word.de,
      options,
      wordId: word.id,
      topic: word.topic,
      subtitle: word.topic,
      speechText: word.de,
      speechLanguage: "de-DE",
    };
  });
}

function makeWordTypedQuestions(words, count) {
  const picks = cyclePick(words, count);
  return picks.map((word, index) => ({
    id: `typed-word-${word.id}-${index}`,
    modeId: "englishWordTypeGerman",
    modeTitle: humanizeLabel("english word type german"),
    kind: "typed",
    prompt: word.en,
    answer: word.de,
    wordId: word.id,
    topic: word.topic,
    subtitle: word.topic,
    speechText: word.de,
    speechLanguage: "de-DE",
    placeholder: "Type the German answer",
  }));
}

function buildSentenceQuestion(sentence, modeId, index) {
  const question = {
    id: `${modeId}-${sentence.id}-${index}`,
    modeId,
    kind: modeId.includes("Build") ? "build" : "typed",
    answer: modeId === "germanSentenceBuildEnglish" ? sentence.en : sentence.de,
    wordId: sentence.target_vocab_id || (Array.isArray(sentence.vocab_ids) && sentence.vocab_ids.length ? sentence.vocab_ids[0] : null),
    subtitle: Array.isArray(sentence.topics) ? sentence.topics.join(", ") : "",
  };

  if (modeId === "englishSentenceBuildGerman") {
    return {
      ...question,
      modeTitle: "English sentence -> build German",
      prompt: sentence.en,
      tiles: shuffle(tokenizeSentence(sentence.de)),
      speechText: sentence.de,
      speechLanguage: "de-DE",
    };
  }

  if (modeId === "germanSentenceBuildEnglish") {
    return {
      ...question,
      modeTitle: "German sentence -> build English",
      prompt: sentence.de,
      tiles: shuffle(tokenizeSentence(sentence.en)),
      speechText: sentence.de,
      speechLanguage: "de-DE",
    };
  }

  return {
    ...question,
    modeTitle: "English sentence -> type German",
    prompt: sentence.en,
    speechText: sentence.de,
    speechLanguage: "de-DE",
    placeholder: "Type the German sentence",
  };
}

function makeSentenceQuestions(sentences, modeId, count) {
  const picks = cyclePick(sentences, count);
  return picks.map((sentence, index) => buildSentenceQuestion(sentence, modeId, index));
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

export function createQuizSession({ words, sentencePools, config, persistedState, customWords = null, label = null }) {
  const activeModes = QUESTION_MODES.filter((mode) => config.modes.includes(mode.id));
  if (!activeModes.length) {
    throw new Error("Choose at least one question mode.");
  }

  const candidateWords = customWords && customWords.length ? customWords : words;
  const wordPool = selectWordPool(candidateWords, config, persistedState);
  const sentencePool = selectSentencePool(wordPool, sentencePools, config);
  const counts = distribute(Math.max(activeModes.length * 3, config.questionCount), activeModes.length);

  const questionGroups = activeModes.map((mode, index) => {
    const count = counts[index];
    switch (mode.id) {
      case "englishWordChooseGerman":
        return makeWordChoiceQuestions(wordPool, count, wordPool);
      case "englishWordTypeGerman":
        return makeWordTypedQuestions(wordPool, count);
      case "englishSentenceBuildGerman":
      case "germanSentenceBuildEnglish":
      case "englishSentenceTypeGerman":
        return makeSentenceQuestions(sentencePool, mode.id, count);
      default:
        return [];
    }
  });

  return {
    id: `quiz-${Date.now()}`,
    label: label || "Quiz Cycle",
    questions: interleave(questionGroups),
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

export function gradeQuestion(question, response) {
  const expected = normalizeForCompare(question.answer);
  const actual = normalizeForCompare(response);
  return {
    correct: expected === actual,
    expected: question.answer,
    actual: response,
  };
}
