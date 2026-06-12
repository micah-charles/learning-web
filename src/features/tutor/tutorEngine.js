/**
 * tutorEngine.js
 *
 * Core logic for FoxChild Tutor responses.
 * Deterministic, template-based answers - no LLM in Phase 1.
 */

import { humanizeLabel, normalizeForCompare } from "@/utils.js";
import { retrieveContent, getVocabHint } from "./tutorRetrieval.js";
import { speakWithPreferredVoice, SpeechMode } from "./tutorSpeech.js";

/**
 * Tutor response types.
 */
export const ResponseType = {
  HINT: "hint",
  EXPLANATION: "explanation",
  VOCABULARY: "vocabulary",
  READING: "reading",
  GRAMMAR: "grammar",
  STUDYBOOK: "studybook",
  REFUSAL: "refusal",
  GREETING: "greeting",
  HELP: "help",
};

/**
 * Check if query is a greeting.
 */
const GREETING_PATTERNS = [
  /^(hi|hello|hey|hola|hallo|guten tag|bonjour)\b/i,
  /^(good morning|good afternoon|good evening)\b/i,
];

/**
 * Check if query asks for help.
 */
const HELP_PATTERNS = [
  /\b(help|what can you do|how does this work|what are you)\b/i,
];

/**
 * Check if query is unrelated to learning content.
 */
const OFF_TOPIC_PATTERNS = [
  /\b(weather|news|politics|sports|celebrity|movie|music|game|recipe|cook)\b/i,
  /\b(who is|what is|when is|where is) (the president|the prime minister|taylor swift|elon musk)\b/i,
];

/**
 * Module-level map tracking hint count per question ID.
 * Used for progressive hint levels in quiz mode.
 */
const hintCountMap = new Map();

export function resetHintProgress(questionId = null) {
  if (questionId) {
    hintCountMap.delete(questionId);
    return;
  }
  hintCountMap.clear();
}

/**
 * Check if query asks for explanation (after trying).
 */
const EXPLANATION_PATTERNS = [
  /\b(explain|why|how|reason|because|answer|solution|show me|tell me)\b/i,
];

/**
 * Check if query asks for vocabulary help.
 */
const VOCAB_PATTERNS = [
  /\b(meaning|translate|definition|vocab|vocabulary|word|Wort|meaning of)\b/i,
];

/**
 * Check if query asks for reading help.
 */
const READING_PATTERNS = [
  /\b(passage|text|reading|paragraph|evidence|quote|comprehension)\b/i,
];

/**
 * Check if query asks for grammar help.
 */
const GRAMMAR_PATTERNS = [
  /\b(grammar|tense|case|gender|declension|conjugation|sentence structure|PEE|point evidence)\b/i,
];

/**
 * Classify the learner's query in quiz context.
 * @param {string} query - User query.
 * @param {object} currentQuestion - Current quiz question.
 * @returns {string} One of: word_clarification, concept_explanation, hint, answer_request, studybook_search, off_topic
 */
export function classifyTutorQuizIntent(query, currentQuestion) {
  const lower = query.trim().toLowerCase();

  // 1. Off-topic (highest priority)
  if (OFF_TOPIC_PATTERNS.some(p => p.test(lower))) {
    return "off_topic";
  }

  // 2. Hint request
  if (/^(hint|clue|nudge|i[' ]?m stuck|stuck)\b/i.test(lower) ||
      /\b(give me a hint|give me a clue|what should i do)\b/i.test(lower)) {
    return "hint";
  }

  // 3. Answer request — check before concept_explanation
  if (/^(the )?answer\b/i.test(lower) ||
      /\b(which one|correct answer|tell me (the )?answer|show me (the )?answer|give me (the )?answer|what('s| is) (the )?answer|reveal|solution)\b/i.test(lower)) {
    return "answer_request";
  }

  // 4. Concept explanation
  if (/^(what (is|are|does|do) |meaning of|explain |define |definition of|describe |what's )/i.test(lower)) {
    return "concept_explanation";
  }

  // 5. Short word/phrase that appears in question context — word_clarification
  const words = lower.split(/\s+/).filter(w => w.length > 0);
  if (words.length <= 4) {
    const questionText = `${currentQuestion.prompt || ""} ${currentQuestion.answer || ""} ${(currentQuestion.options || []).join(" ")} ${currentQuestion.topic || ""}`.toLowerCase();
    if (questionText.includes(lower)) {
      return "word_clarification";
    }
  }

  // 6. Check if query relates to question at all
  const questionText = `${currentQuestion.prompt || ""} ${currentQuestion.answer || ""} ${(currentQuestion.options || []).join(" ")} ${currentQuestion.topic || ""}`.toLowerCase();
  const tokens = lower.split(/\s+/).filter(w => w.length > 2);
  const matchesQuestion = tokens.length === 0 || tokens.some(t => questionText.includes(t));

  if (!matchesQuestion) {
    return "studybook_search";
  }

  // 7. Default for related queries
  return "word_clarification";
}

/**
 * Generate a context-aware hint for a quiz question at a given hint level.
 * Level 1: explain key word simply.
 * Level 2: point to key clues.
 * Level 3+: near-answer clue.
 * @param {object} question - Current quiz question.
 * @param {string} query - User query.
 * @param {number} hintLevel - Progressive hint level (1-based).
 * @returns {string} Hint response.
 */
function generateQuestionAwareExplanation(question, query, hintLevel) {
  const { prompt, answer, options = [], hint, explanation, topic, kind } = question;
  const promptStr = prompt || "";
  const topicStr = topic || "";

  if (hintLevel <= 1) {
    // Level 1: explain key word simply
    if (topicStr) {
      return `This question is about **${topicStr}**. The key term is "${promptStr}". Think about what this term means in context.`;
    }
    return `The key term here is "${promptStr}". What does this refer to in your studies?`;
  }

  if (hintLevel === 2) {
    // Level 2: point to key clues
    if (hint) {
      return `Here's a clue: ${hint}`;
    }
    if (kind === "choice" && options.length > 0) {
      const clue = topicStr ? `Think about **${topicStr}**` : "Think about what you've learned";
      return `${clue} — which option best describes "${promptStr}"? Eliminate ones that don't fit.`;
    }
    if (answer) {
      const trimmed = answer.trim();
      const firstLetter = trimmed[0] || "";
      const wordCount = trimmed.split(/\s+/).length;
      return `The answer ${wordCount > 1 ? `has ${wordCount} words` : "is a single word"} starting with "${firstLetter}". Does that ring a bell?`;
    }
    return "Look at the question again. What key details stand out?";
  }

  if (hintLevel >= 3) {
    // Level 3+: near-answer clue
    if (hint) {
      return `Final clue: ${hint}`;
    }
    if (answer && kind === "choice") {
      return `You're very close. Think about which option directly relates to "${promptStr}".`;
    }
    if (answer) {
      const preview = answer.trim().slice(0, 80);
      return `The answer relates to "${promptStr}". Consider: ${preview}...`;
    }
    return "You've had several hints. Try to reason it out step by step.";
  }

  return "Take a moment to think. What do you know about this topic?";
}

/**
 * Determine if user is asking for explanation (after hint).
 * @param {string} query - User query.
 * @param {boolean} hintGiven - Whether a hint was already given for this question.
 * @returns {boolean}
 */
export function wantsExplanation(query, hintGiven) {
  if (!hintGiven) return false;
  return EXPLANATION_PATTERNS.some(p => p.test(query));
}

/**
 * Generate a hint for a quiz question, intent-aware.
 * @param {object} question - Current quiz question.
 * @param {string} query - User query.
 * @param {string} intent - Classified intent from classifyTutorQuizIntent.
 * @param {number} hintCount - Number of hints already given for this question.
 * @returns {string} Hint response.
 */
function generateQuizHint(question, query, intent, hintCount) {
  const kind = question.kind;
  const prompt = question.prompt || "";
  const answer = question.answer || "";
  const options = question.options || [];
  const hint = question.hint || "";
  const topic = question.topic || "";
  const explanation = question.explanation || "";
  const pos = question.pos || "";

  switch (intent) {
    case "word_clarification": {
      const clue = topic
        ? `This question is about **${topic}**.`
        : "This term matters to the question.";
      if (kind === "choice" && options.length > 0) {
        return `${clue} Think about what "${prompt}" means, then compare the options and rule out the ones that do not fit.`;
      }
      if (hint) {
        return `${clue} ${hint}`;
      }
      return `${clue} Consider what "${prompt}" means in this context before you answer.`;
    }

    case "concept_explanation": {
      let resp = "";
      if (topic) resp += `**${topic}**: `;
      if (hint) {
        resp += hint;
      } else if (kind === "choice" && options.length > 0) {
        resp += `The question asks about "${prompt}". Review the options and eliminate the ones that do not match the idea in the question.`;
      } else {
        resp += `Think through what "${prompt}" means and how it fits this question.`;
      }
      if (kind === "choice" && options.length > 0 && !hint) {
        resp += "\n\nLook carefully for clues in the wording before you choose.";
      }
      return resp;
    }

    case "hint":
      // Progressive hint levels
      return generateQuestionAwareExplanation(question, query, hintCount);

    case "answer_request":
      // Only reveal if a hint has previously been given
      if (hintCount > 1) {
        return generateQuizExplanation(question);
      }
      return "I'd like you to try first! Ask me for a hint if you're stuck, and I'll guide you step by step.";

    default: {
      // Legacy fallback based on question kind
      if (kind === "choice") {
        if (hint) return `Hint: ${hint}`;
        if (topic) return `Think about the topic: ${topic}. Look at the options carefully — one stands out.`;
        if (pos) return `This is a ${pos.toLowerCase()}. ${prompt}`;
        return "Read the question carefully. What is being asked? Eliminate options that don't fit.";
      }
      if (kind === "typed" || kind === "gap") {
        if (hint) return `Hint: ${hint}`;
        if (answer) {
          const len = answer.trim().length;
          const first = answer.trim()[0] || "";
          return `The answer is ${len} letters long, starts with "${first}". ${kind === "gap" ? "Check the sentence context." : ""}`;
        }
        return "Think about what fits the context. Sound it out if it's a word.";
      }
      if (kind === "build") {
        return "Look at the tiles — what grammatical structure do you need? Subject, verb, object...";
      }
      if (kind === "sequence") {
        return "What comes first logically? Look for time markers or cause-effect relationships.";
      }
      if (kind === "sort") {
        return "Group items by their shared characteristics. What categories make sense?";
      }
      return "Take a moment to think. What do you know about this topic?";
    }
  }
}

/**
 * Generate an explanation for a quiz question (after trying).
 * @param {object} question - Current quiz question.
 * @returns {string} Explanation response.
 */
function generateQuizExplanation(question) {
  const kind = question.kind;
  const answer = question.answer || "";
  const explanation = question.explanation || "";
  const accepted = question.acceptedAnswers || [answer];

  let response = `The correct answer is: **${answer}**.`;

  if (explanation) {
    response += `\n\n${explanation}`;
  } else if (accepted.length > 1) {
    response += `\n\nAccepted answers also include: ${accepted.slice(1).join(", ")}`;
  }

  if (kind === "choice") {
    response += "\n\nWhy? Look at the key words in the question that point to this option.";
  } else if (kind === "typed" || kind === "gap") {
    response += "\n\nCheck your spelling and make sure it matches the expected form.";
  }

  return response;
}

/**
 * Generate vocabulary help response.
 * @param {object} vocabItem - Vocabulary item.
 * @param {string} query - User query.
 * @returns {string} Vocabulary help response.
 */
function generateVocabResponse(vocabItem, query) {
  const de = vocabItem.de || vocabItem.headword || "";
  const en = vocabItem.en || vocabItem.english_equivalent || "";
  const pos = vocabItem.part_of_speech || vocabItem.pos || "";
  const gender = vocabItem.gender || "";
  const exampleDe = vocabItem.exampleDe || "";
  const exampleEn = vocabItem.exampleEn || "";
  const topic = vocabItem.topic || "";

  let response = `**${de}** → *${en}*`;
  if (pos) response += ` (${pos}${gender ? `, ${gender}` : ""})`;
  if (topic) response += `\nTopic: ${topic}`;

  if (exampleDe && exampleEn) {
    response += `\n\nExample: *${exampleDe}* — "${exampleEn}"`;
  } else if (exampleDe) {
    response += `\n\nExample: *${exampleDe}*`;
  }

  response += "\n\nWant to practice this word in a quiz?";
  return response;
}

/**
 * Generate reading comprehension help.
 * @param {object} passage - Current reading passage.
 * @param {object[]} snippets - Retrieved snippets.
 * @param {string} query - User query.
 * @returns {string} Reading help response.
 */
function generateReadingResponse(passage, snippets, query) {
  const sourceTitle = passage?.sourceTitle || passage?.targetTitle || "the passage";
  const sourceText = passage?.sourceText || "";
  const targetText = passage?.targetText || "";

  let response = `For **${sourceTitle}**:\n\n`;

  if (snippets.length) {
    // Quote short evidence only
    const evidence = snippets[0].text.slice(0, 300);
    response += `Evidence from the text:\n> ${evidence}\n\n`;
    response += "Try explaining this in your own words. What does this passage tell you?";
  } else if (sourceText) {
    // No specific match - give general guidance
    response += "I can see the passage but didn't find a specific match for your question. "
      + "Could you point me to a specific paragraph or ask about a particular detail?";
  } else {
    response += "No passage text is currently loaded.";
  }

  return response;
}

/**
 * Generate grammar help response.
 * @param {string} query - User query.
 * @returns {string} Grammar help response.
 */
function generateGrammarResponse(query) {
  const suggestions = [
    "For German grammar, remember the PEE structure: **Point, Evidence, Explanation** when writing.",
    "German cases: Nominative (subject), Accusative (direct object), Dative (indirect object), Genitive (possession).",
    "Verb position: Main clause = verb second. Subordinate clause = verb at end.",
    "Adjective endings depend on case, gender, and article type (strong/weak/mixed).",
  ];

  // Try to match specific grammar topic
  const lower = query.toLowerCase();
  if (lower.includes("case") || lower.includes("kasus")) {
    return "German cases:\n• **Nominative**: Subject (who?)\n• **Accusative**: Direct object (whom?)\n• **Dative**: Indirect object (to whom?)\n• **Genitive**: Possession (whose?)\n\nThe article changes: der/den/dem/des, die/die/der/der, das/das/dem/des.";
  }
  if (lower.includes("tense") || lower.includes("zeit")) {
    return "Common German tenses:\n• **Present** (Präsens): ich mache\n• **Perfect** (Perfekt): ich habe gemacht\n• **Simple Past** (Präteritum): ich machte\n• **Future** (Futur I): ich werde machen";
  }
  if (lower.includes("pee") || lower.includes("point evidence")) {
    return "**PEE Structure** for writing:\n1. **Point** — Make your main claim\n2. **Evidence** — Quote or reference from the text\n3. **Explanation** — Analyze how the evidence supports your point\n\nExample: \"The author shows fear (Point). 'His hands trembled' (Evidence). This verb choice reveals physical panic (Explanation).\"";
  }

  return suggestions.join("\n\n") + "\n\nAsk me about a specific grammar topic!";
}

function formatStudyBookLabel(result) {
  const subject = result.subject ? humanizeLabel(result.subject) : "Study Book";
  const curriculum = result.curriculum ? humanizeLabel(result.curriculum) : "";
  return [subject, curriculum, result.displayName].filter(Boolean).join(" / ");
}

export function buildStudyBookResults(snippets) {
  return snippets
    .filter((snippet) => snippet.source === "studybook" && snippet.metadata)
    .slice(0, 3)
    .map((snippet, index) => ({
      chunkId: snippet.metadata.chunkId,
      packId: snippet.metadata.packId,
      displayName: snippet.metadata.displayName,
      subject: snippet.metadata.subject,
      curriculum: snippet.metadata.curriculum,
      heading: snippet.metadata.heading,
      anchor: snippet.metadata.anchor,
      sourcePath: snippet.metadata.sourcePath,
      packPath: snippet.metadata.packPath,
      snippet: snippet.metadata.snippet || snippet.text,
      score: snippet.score,
      rank: index + 1,
      label: formatStudyBookLabel({
        displayName: snippet.metadata.displayName,
        subject: snippet.metadata.subject,
        curriculum: snippet.metadata.curriculum,
      }),
    }));
}

export function generateStudyBookResponse(results) {
  if (!results.length) return "";
  const strongest = results[0];
  const title = strongest.heading || strongest.displayName || "Study note";
  const response = [
    "Found this in your Study Books:",
    "",
    `**${title}** looks like the strongest match.`,
    "",
    strongest.snippet,
  ];
  if (results.length > 1) {
    response.push("", `I've also listed ${results.length - 1} nearby note${results.length === 2 ? "" : "s"} below so you can open the exact one you want.`);
  } else {
    response.push("", "Use the source card below to jump straight to this study note.");
  }
  return response.join("\n");
}

/**
 * Main tutor response generator.
 * @param {object} params - All context parameters.
 * @param {string} params.query - User query.
 * @param {object|null} params.manifest - Current manifest.
 * @param {object|null} params.dataset - Current dataset.
 * @param {object|null} params.quizSession - Current quiz session.
 * @param {object|null} params.readingPassage - Current reading passage.
 * @param {string|null} params.readingTargetText - Reading passage translation.
 * @param {string|null} params.studyBookHtml - Study book HTML.
 * @param {object|null} params.vocabItems - Current vocab items (if loaded).
 * @param {boolean} params.hintGivenForCurrentQuestion - Whether hint was given.
 * @param {string} params.speechMode - Current speech mode.
 * @param {string} params.speechLang - Language for TTS.
 * @returns {Promise<{type: string, text: string, shouldSpeak: boolean, metadata?: object}>}
 */
export async function generateTutorResponse({
  query,
  manifest = null,
  dataset = null,
  quizSession = null,
  readingPassage = null,
  readingTargetText = null,
  studyBookHtml = null,
  vocabItems = null,
  hintGivenForCurrentQuestion = false,
  speechMode = SpeechMode.TOGGLE,
  semanticSearch = false,
  speechLang = "en-GB",
}) {
  const trimmedQuery = query.trim();

  // Empty query
  if (!trimmedQuery) {
    return { type: ResponseType.HELP, text: "How can I help you? Ask me about the current quiz, reading passage, vocabulary, or study notes.", shouldSpeak: false };
  }

  // Greeting
  if (GREETING_PATTERNS.some(p => p.test(trimmedQuery))) {
    const greetings = [
      "Hello! I'm your FoxChild Tutor. I can help with the current pack, quiz question, reading passage, or study notes.",
      "Hi there! Ready to learn? Ask me about what you're working on right now.",
      "Guten Tag! How can I help with your studies today?",
    ];
    return { type: ResponseType.GREETING, text: greetings[Math.floor(Math.random() * greetings.length)], shouldSpeak: speechMode === SpeechMode.ALWAYS };
  }

  // Help
  if (HELP_PATTERNS.some(p => p.test(trimmedQuery))) {
    return {
      type: ResponseType.HELP,
      text: `I'm your **FoxChild Tutor** — a local study assistant for this Learning Web session.

**What I can help with:**
• **Current quiz question** — hints first, then explanations after you try
• **Vocabulary** — meanings, examples, gender, usage
• **Reading passages** — evidence quotes, comprehension guidance
• **Study Book notes** — search and explain your notes
• **Grammar** — German cases, tenses, PEE writing structure

**What I won't do:**
• Answer unrelated questions (weather, news, general knowledge)
• Give direct quiz answers without you trying first
• Send your data anywhere — everything runs locally in your browser

**Settings:**
• Click the 🔊 button to hear responses aloud
• Toggle "Read aloud" in the panel header

What are you working on right now?`,
      shouldSpeak: false,
    };
  }

  // Retrieve relevant content
  const retrieval = await retrieveContent({
    manifest,
    dataset,
    quizSession,
    readingPassage,
    readingTargetText,
    studyBookHtml,
    query: trimmedQuery,
    semanticSearch,
  });

  // If no relevant content found
  if (!retrieval.hasContent) {
    // Genuinely off-topic query (weather, sports, etc.)
    if (OFF_TOPIC_PATTERNS.some(p => p.test(trimmedQuery))) {
      return {
        type: ResponseType.REFUSAL,
        text: "I'm a study assistant — I can only help with your learning materials. Try asking about something from your study books or current pack.",
        shouldSpeak: false,
      };
    }
    // No match found in any loaded content — offer helpful fallback
    return {
      type: ResponseType.REFUSAL,
      text: `I couldn't find "${trimmedQuery}" in your study books yet. Try asking about something from your current pack or study notes.`,
      shouldSpeak: false,
    };
  }

  // Check for quiz question context
  if (quizSession?.questions?.length > 0 && quizSession.index < quizSession.questions.length) {
    const currentQuestion = quizSession.questions[quizSession.index];

    // Classify the learner's intent in quiz context
    const intent = classifyTutorQuizIntent(trimmedQuery, currentQuestion);

    // If query is off-topic or a studybook search, skip quiz handling and fall through
    if (intent === "studybook_search" || intent === "off_topic") {
      // Fall through to other content handlers below
    } else {
      // User wants explanation after hint (existing behavior, integrated)
      if (wantsExplanation(trimmedQuery, hintGivenForCurrentQuestion)) {
        return {
          type: ResponseType.EXPLANATION,
          text: generateQuizExplanation(currentQuestion),
          shouldSpeak: speechMode === SpeechMode.ALWAYS,
          metadata: { questionId: currentQuestion.id },
        };
      }

      // Check if query is about the current quiz question
      const quizSnippets = retrieval.snippets.filter(s => s.source === "quiz");
      if (quizSnippets.length > 0 || retrieval.sources.includes("quiz")) {
        // Track hint count per question for progressive hint levels
        let hintCount = hintCountMap.get(currentQuestion.id) || 0;
        const isProgressiveIntent = intent === "hint" || intent === "answer_request";
        if (isProgressiveIntent) {
          hintCount++;
          hintCountMap.set(currentQuestion.id, hintCount);
        }

        return {
          type: ResponseType.HINT,
          text: generateQuizHint(currentQuestion, trimmedQuery, intent, hintCount),
          shouldSpeak: speechMode === SpeechMode.ALWAYS,
          metadata: { questionId: currentQuestion.id, hintGiven: true },
        };
      }
    }
  }

  // Vocabulary help
  if (VOCAB_PATTERNS.some(p => p.test(trimmedQuery)) && vocabItems?.length) {
    for (const vocab of vocabItems) {
      const hint = getVocabHint(vocab, retrieval.snippets.flatMap(s => s.text.split(" ")));
      if (hint) {
        return {
          type: ResponseType.VOCABULARY,
          text: generateVocabResponse(vocab, trimmedQuery),
          shouldSpeak: speechMode === SpeechMode.ALWAYS,
          metadata: { wordId: vocab.id },
        };
      }
    }
    // Fallback: check snippets for vocab-like content
    const vocabSnippets = retrieval.snippets.filter(s => s.score > 0.2);
    if (vocabSnippets.length) {
      // Try to extract a word from the snippet
      return {
        type: ResponseType.VOCABULARY,
        text: "I found some relevant vocabulary in your current pack. Could you ask about a specific word?",
        shouldSpeak: false,
      };
    }
  }

  // Reading comprehension help
  if (READING_PATTERNS.some(p => p.test(trimmedQuery)) || retrieval.sources.includes("reading")) {
    return {
      type: ResponseType.READING,
      text: generateReadingResponse(readingPassage, retrieval.snippets.filter(s => s.source.startsWith("reading")), trimmedQuery),
      shouldSpeak: speechMode === SpeechMode.ALWAYS,
      metadata: { passageId: readingPassage?.id },
    };
  }

  // Grammar help
  if (GRAMMAR_PATTERNS.some(p => p.test(trimmedQuery))) {
    return {
      type: ResponseType.GRAMMAR,
      text: generateGrammarResponse(trimmedQuery),
      shouldSpeak: speechMode === SpeechMode.ALWAYS,
    };
  }

  // General content-based response using retrieved snippets
  if (retrieval.snippets.length) {
    const studyBookResults = buildStudyBookResults(retrieval.snippets);
    if (studyBookResults.length) {
      return {
        type: ResponseType.STUDYBOOK,
        text: generateStudyBookResponse(studyBookResults),
        shouldSpeak: speechMode === SpeechMode.ALWAYS,
        metadata: {
          source: "studybook",
          sources: retrieval.sources,
          studybook: studyBookResults[0],
          studybookResults: studyBookResults,
        },
      };
    }

    const topSnippet = retrieval.snippets[0];
    let response = `Based on your **${topSnippet.sourceLabel}**:\n\n> ${topSnippet.text.slice(0, 400)}`;

    if (retrieval.snippets.length > 1) {
      response += `\n\nAlso relevant: ${retrieval.snippets.slice(1, 3).map(s => `"${s.text.slice(0, 100)}..."`).join(", ")}`;
    }

    response += "\n\nWould you like a hint, explanation, or help with something specific?";
    const meta = { sources: retrieval.sources };
    // Pass studybook metadata for evidence UI if top snippet is from studybook
    if (topSnippet.source === "studybook" && topSnippet.metadata) {
      meta.studybook = topSnippet.metadata;
    }
    return {
      type: ResponseType.EXPLANATION,
      text: response,
      shouldSpeak: speechMode === SpeechMode.ALWAYS,
      metadata: meta,
    };
  }

  // Fallback
  return {
    type: ResponseType.REFUSAL,
    text: `I couldn't find "${trimmedQuery}" in your study books yet. Try asking about something from your current pack or study notes.`,
    shouldSpeak: false,
  };
}

/**
 * Speak a tutor response if needed.
 * @param {string} text - Response text.
 * @param {string} lang - Language code.
 * @param {boolean} shouldSpeak - Whether to speak.
 * @returns {Promise<void>}
 */
export async function maybeSpeakResponse(text, lang, shouldSpeak) {
  if (shouldSpeak) {
    await speakWithPreferredVoice(text, lang);
  }
}
