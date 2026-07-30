import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appendInputKey } from "../domain/code-normalisation.js";
import { evaluateAnswer, shouldAutoSubmitAnswer } from "../domain/answer-evaluator.js";
import { generateSessionPlan } from "../domain/question-generator.js";
import { findChineseInputCharacter } from "../dataset.js";
import usePhysicalKeyboard from "../hooks/usePhysicalKeyboard.js";
import VirtualCangjieKeyboard from "./VirtualCangjieKeyboard.jsx";
import CharacterDecomposition from "./CharacterDecomposition.jsx";
import PronunciationButton from "./PronunciationButton.jsx";

function feedbackCopy(result, character, question) {
  if (result.correct) {
    if (question.type === "root-recognition") {
      return `Correct: ${question.rootLabel} is mapped to ${question.rootKey}.`;
    }
    return `Correct: ${character.char} = ${question.expectedKeys.join(" ")}.`;
  }
  if (question.type === "root-recognition") {
    return `That key is not mapped to ${question.rootLabel}. The correct key is ${question.rootKey}.`;
  }
  if (result.errorType === "wrong-order") {
    return `Almost: those keys are in the wrong order. Check position ${result.firstWrongPosition + 1}.`;
  }
  if (result.errorType === "missing-key") {
    return `Almost: the code needs another key after position ${result.normalisedInput.length}.`;
  }
  if (result.errorType === "extra-key") {
    return "There is one key too many. Compare the code length and try it in review.";
  }
  if (result.firstWrongPosition >= 0) {
    return `Check key ${result.firstWrongPosition + 1}. The order matters.`;
  }
  return "That code is not accepted for this method. Review the highlighted sequence.";
}

export default function LessonPlayer({
  dataset,
  lesson,
  method,
  pronounce,
  autoPronounce = true,
  onExit,
  recordAttempt,
  completeSession,
}) {
  const seedRef = useRef(Math.floor(Date.now() / 1000));
  const plan = useMemo(() => generateSessionPlan({
    dataset,
    lesson,
    method,
    seed: seedRef.current,
    questionCount: Math.max(lesson.passCriteria.minimumQuestions, 10),
    createdAt: new Date().toISOString(),
  }), [dataset, lesson, method]);
  const [index, setIndex] = useState(0);
  const [buffer, setBuffer] = useState("");
  const [pressedKey, setPressedKey] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [hintEnabled, setHintEnabled] = useState(false);
  const [hintUsedCurrent, setHintUsedCurrent] = useState(false);
  const [attemptedCurrent, setAttemptedCurrent] = useState(false);
  const [stats, setStats] = useState({ correct: 0, answered: 0, hints: 0 });
  const [summary, setSummary] = useState(null);
  const question = plan.questions[index];
  const character = findChineseInputCharacter(dataset, question?.characterId);
  const isRootRecognition = question?.type === "root-recognition";
  const spokenText = isRootRecognition ? question.rootLabel : character?.char;
  const expectedKey = question?.expectedKeys?.[buffer.length] || "";
  const allLearnedKeys = lesson.activeKeys;
  const questionStartedAt = useRef(Date.now());
  const lastAutoPronouncedQuestion = useRef("");

  useEffect(() => {
    if (!autoPronounce || !question?.id || !spokenText) return;
    if (lastAutoPronouncedQuestion.current === question.id) return;
    lastAutoPronouncedQuestion.current = question.id;
    pronounce(spokenText);
  }, [autoPronounce, pronounce, question?.id, spokenText]);

  const submitAnswer = useCallback((inputOverride) => {
    if (!question || feedback) return;
    const input = typeof inputOverride === "string" ? inputOverride : buffer;
    if (!input) return;
    const answeredAt = Date.now();
    const result = evaluateAnswer({
      input,
      expectedCodes: question.expectedCodes,
      method,
      questionMethod: question.method,
      startedAt: questionStartedAt.current,
      answeredAt,
    });
    setBuffer(result.normalisedInput);
    setFeedback({ result, copy: feedbackCopy(result, character, question) });
    setStats((current) => ({
      correct: current.correct + (result.correct ? 1 : 0),
      answered: current.answered + 1,
      hints: current.hints + (hintUsedCurrent ? 1 : 0),
    }));
    recordAttempt({
      lessonId: lesson.id,
      question,
      character,
      result,
      hintCount: hintUsedCurrent ? 1 : 0,
      firstTry: !attemptedCurrent,
      rootKey: question.type === "root-recognition" ? question.expectedKeys[0] : "",
      occurredAt: new Date(answeredAt).toISOString(),
    });
    setAttemptedCurrent(true);
  }, [
    attemptedCurrent,
    buffer,
    character,
    feedback,
    hintUsedCurrent,
    lesson.id,
    method,
    question,
    recordAttempt,
  ]);

  const nextQuestion = useCallback(() => {
    if (!feedback) return;
    if (index >= plan.questions.length - 1) {
      const accuracy = stats.answered ? Math.round(stats.correct / stats.answered * 100) : 0;
      const completedAt = new Date().toISOString();
      const session = {
        sessionId: plan.sessionId,
        lessonId: lesson.id,
        method,
        datasetVersion: plan.datasetVersion,
        completedAt,
        correct: stats.correct,
        answered: stats.answered,
        accuracy,
        hints: stats.hints,
        passed: accuracy >= lesson.passCriteria.minimumAccuracy * 100,
      };
      completeSession(session);
      setSummary(session);
      return;
    }
    setIndex((current) => current + 1);
    setBuffer("");
    setFeedback(null);
    setHintUsedCurrent(hintEnabled);
    setAttemptedCurrent(false);
    questionStartedAt.current = Date.now();
  }, [completeSession, feedback, hintEnabled, index, lesson.id, lesson.passCriteria.minimumAccuracy, method, plan, stats]);

  const handleInput = useCallback((key) => {
    if (!question || summary) return;
    if (key === "Enter") {
      if (feedback) nextQuestion();
      else submitAnswer();
      return;
    }
    if (feedback) return;
    if (key === "Backspace") {
      setBuffer((current) => current.slice(0, -1));
      return;
    }
    if (key === "Escape") {
      setBuffer("");
      return;
    }
    if (!/^[A-Z]$/.test(key) || !lesson.activeKeys.includes(key)) return;
    setPressedKey(key);
    window.setTimeout(() => setPressedKey(""), 130);
    const nextBuffer = appendInputKey(buffer, key, method);
    setBuffer(nextBuffer);
    if (shouldAutoSubmitAnswer(nextBuffer, question.expectedCodes)) {
      submitAnswer(nextBuffer);
    }
  }, [buffer, feedback, lesson.activeKeys, method, nextQuestion, question, submitAnswer, summary]);

  usePhysicalKeyboard({ enabled: !summary, onKey: handleInput });

  function toggleHint() {
    if (!question || feedback) return;
    if (!hintEnabled) setHintUsedCurrent(true);
    setHintEnabled(!hintEnabled);
  }

  if (summary) {
    return (
      <section className="lw-card cil-session-summary" data-testid="chinese-input-session-summary" aria-live="polite">
        <p className="lw-eyebrow">Journey complete</p>
        <h2>{summary.passed ? "Knowledge gained" : "Good practice — revisit when you wish"}</h2>
        <div className="cil-stat-grid">
          <div><strong>{summary.accuracy}%</strong><span>accuracy</span></div>
          <div><strong>{summary.correct}/{summary.answered}</strong><span>correct</span></div>
          <div><strong>{summary.hints}</strong><span>hints used</span></div>
        </div>
        <button className="lw-btn lw-btn-primary" type="button" onClick={() => onExit({ completed: true, passed: summary.passed })}>Choose what’s next</button>
      </section>
    );
  }

  return (
    <div className="cil-lesson-player" data-testid="chinese-input-lesson-player">
      <section className="lw-card cil-lesson-header">
        <div>
          <p className="lw-eyebrow">{method === "quick" ? "Quick 速成" : "Cangjie 倉頡"} journey</p>
          <h2>{lesson.title.en}</h2>
          <p className="lw-subtitle" lang="zh-Hant">{lesson.title.zhHant}</p>
        </div>
        <div className="cil-lesson-progress" aria-label={`Question ${index + 1} of ${plan.questions.length}`}>
          {index + 1}/{plan.questions.length}
        </div>
        <button className="lw-btn lw-btn-ghost" type="button" onClick={() => onExit({ completed: false })}>Exit to Kingdom</button>
      </section>

      <section className="cil-activity-layout">
        <div className="lw-card cil-prompt-card">
          <p className="lw-eyebrow" data-testid="chinese-input-question-type">
            {isRootRecognition ? "Root recognition" : "Guided typing"}
          </p>
          <h3>{question.prompt}</h3>
          {isRootRecognition ? (
            <>
              <p className="lw-subtitle">Root</p>
              <div
                className="cil-question-character"
                data-testid="chinese-input-root-glyph"
                lang="zh-Hant"
                aria-label={`${question.rootLabelEn || "Cangjie"} root ${question.rootLabel}`}
              >
                {question.rootLabel}
              </div>
              <p><strong>Keyboard key:</strong> ?</p>
              <PronunciationButton text={question.rootLabel} pronounce={pronounce} />
            </>
          ) : (
            <>
              <div className="cil-question-character" lang="zh-Hant">{character.char}</div>
              <p>{character.meaning.en}</p>
              <p><strong>Jyutping:</strong> {character.pronunciations[0].value}</p>
              <PronunciationButton text={character.char} pronounce={pronounce} />
            </>
          )}
        </div>

        <div className="lw-card cil-answer-card">
          <h3>{isRootRecognition ? "Keyboard key" : "Input buffer"}</h3>
          <div
            className="cil-input-buffer"
            data-testid="chinese-input-buffer"
            aria-live="polite"
            aria-label={`Typed keys: ${buffer || "empty"}`}
          >
            {buffer
              ? Array.from(buffer).map((key, keyIndex) => <span key={`${key}-${keyIndex}`}>{key}</span>)
              : <em>{isRootRecognition ? "Press one key" : "Start typing the code"}</em>}
          </div>
          {feedback && (
            <div
              className={`cil-feedback ${feedback.result.correct ? "is-correct" : "is-incorrect"}`}
              data-testid="chinese-input-feedback"
              aria-live="assertive"
            >
              {feedback.copy}
            </div>
          )}
          <div className="lw-btn-group">
            <button className="lw-btn lw-btn-secondary" type="button" onClick={() => setBuffer((current) => current.slice(0, -1))} disabled={!buffer || Boolean(feedback)}>Backspace</button>
            <button className="lw-btn lw-btn-secondary" type="button" onClick={() => setBuffer("")} disabled={!buffer || Boolean(feedback)}>Clear</button>
            <button
              className={`lw-btn lw-btn-secondary cil-hint-toggle${hintEnabled ? " is-on" : ""}`}
              data-testid="chinese-input-hint-toggle"
              type="button"
              aria-pressed={hintEnabled}
              onClick={toggleHint}
              disabled={Boolean(feedback)}
            >
              Hint: {hintEnabled ? "On" : "Off"}
            </button>
            {!feedback ? (
              <button className="lw-btn lw-btn-primary" data-testid="chinese-input-submit" type="button" aria-keyshortcuts="Enter" onClick={() => submitAnswer()} disabled={!buffer}>Submit</button>
            ) : (
              <button className="lw-btn lw-btn-primary" data-testid="chinese-input-next" type="button" aria-keyshortcuts="Enter" onClick={nextQuestion}>
                {index === plan.questions.length - 1 ? "Finish" : "Next"}
              </button>
            )}
          </div>
        </div>
      </section>

      {feedback && !isRootRecognition && <CharacterDecomposition character={character} method={method} />}

      <VirtualCangjieKeyboard
        activeKeys={lesson.activeKeys}
        learnedKeys={allLearnedKeys}
        expectedKey={hintEnabled ? expectedKey : ""}
        pressedKey={pressedKey}
        feedbackKey={feedback ? buffer[feedback.result.firstWrongPosition] || expectedKey : ""}
        feedbackCorrect={feedback?.result.correct}
        disabled={Boolean(feedback)}
        onKey={handleInput}
      />
    </div>
  );
}
