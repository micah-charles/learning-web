import { useState, useEffect, useCallback, useRef } from "react";
import { startListening, stopListening, isSpeechRecognitionSupported } from "../services/speechRecognitionService.js";
import { normalizeForCompare } from "@/utils.js";

const COMMON_EN_WORDS = new Set([
  "the","a","an","is","are","was","were","be","been","being","have","has","had",
  "do","does","did","will","would","could","should","may","might","shall","can",
  "need","dare","ought","to","of","in","for","on","with","at","by","from","as",
  "into","through","during","before","after","above","below","between","out","off",
  "over","under","again","further","then","once","here","there","when","where",
  "why","how","all","each","every","both","few","more","most","other","some",
  "such","no","nor","not","only","own","same","so","than","too","very","just",
  "because","but","and","or","if","while","that","this","these","those","it",
  "its","they","them","their","we","us","our","you","your","he","him","his",
  "she","her","what","which","who","whom","about","up","down","like","also",
]);

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = a[j - 1] === b[i - 1]
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function tokenSimilarity(expected, recognized) {
  const eTokens = expected.split(/\s+/);
  const rTokens = recognized.split(/\s+/);
  if (!eTokens.length) return 0;
  let matched = 0;
  for (const rt of rTokens) {
    if (eTokens.some(et => et === rt || levenshteinDistance(et, rt) <= 1)) {
      matched++;
    }
  }
  return matched / Math.max(eTokens.length, rTokens.length);
}

function estimateAccuracyPercent(expected, recognized, confidence = 0) {
  const e = normalizeSentence(expected);
  const r = normalizeSentence(recognized);
  if (!e || !r) return Math.round(Math.max(0, confidence) * 100);
  if (e === r) return 100;
  const charBase = Math.max(e.length, r.length, 1);
  const charSimilarity = Math.max(0, 1 - (levenshteinDistance(e, r) / charBase));
  const tokenScore = tokenSimilarity(e, r);
  const blended = Math.max(tokenScore, charSimilarity, confidence || 0);
  return Math.max(0, Math.min(100, Math.round(blended * 100)));
}

function normalizeSentence(text) {
  return normalizeForCompare(text || "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isLikelyWrongLanguage(transcript, targetLang, expected) {
  if (targetLang === "en" || targetLang.startsWith("en")) return false;
  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const enCount = words.filter(w => COMMON_EN_WORDS.has(w)).length;
  const enRatio = enCount / words.length;
  const normalizedTranscript = normalizeSentence(transcript);
  const normalizedExpected = normalizeSentence(expected);
  const sim = tokenSimilarity(normalizedExpected, normalizedTranscript);
  return enRatio > 0.35 && sim < 0.3;
}

const UNLIMITED_ATTEMPTS = Number.POSITIVE_INFINITY;
const CONFIDENCE_PASS = 0.75;
const CONFIDENCE_UNCLEAR = 0.40;

const PHASES = {
  IDLE: "idle",
  LISTENING: "listening",
  PROCESSING: "processing",
  CORRECT: "correct",
  INCORRECT: "incorrect",
  UNCLEAR: "unclear",
  WRONG_LANGUAGE: "wrong-language",
};

const SPEECH_STATE = {
  idle: "idle",
  listening: "listening",
  processing: "processing",
  success: "success",
  error: "error",
  unsupported: "unsupported",
};

function reachedAttemptLimit(attempt, maxAttempts) {
  return Number.isFinite(maxAttempts) && attempt >= maxAttempts;
}

export function useVoicePractice({ languageCode, onResult, onError, maxAttempts = UNLIMITED_ATTEMPTS } = {}) {
  const [phase, setPhase] = useState(PHASES.IDLE);
  const [attempt, setAttempt] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [buttonState, setButtonState] = useState(
    isSpeechRecognitionSupported() ? SPEECH_STATE.idle : SPEECH_STATE.unsupported
  );

  const attemptRef = useRef(0);
  const targetRef = useRef("");
  const languageRef = useRef(languageCode || "en");

  useEffect(() => () => stopListening(), []);

  const reset = useCallback(() => {
    stopListening();
    setPhase(PHASES.IDLE);
    setAttempt(0);
    setLastResult(null);
    setButtonState(isSpeechRecognitionSupported() ? SPEECH_STATE.idle : SPEECH_STATE.unsupported);
    attemptRef.current = 0;
  }, []);

  const handleUnclear = useCallback(() => {
    setPhase(PHASES.UNCLEAR);
    setButtonState(SPEECH_STATE.error);
  }, []);

  const handleMispronunciation = useCallback(() => {
    setPhase(PHASES.INCORRECT);
    setButtonState(SPEECH_STATE.error);
  }, []);

  const handleCorrect = useCallback((transcript, confidence, status) => {
    const accuracy = estimateAccuracyPercent(targetRef.current, transcript, confidence);
    setPhase(PHASES.CORRECT);
    setButtonState(SPEECH_STATE.success);
    setLastResult({ transcript, confidence, status, expected: targetRef.current, accuracy });
    if (onResult) onResult(transcript, confidence, status, { accuracy });
  }, [onResult]);

  const startPractice = useCallback((targetText, lang) => {
    if (!isSpeechRecognitionSupported()) {
      setButtonState(SPEECH_STATE.unsupported);
      return;
    }
    const langCode = lang || languageRef.current;
    languageRef.current = langCode;
    targetRef.current = normalizeSentence(targetText || "");
    attemptRef.current = 0;
    setAttempt(0);
    setLastResult(null);
    setPhase(PHASES.LISTENING);
    setButtonState(SPEECH_STATE.listening);

    startListening(
      langCode,
      (transcript, confidence) => {
        const normalized = normalizeSentence(transcript);
        const target = targetRef.current;

        if (confidence < CONFIDENCE_UNCLEAR) {
          attemptRef.current += 1;
          setAttempt(attemptRef.current);
          if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
            setPhase(PHASES.INCORRECT);
            setLastResult({
              transcript,
              confidence,
              status: "max-attempts",
              expected: targetText,
              accuracy: estimateAccuracyPercent(targetText, transcript, confidence),
            });
            setButtonState(SPEECH_STATE.error);
            if (onError) onError("max-attempts");
          } else {
            handleUnclear();
          }
          return;
        }

        if (confidence >= CONFIDENCE_PASS) {
          if (normalized === target || levenshteinDistance(normalized, target) <= 2) {
            handleCorrect(transcript, confidence, "exact");
            return;
          }
        }

        const sim = tokenSimilarity(target, normalized);
        if (sim >= 0.85 || (confidence >= CONFIDENCE_PASS && normalized === target)) {
          handleCorrect(transcript, confidence, "similar");
          return;
        }

        if (isLikelyWrongLanguage(transcript, langCode, targetText)) {
          attemptRef.current += 1;
          setAttempt(attemptRef.current);
          setPhase(PHASES.WRONG_LANGUAGE);
          setLastResult({
            transcript,
            confidence,
            status: "wrong-language",
            expected: targetText,
            attempt: attemptRef.current,
            accuracy: estimateAccuracyPercent(targetText, transcript, confidence),
          });
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("wrong-language");
          return;
        }

        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
          setPhase(PHASES.INCORRECT);
          setLastResult({
            transcript,
            confidence,
            status: "max-attempts",
            expected: targetText,
            accuracy: estimateAccuracyPercent(targetText, transcript, confidence),
          });
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("max-attempts");
        } else {
          handleMispronunciation();
          setLastResult({
            transcript,
            confidence,
            expected: targetText,
            attempt: attemptRef.current,
            accuracy: estimateAccuracyPercent(targetText, transcript, confidence),
          });
        }
      },
      (error) => {
        if (error === "not-supported") {
          setButtonState(SPEECH_STATE.unsupported);
          return;
        }
        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
          setPhase(PHASES.INCORRECT);
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("max-attempts");
        } else {
          handleUnclear();
        }
      }
    );
  }, [maxAttempts, handleCorrect, handleUnclear, handleMispronunciation, onError]);

  const retry = useCallback(() => {
    const lang = languageRef.current;
    const target = targetRef.current;
    if (!target) return;
    setPhase(PHASES.LISTENING);
    setButtonState(SPEECH_STATE.listening);

    startListening(
      lang,
      (transcript, confidence) => {
        const normalized = normalizeSentence(transcript);

        if (confidence < CONFIDENCE_UNCLEAR) {
          attemptRef.current += 1;
          setAttempt(attemptRef.current);
          if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
            setPhase(PHASES.INCORRECT);
            setLastResult({
              transcript,
              confidence,
              status: "max-attempts",
              expected: target,
              accuracy: estimateAccuracyPercent(target, transcript, confidence),
            });
            setButtonState(SPEECH_STATE.error);
            if (onError) onError("max-attempts");
          } else {
            handleUnclear();
          }
          return;
        }

        if (normalized === target || levenshteinDistance(normalized, target) <= 2) {
          handleCorrect(transcript, confidence, "exact");
          return;
        }

        const sim = tokenSimilarity(target, normalized);
        if (sim >= 0.85 || (confidence >= CONFIDENCE_PASS && normalized === target)) {
          handleCorrect(transcript, confidence, "similar");
          return;
        }

        if (isLikelyWrongLanguage(transcript, lang, target)) {
          attemptRef.current += 1;
          setAttempt(attemptRef.current);
          setPhase(PHASES.WRONG_LANGUAGE);
          setLastResult({
            transcript,
            confidence,
            status: "wrong-language",
            expected: target,
            attempt: attemptRef.current,
            accuracy: estimateAccuracyPercent(target, transcript, confidence),
          });
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("wrong-language");
          return;
        }

        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
          setPhase(PHASES.INCORRECT);
          setLastResult({
            transcript,
            confidence,
            status: "max-attempts",
            expected: target,
            accuracy: estimateAccuracyPercent(target, transcript, confidence),
          });
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("max-attempts");
        } else {
          handleMispronunciation();
          setLastResult({
            transcript,
            confidence,
            expected: target,
            attempt: attemptRef.current,
            accuracy: estimateAccuracyPercent(target, transcript, confidence),
          });
        }
      },
      (error) => {
        if (error === "not-supported") {
          setButtonState(SPEECH_STATE.unsupported);
          return;
        }
        attemptRef.current += 1;
        setAttempt(attemptRef.current);
        if (reachedAttemptLimit(attemptRef.current, maxAttempts)) {
          setPhase(PHASES.INCORRECT);
          setButtonState(SPEECH_STATE.error);
          if (onError) onError("max-attempts");
        } else {
          handleUnclear();
        }
      }
    );
  }, [maxAttempts, handleCorrect, handleUnclear, handleMispronunciation, onError]);

  const cancel = useCallback(() => {
    stopListening();
    reset();
  }, [reset]);

  return {
    phase,
    attempt,
    lastResult,
    buttonState,
    isSupported: isSpeechRecognitionSupported(),
    startPractice,
    retry,
    cancel,
    reset,
  };
}
