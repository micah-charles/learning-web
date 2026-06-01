/**
 * useSmartTestSession.js
 *
 * Session builder and state machine for Smart Test / Integrated Practice mode.
 *
 * Builds a mixed test from an existing pack:
 *   - MCQ section      — 5 multiple-choice questions from vocab items
 *   - Builder section  — 3 sentence-builder questions (arrange tiles into the
 *                        model answer). Uses sentenceBuilder items if present;
 *                        falls back to Flashcard self-assessment otherwise.
 *   - Reading section  — passage items if the pack has them
 *   - Argument section — FOR / AGAINST scaffold items (sourceWord starts with "FOR:" etc.)
 *
 * Architecture notes (matching Learning Web patterns):
 *   - Session state mirrored in sessionRef so side effects fire outside setState (RC9)
 *   - No direct localStorage access — progress via updateProgress only (RC14)
 *   - No side effects inside setState updater functions (RC9)
 */

import { useState, useCallback, useRef } from "react";
import { loadVocabItems, loadUnifiedPack } from "@/data.js";
import { shuffle } from "@/utils.js";
import { recordWordAnswer } from "@/storage.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MCQ_COUNT      = 5;
const BUILDER_COUNT  = 3;
const FLASHCARD_COUNT = 3;
const MIN_DEF_LENGTH  = 40;   // targetWord must be this long to be a flashcard candidate

// sourceWord prefixes that identify argument/essay scaffold items
const ARGUMENT_PREFIXES = [
  "for:",
  "against:",
  "argument for:",
  "argument against:",
];

// ─── Seeded shuffle (deterministic per sessionId) ─────────────────────────────

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function strToSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Item classifiers ─────────────────────────────────────────────────────────

function isArgumentItem(word) {
  const sw = (word.de || word.sourceWord || "").toLowerCase().trim();
  return ARGUMENT_PREFIXES.some(p => sw.startsWith(p));
}

function isFlashcardCandidate(word) {
  if (isArgumentItem(word)) return false;
  const def = word.en || word.targetWord || "";
  return def.length >= MIN_DEF_LENGTH;
}

function stripArgumentPrefix(sourceWord) {
  const sw = sourceWord.toLowerCase().trim();
  for (const p of ARGUMENT_PREFIXES) {
    if (sw.startsWith(p)) return sourceWord.slice(p.length).trim();
  }
  return sourceWord;
}

function getArgumentSide(sourceWord) {
  const sw = (sourceWord || "").toLowerCase().trim();
  if (sw.startsWith("for:") || sw.startsWith("argument for:")) return "for";
  if (sw.startsWith("against:") || sw.startsWith("argument against:")) return "against";
  return "neutral";
}

// ─── MCQ builder ──────────────────────────────────────────────────────────────

function buildMcqOptions(correctWord, allWords, rng) {
  const correctDef = (correctWord.en || correctWord.targetWord || "").trim();
  const term       = (correctWord.de || correctWord.sourceWord || "").trim();

  // Distractors: other items' definitions, not the correct one
  const distractorPool = allWords
    .filter(w => {
      const d = (w.en || w.targetWord || "").trim();
      return d && d !== correctDef && d.length > 10;
    })
    .map(w => (w.en || w.targetWord || "").trim());

  const shuffledDistractors = seededShuffle(distractorPool, rng).slice(0, 3);

  // If we don't have 3 distractors, pad with generic ones
  while (shuffledDistractors.length < 3) {
    shuffledDistractors.push(`Not a definition of "${term}"`);
  }

  const opts = [
    { text: correctDef, correct: true },
    ...shuffledDistractors.map(d => ({ text: d, correct: false })),
  ];

  const shuffled = seededShuffle(opts, rng);
  return shuffled.map((o, i) => ({ ...o, letter: String.fromCharCode(65 + i) }));
}

// ─── Session builder ──────────────────────────────────────────────────────────

function normalizeAnswer(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[.,;:!?'"’“”()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSession(words, passages, builderItems, datasetId, sessionId) {
  const rng = seededRng(strToSeed(sessionId));

  // Classify words
  const argItems       = words.filter(isArgumentItem);
  const flashCandidates = words.filter(isFlashcardCandidate);
  const mcqCandidates  = words.filter(w => !isArgumentItem(w) && (w.en || w.targetWord));

  const sections = [];

  // ── Section: MCQ ───────────────────────────────────────────────────────────
  const mcqPool = seededShuffle(mcqCandidates, rng).slice(0, MCQ_COUNT);
  if (mcqPool.length > 0) {
    const questions = mcqPool.map(word => ({
      id: word.id || word.de || word.sourceWord,
      term: (word.de || word.sourceWord || "").trim(),
      definition: (word.en || word.targetWord || "").trim(),
      options: buildMcqOptions(word, mcqCandidates, rng),
      word,
    }));
    sections.push({
      id: "mcq",
      type: "mcq",
      title: "Knowledge Check",
      icon: "✓",
      description: "Choose the correct answer for each term.",
      questions,
      // per-question answers: { [questionId]: { selected, correct } }
      answers: {},
      currentIndex: 0,
      done: false,
    });
  }

  // ── Section: Sentence Builder ────────────────────────────────────────────────
  // Real sentence-builder section: arrange shuffled tiles into the model answer.
  const builderPool = seededShuffle(builderItems || [], rng).slice(0, BUILDER_COUNT);
  if (builderPool.length > 0) {
    const questions = builderPool.map(item => {
      const data = item.data || {};
      const answer = (data.answer || "").trim();
      const tiles  = Array.isArray(data.tiles) && data.tiles.length
        ? data.tiles
        : answer.split(/\s+/);
      return {
        id: item.id,
        prompt: (data.prompt || "Arrange the words into a correct sentence.").trim(),
        answer,
        tiles,                                   // canonical order
        shuffledTiles: seededShuffle(tiles, rng),// presented order
        topic: Array.isArray(item.topics) ? (item.topics[0] || "") : "",
      };
    });
    sections.push({
      id: "builder",
      type: "builder",
      title: "Sentence Builder",
      icon: "🧩",
      description: "Tap the words in order to build the model answer.",
      questions,
      // per-question: { [qid]: { built: [...], correct: bool } }
      answers: {},
      currentIndex: 0,
      done: false,
    });
  } else {
    // Fallback: Flashcard self-assessment when the pack has no sentenceBuilder items
    const flashPool = seededShuffle(flashCandidates, rng).slice(0, FLASHCARD_COUNT);
    if (flashPool.length > 0) {
      const cards = flashPool.map(word => ({
        id: word.id || word.de || word.sourceWord,
        term: (word.de || word.sourceWord || "").trim(),
        definition: (word.en || word.targetWord || "").trim(),
        topic: word.topic || "",
        word,
      }));
      sections.push({
        id: "flashcard",
        type: "flashcard",
        title: "Key Concepts",
        icon: "💡",
        description: "Read each concept and mark whether you know it.",
        cards,
        answers: {},
        currentIndex: 0,
        done: false,
      });
    }
  }

  // ── Section: Reading passage ─────────────────────────────────────────────
  if (passages && passages.length > 0) {
    const picked = seededShuffle(passages, rng)[0];
    sections.push({
      id: "reading",
      type: "reading",
      title: "Reading",
      icon: "📖",
      description: "Read the passage carefully.",
      passage: picked,
      revealed: false,
      done: false,
    });
  }

  // ── Section: Argument scaffold ───────────────────────────────────────────
  if (argItems.length > 0) {
    const forItems     = argItems.filter(w => getArgumentSide(w.de || w.sourceWord) === "for");
    const againstItems = argItems.filter(w => getArgumentSide(w.de || w.sourceWord) === "against");
    const neutralItems = argItems.filter(w => getArgumentSide(w.de || w.sourceWord) === "neutral");

    // Get the question/statement this is evaluating — try to infer from context
    const statement = detectStatement(words, argItems);

    const scaffoldItems = [
      ...seededShuffle(forItems, rng).slice(0, 3),
      ...seededShuffle(againstItems, rng).slice(0, 3),
      ...neutralItems.slice(0, 2),
    ].map(w => ({
      id: w.id || w.de || w.sourceWord,
      side: getArgumentSide(w.de || w.sourceWord),
      claim: stripArgumentPrefix(w.de || w.sourceWord || ""),
      detail: (w.en || w.targetWord || "").trim(),
      word: w,
    }));

    if (scaffoldItems.length > 0) {
      sections.push({
        id: "argument",
        type: "argument",
        title: "Evaluation Practice",
        icon: "⚖️",
        description: "Use these points to construct a balanced argument.",
        statement,
        items: scaffoldItems,
        forItems:     scaffoldItems.filter(i => i.side === "for"),
        againstItems: scaffoldItems.filter(i => i.side === "against"),
        neutralItems: scaffoldItems.filter(i => i.side === "neutral"),
        done: false,
      });
    }
  }

  return {
    sessionId,
    datasetId,
    sections,
    currentSectionIndex: 0,
    phase: "running",   // "running" | "section_complete" | "done"
    createdAt: Date.now(),
  };
}

/** Try to infer the evaluate-statement topic from non-argument items */
function detectStatement(allWords, argItems) {
  // If any vocab item topic looks like a statement, use it
  for (const w of allWords) {
    const def = (w.en || w.targetWord || "").trim();
    if (def.startsWith("'") && def.endsWith("'")) return def;
  }
  // Fallback: derive from first argument item's detail
  if (argItems.length > 0) {
    const detail = (argItems[0].en || argItems[0].targetWord || "").trim();
    if (detail.length > 20) return `"${detail.slice(0, 80)}…"`;
  }
  return "";
}

// ─── Score calculator ─────────────────────────────────────────────────────────

export function calcScore(session) {
  if (!session) return null;

  const result = {
    sections: {},
    totalCorrect: 0,
    totalQuestions: 0,
    weakItems: [],
  };

  for (const sec of session.sections) {
    if (sec.type === "mcq") {
      const qs = sec.questions;
      const correct = qs.filter(q => sec.answers[q.id]?.correct).length;
      result.sections.mcq = { correct, total: qs.length };
      result.totalCorrect   += correct;
      result.totalQuestions += qs.length;
      // Weak items: unanswered or wrong
      qs.forEach(q => {
        if (!sec.answers[q.id]?.correct) result.weakItems.push(q.word);
      });
    }
    if (sec.type === "builder") {
      const qs = sec.questions;
      const correct = qs.filter(q => sec.answers[q.id]?.correct).length;
      result.sections.builder = { correct, total: qs.length };
      result.totalCorrect   += correct;
      result.totalQuestions += qs.length;
      qs.forEach(q => {
        if (!sec.answers[q.id]?.correct) {
          // Represent a builder question as a weak item with term/definition shape
          result.weakItems.push({ de: q.prompt, en: q.answer });
        }
      });
    }
    if (sec.type === "flashcard") {
      const cards = sec.cards;
      const known = cards.filter(c => sec.answers[c.id] === "known").length;
      result.sections.flashcard = { known, total: cards.length };
      result.totalCorrect   += known;
      result.totalQuestions += cards.length;
      cards.forEach(c => {
        if (sec.answers[c.id] !== "known") result.weakItems.push(c.word);
      });
    }
    if (sec.type === "reading") {
      result.sections.reading = { done: sec.done };
    }
    if (sec.type === "argument") {
      result.sections.argument = { done: sec.done, total: sec.items.length };
    }
  }

  result.pct = result.totalQuestions > 0
    ? Math.round((result.totalCorrect / result.totalQuestions) * 100)
    : 0;

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSmartTestSession() {
  const [session, setSession]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  // Mirror ref — safe for callbacks/side-effects (RC9)
  const sessionRef = useRef(null);

  function _set(newSession) {
    sessionRef.current = newSession;
    setSession(newSession);
  }

  // ── Build session ──────────────────────────────────────────────────────────

  const startSession = useCallback(async ({ manifest, dataset }) => {
    setLoading(true);
    setError(null);
    try {
      const words = await loadVocabItems(manifest, dataset.id).catch(() => []);

      // Load passage + sentenceBuilder items from the unified pack
      let passages = [];
      let builderItems = [];
      try {
        const pack = await loadUnifiedPack(manifest, dataset.id);
        if (pack?.items) {
          passages = pack.items
            .filter(item => item.type === "passage")
            .map(item => ({
              id: item.id,
              title: item.data?.sourceTitle || item.data?.title || "Passage",
              text: item.data?.sourcePassage || item.data?.text || "",
              targetText: item.data?.targetPassage || "",
              questions: item.data?.questions || [],
            }))
            .filter(p => p.text.length > 50);

          builderItems = pack.items.filter(item => item.type === "sentenceBuilder");
        }
      } catch { /* pack has no extra item types */ }

      if (words.length === 0) {
        setError("No vocab items found in this pack.");
        return;
      }

      const sessionId = `st-${dataset.id}-${Date.now()}`;
      const newSession = buildSession(words, passages, builderItems, dataset.id, sessionId);
      _set(newSession);
    } catch (err) {
      setError(err.message || "Failed to build Smart Test session.");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Answer MCQ ────────────────────────────────────────────────────────────

  const answerMcq = useCallback((questionId, selectedLetter, updateProgress) => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section || section.type !== "mcq") return;

    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;
    const correct = question.options.find(o => o.letter === selectedLetter)?.correct ?? false;

    const newSection = {
      ...section,
      answers: {
        ...section.answers,
        [questionId]: { selected: selectedLetter, correct },
      },
    };

    const newSections = prev.sections.map((s, i) => i === sectionIdx ? newSection : s);
    const newSession  = { ...prev, sections: newSections };
    _set(newSession);

    // Side effect outside setState — RC9 safe
    if (updateProgress && question.word) {
      updateProgress(state => {
        recordWordAnswer(state, question.word, correct);
      });
    }
  }, []);

  // ── Next MCQ question ─────────────────────────────────────────────────────

  const nextMcqQuestion = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section || section.type !== "mcq") return;

    const nextIndex = section.currentIndex + 1;
    const isDone    = nextIndex >= section.questions.length;

    const newSection  = { ...section, currentIndex: Math.min(nextIndex, section.questions.length - 1), done: isDone };
    const newSections = prev.sections.map((s, i) => i === sectionIdx ? newSection : s);
    const newSession  = { ...prev, sections: newSections };
    _set(newSession);
  }, []);

  // ── Submit sentence-builder answer ─────────────────────────────────────────

  const submitBuilder = useCallback((questionId, builtTiles) => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section || section.type !== "builder") return;

    const question = section.questions.find(q => q.id === questionId);
    if (!question) return;

    const builtStr = builtTiles.join(" ");
    const correct  = normalizeAnswer(builtStr) === normalizeAnswer(question.answer);

    const newSection = {
      ...section,
      answers: {
        ...section.answers,
        [questionId]: { built: builtTiles, correct },
      },
    };
    const newSections = prev.sections.map((s, i) => i === sectionIdx ? newSection : s);
    _set({ ...prev, sections: newSections });
  }, []);

  const nextBuilderQuestion = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section || section.type !== "builder") return;

    const nextIndex = section.currentIndex + 1;
    const isDone    = nextIndex >= section.questions.length;
    const newSection = {
      ...section,
      currentIndex: Math.min(nextIndex, section.questions.length - 1),
      done: isDone,
    };
    const newSections = prev.sections.map((s, i) => i === sectionIdx ? newSection : s);
    _set({ ...prev, sections: newSections });
  }, []);

  // ── Self-assess flashcard ─────────────────────────────────────────────────

  const assessFlashcard = useCallback((cardId, assessment, updateProgress) => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section || section.type !== "flashcard") return;

    const card = section.cards.find(c => c.id === cardId);
    if (!card) return;

    const nextIndex = section.currentIndex + 1;
    const isDone    = nextIndex >= section.cards.length;

    const newSection = {
      ...section,
      answers: { ...section.answers, [cardId]: assessment },
      currentIndex: Math.min(nextIndex, section.cards.length - 1),
      done: isDone,
    };
    const newSections = prev.sections.map((s, i) => i === sectionIdx ? newSection : s);
    const newSession  = { ...prev, sections: newSections };
    _set(newSession);

    // Record for mastery tracking — RC9 safe (outside setState)
    if (updateProgress && card.word) {
      updateProgress(state => {
        recordWordAnswer(state, card.word, assessment === "known");
      });
    }
  }, []);

  // ── Complete reading / argument section ───────────────────────────────────

  const completeSection = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    const sectionIdx = prev.currentSectionIndex;
    const section    = prev.sections[sectionIdx];
    if (!section) return;

    const newSections = prev.sections.map((s, i) =>
      i === sectionIdx ? { ...s, done: true } : s,
    );
    const newSession  = { ...prev, sections: newSections };
    _set(newSession);
  }, []);

  // ── Advance to next section ───────────────────────────────────────────────

  const nextSection = useCallback(() => {
    const prev = sessionRef.current;
    if (!prev) return;
    const next = prev.currentSectionIndex + 1;
    if (next >= prev.sections.length) {
      _set({ ...prev, phase: "done" });
    } else {
      _set({ ...prev, currentSectionIndex: next });
    }
  }, []);

  // ── Reset ─────────────────────────────────────────────────────────────────

  const resetSession = useCallback(() => {
    _set(null);
  }, []);

  // ── Computed helpers ──────────────────────────────────────────────────────

  const currentSection = session?.sections[session.currentSectionIndex] ?? null;
  const totalSections  = session?.sections.length ?? 0;
  const sectionNumber  = (session?.currentSectionIndex ?? 0) + 1;

  // Overall progress: count answered questions across all sections
  let answered = 0, total = 0;
  if (session) {
    for (const s of session.sections) {
      if (s.type === "mcq" || s.type === "builder") {
        total    += s.questions.length;
        answered += Object.keys(s.answers).length;
      }
      if (s.type === "flashcard") {
        total    += s.cards.length;
        answered += Object.keys(s.answers).length;
      }
    }
  }

  return {
    session,
    loading,
    error,
    currentSection,
    sectionNumber,
    totalSections,
    answered,
    total,
    // actions
    startSession,
    answerMcq,
    nextMcqQuestion,
    submitBuilder,
    nextBuilderQuestion,
    assessFlashcard,
    completeSection,
    nextSection,
    resetSession,
    calcScore: () => calcScore(session),
  };
}
