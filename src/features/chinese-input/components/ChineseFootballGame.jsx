import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { appendInputKey } from "../domain/code-normalisation.js";
import { shouldAutoSubmitAnswer } from "../domain/answer-evaluator.js";
import { findChineseInputCharacter } from "../dataset.js";
import {
  createFootballSessionPlan,
  createGoalTargets,
  evaluateGoalkeeperInput,
  footballTargetPosition,
  scoreFootballSave,
} from "../domain/football-game.js";
import usePhysicalKeyboard from "../hooks/usePhysicalKeyboard.js";
import PronunciationButton from "./PronunciationButton.jsx";
import VirtualCangjieKeyboard from "./VirtualCangjieKeyboard.jsx";
import { calculatePerformance } from "../../../react/games/framework/performanceEngine.js";

const TARGET_PREVIEW_MS = 800;
const ROUND_DEADLINE_MS = 3000;
const RESULT_HOLD_MS = 1400;
const STARTING_LIVES = 4;

function hearts(lives) {
  return Array.from({ length: STARTING_LIVES }, (_, index) => (
    <span className={index < lives ? "is-live" : "is-lost"} key={index} aria-hidden="true">♥</span>
  ));
}

function phaseLabel(phase, correct) {
  if (phase === "preview") return "TARGET";
  if (phase === "active") return "TYPE THE CODE";
  if (correct) return "SAVE!";
  return "GOAL!";
}

function playCue(kind) {
  if (typeof window === "undefined") return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const config = {
      key: [360, .035],
      save: [720, .16],
      goal: [150, .22],
      whistle: [920, .1],
    }[kind] || [440, .05];
    oscillator.frequency.value = config[0];
    oscillator.type = kind === "goal" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(.055, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + config[1]);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + config[1]);
    oscillator.addEventListener("ended", () => context.close(), { once: true });
  } catch {
    // Audio is progressive enhancement; browser policy can deny a context.
  }
}

export default function ChineseFootballGame({
  dataset,
  lesson,
  method,
  recordAttempt,
  completeSession,
  completeGameSession,
  miniGameProfile,
  recordMiniGameResult,
  pronounce,
  autoPronounce = true,
  onExit,
}) {
  const seedRef = useRef(Math.floor(Date.now() / 1000));
  const roundStartedAtRef = useRef(0);
  const pauseStartedAtRef = useRef(0);
  const resolvedRef = useRef(false);
  const transitionTimerRef = useRef(null);
  const attemptsRef = useRef([]);
  const lastAutoPronouncedQuestionRef = useRef("");
  const plan = useMemo(() => createFootballSessionPlan({
    dataset,
    lesson,
    method,
    seed: seedRef.current,
    questionCount: Math.max(6, lesson.passCriteria?.minimumQuestions || 10),
    createdAt: new Date().toISOString(),
  }), [dataset, lesson, method]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState("preview");
  const [difficulty, setDifficulty] = useState("easy");
  const [paused, setPaused] = useState(false);
  const [buffer, setBuffer] = useState("");
  const [pressedKey, setPressedKey] = useState("");
  const [hintVisible, setHintVisible] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(ROUND_DEADLINE_MS);
  const [resultState, setResultState] = useState(null);
  const [lives, setLives] = useState(STARTING_LIVES);
  const [stats, setStats] = useState({
    score: 0,
    coins: 0,
    xp: 0,
    correct: 0,
    answered: 0,
    streak: 0,
    bestStreak: 0,
  });
  const [summary, setSummary] = useState(null);
  const question = plan.questions[index];
  const targetCharacter = findChineseInputCharacter(dataset, question?.characterId);
  const targets = useMemo(() => createGoalTargets({
    dataset,
    lesson,
    method,
    question,
  }), [dataset, lesson, method, question]);
  const targetZoneIndex = targets.findIndex((character) => character.id === targetCharacter?.id);
  const targetPosition = footballTargetPosition(targetZoneIndex);
  const missPosition = footballTargetPosition((targetZoneIndex + 4) % 9);
  const expectedKey = question?.expectedKeys?.[buffer.length] || "";
  const timeSeconds = Math.max(0, timeLeftMs / 1000).toFixed(2);

  useEffect(() => {
    if (!autoPronounce || !question?.id || !targetCharacter?.char) return;
    if (lastAutoPronouncedQuestionRef.current === question.id) return;
    lastAutoPronouncedQuestionRef.current = question.id;
    pronounce(targetCharacter.char);
  }, [autoPronounce, pronounce, question?.id, targetCharacter?.char]);

  const finishGame = useCallback((finalStats, finalLives) => {
    const completedAt = new Date().toISOString();
    const performance = calculatePerformance({
      attempts: attemptsRef.current,
      previousSkillRating: miniGameProfile.skillRating,
    });
    const accuracy = finalStats.answered
      ? Math.round(finalStats.correct / finalStats.answered * 100)
      : 0;
    const passed = finalLives > 0
      && finalStats.answered === plan.questions.length
      && accuracy >= (lesson.passCriteria?.minimumAccuracy || .8) * 100;
    const gameSession = {
      ...performance,
      id: `football-${plan.sessionId}`,
      sessionId: `football-${plan.sessionId}`,
      gameId: "chinese-football",
      playMode: "lesson",
      completed: true,
      lessonId: lesson.id,
      method,
      datasetVersion: plan.datasetVersion,
      completedAt,
      accuracy,
      correct: finalStats.correct,
      answered: finalStats.answered,
      score: finalStats.score,
      coins: finalStats.coins,
      xp: finalStats.xp,
      bestStreak: finalStats.bestStreak,
      livesRemaining: finalLives,
      passed,
    };
    completeSession({
      sessionId: gameSession.sessionId,
      lessonId: lesson.id,
      method,
      datasetVersion: plan.datasetVersion,
      completedAt,
      correct: finalStats.correct,
      answered: finalStats.answered,
      accuracy,
      hints: 0,
      passed,
      activity: "chinese-football",
    });
    completeGameSession(gameSession);
    recordMiniGameResult(gameSession);
    setSummary(gameSession);
  }, [
    completeGameSession,
    completeSession,
    lesson.id,
    lesson.passCriteria?.minimumAccuracy,
    method,
    miniGameProfile.skillRating,
    plan.datasetVersion,
    plan.questions.length,
    plan.sessionId,
    recordMiniGameResult,
  ]);

  const resolveRound = useCallback((input, timedOut = false) => {
    if (resolvedRef.current || phase !== "active" || !question || !targetCharacter) return;
    resolvedRef.current = true;
    const answeredAt = Date.now();
    const result = evaluateGoalkeeperInput({
      input,
      question,
      method,
      startedAt: roundStartedAtRef.current,
      answeredAt,
      timedOut,
    });
    const reward = scoreFootballSave({
      correct: result.correct,
      reactionMs: result.durationMs,
      streak: stats.streak,
    });
    const nextStreak = result.correct ? stats.streak + 1 : 0;
    const nextLives = Math.max(0, lives - (result.correct ? 0 : 1));
    const nextStats = {
      score: stats.score + reward.score,
      coins: stats.coins + reward.coins,
      xp: stats.xp + reward.xp,
      correct: stats.correct + (result.correct ? 1 : 0),
      answered: stats.answered + 1,
      streak: nextStreak,
      bestStreak: Math.max(stats.bestStreak, nextStreak),
    };
    attemptsRef.current.push({ correct: result.correct, reactionMs: result.durationMs });
    setBuffer(result.normalisedInput);
    setStats(nextStats);
    setLives(nextLives);
    setResultState({ result, reward, timedOut });
    setPhase("result");
    playCue(result.correct ? "save" : "goal");
    recordAttempt({
      lessonId: lesson.id,
      question,
      character: targetCharacter,
      result,
      hintCount: hintVisible ? 1 : 0,
      firstTry: !hintVisible,
      rootKey: "",
      occurredAt: new Date(answeredAt).toISOString(),
    });
    transitionTimerRef.current = window.setTimeout(() => {
      const isLastRound = index >= plan.questions.length - 1;
      if (isLastRound || nextLives <= 0) {
        finishGame(nextStats, nextLives);
        return;
      }
      setIndex((current) => current + 1);
      setBuffer("");
      setHintVisible(false);
      setResultState(null);
      setTimeLeftMs(ROUND_DEADLINE_MS);
      setPhase("preview");
    }, RESULT_HOLD_MS);
  }, [
    finishGame,
    hintVisible,
    index,
    lesson.id,
    lives,
    method,
    phase,
    plan.questions.length,
    question,
    recordAttempt,
    stats,
    targetCharacter,
  ]);

  useEffect(() => {
    if (phase !== "preview" || summary) return undefined;
    resolvedRef.current = false;
    playCue("whistle");
    transitionTimerRef.current = window.setTimeout(() => {
      roundStartedAtRef.current = Date.now();
      setTimeLeftMs(ROUND_DEADLINE_MS);
      setPhase("active");
    }, TARGET_PREVIEW_MS);
    return () => window.clearTimeout(transitionTimerRef.current);
  }, [index, phase, summary]);

  useEffect(() => {
    if (phase !== "active" || paused || summary) return undefined;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, ROUND_DEADLINE_MS - (Date.now() - roundStartedAtRef.current));
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(timer);
        resolveRound("", true);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [paused, phase, resolveRound, summary]);

  useEffect(() => () => window.clearTimeout(transitionTimerRef.current), []);

  const handleInput = useCallback((key) => {
    if (phase !== "active" || paused || summary) return;
    if (key === "Backspace") {
      setBuffer((current) => current.slice(0, -1));
      return;
    }
    if (key === "Escape") {
      setBuffer("");
      return;
    }
    if (key === "Enter") {
      if (buffer) resolveRound(buffer);
      return;
    }
    if (!/^[A-Z]$/.test(key)) return;
    setPressedKey(key);
    window.setTimeout(() => setPressedKey(""), 120);
    playCue("key");
    const nextBuffer = appendInputKey(buffer, key, method);
    setBuffer(nextBuffer);
    if (shouldAutoSubmitAnswer(nextBuffer, question.expectedCodes)) {
      resolveRound(nextBuffer);
    }
  }, [buffer, method, paused, phase, question, resolveRound, summary]);

  usePhysicalKeyboard({ enabled: phase === "active" && !paused && !summary, onKey: handleInput });

  function togglePause() {
    if (phase !== "active") return;
    if (paused) {
      roundStartedAtRef.current += Date.now() - pauseStartedAtRef.current;
      setPaused(false);
    } else {
      pauseStartedAtRef.current = Date.now();
      setPaused(true);
    }
  }

  if (summary) {
    return (
      <section className="lw-card cil-football-summary" data-testid="chinese-football-summary" aria-live="polite">
        <span className="cil-football-summary-icon" aria-hidden="true">{summary.passed ? "🏆" : "🧤"}</span>
        <p className="lw-eyebrow">Full time · {lesson.title.en}</p>
        <h2>{summary.passed ? "Lesson cleared!" : "Training complete — try for more saves"}</h2>
        <div className="cil-stat-grid">
          <div><strong>{summary.score}</strong><span>score</span></div>
          <div><strong>{summary.accuracy}%</strong><span>accuracy</span></div>
          <div><strong>{summary.correct}/{summary.answered}</strong><span>saves</span></div>
          <div><strong>{summary.coins}</strong><span>coins</span></div>
          <div><strong>{summary.xp}</strong><span>XP</span></div>
        </div>
        <div className="lw-btn-group">
          <button className="lw-btn lw-btn-primary" type="button" onClick={onExit}>Back to world</button>
        </div>
      </section>
    );
  }

  const stageClass = `is-${phase} ${resultState?.result.correct ? "is-save" : resultState ? "is-goal" : ""}`;
  const pitchStyle = {
    "--target-x": `${targetPosition.x}%`,
    "--target-y": `${targetPosition.y}%`,
    "--keeper-x": `${resultState?.result.correct ? targetPosition.x : missPosition.x}%`,
    "--keeper-y": `${resultState?.result.correct ? targetPosition.y : missPosition.y}%`,
  };

  return (
    <div className="cil-football-game" data-testid="chinese-football-game">
      <header className="cil-football-hud">
        <div><small>Score</small><strong data-testid="chinese-football-score">{stats.score}</strong></div>
        <div><small>Coins</small><strong>◎ {stats.coins}</strong></div>
        <div><small>Combo</small><strong>×{stats.streak}</strong></div>
        <div className="cil-football-clock"><strong>{timeSeconds}</strong></div>
        <div className="cil-football-lesson-name"><small>Session focus</small><strong>{lesson.title.en}</strong></div>
        <div className="cil-football-hearts" aria-label={`${lives} lives remaining`}>{hearts(lives)}</div>
        <button type="button" className="cil-football-icon-button" onClick={togglePause} disabled={phase !== "active"} aria-label={paused ? "Resume game" : "Pause game"}>
          {paused ? "▶" : "Ⅱ"}
        </button>
        <button type="button" className="cil-football-icon-button" onClick={onExit} aria-label="Exit game">×</button>
      </header>

      <section className={`cil-football-stadium ${stageClass}`} style={pitchStyle} aria-label="Penalty save arena">
        <div className="cil-stadium-lights" aria-hidden="true" />
        <div className="cil-football-goal" aria-label="Nine target zones">
          {Array.from({ length: 9 }, (_, zoneIndex) => {
            const character = targets[zoneIndex] || null;
            const isTarget = zoneIndex === targetZoneIndex;
            return (
              <div
                className={`cil-football-target ${isTarget ? "is-target" : ""} ${character ? "" : "is-empty"}`}
                data-testid={character ? `chinese-football-target-${character.id}` : `chinese-football-empty-${zoneIndex + 1}`}
                data-zone={zoneIndex + 1}
                key={`${question.id}-${zoneIndex}`}
                aria-label={character ? `Zone ${zoneIndex + 1}, ${character.char}` : `Zone ${zoneIndex + 1}, empty`}
              >
                <span className="cil-football-zone-number">{zoneIndex + 1}</span>
                {character && <strong lang="zh-Hant">{character.char}</strong>}
              </div>
            );
          })}
        </div>

        <div className="cil-football-keeper" aria-hidden="true">
          <span className="cil-football-arm left">🧤</span>
          <span className="cil-football-keeper-avatar"><img src="/images/foxchild-fox.png" alt="" /></span>
          <span className="cil-football-jersey">1</span>
          <span className="cil-football-arm right">🧤</span>
        </div>
        <div className="cil-football-shooter" aria-hidden="true">
          <span className="cil-football-shooter-avatar"><img src="/images/foxchild-fox.png" alt="" /></span>
          <span className="cil-football-shirt">10</span>
        </div>
        <div className="cil-football-ball" aria-hidden="true">
          {miniGameProfile.equipped.ball === "ball_comet" ? "☄️" : "⚽"}
        </div>

        <div className="cil-football-phase-banner" role="status" aria-live="polite">
          {phaseLabel(phase, resultState?.result.correct)}
          {phase === "preview" && targetCharacter && <span lang="zh-Hant">{targetCharacter.char}</span>}
        </div>
        {paused && <div className="cil-football-pause-overlay"><strong>Paused</strong><button type="button" onClick={togglePause}>Resume</button></div>}
      </section>

      <section className="cil-football-round-strip">
        <div>
          <small>Input code</small>
          <div className="cil-football-input" data-testid="chinese-football-input">
            {buffer
              ? Array.from(buffer).map((key, keyIndex) => <kbd key={`${key}-${keyIndex}`}>{key}</kbd>)
              : <em>{phase === "preview" ? "Watch the target…" : "Type now"}</em>}
          </div>
        </div>
        <div>
          <small>Time left</small>
          <div className="cil-football-timebar"><span style={{ width: `${timeLeftMs / ROUND_DEADLINE_MS * 100}%` }} /></div>
          <strong>{timeSeconds} / 3.00</strong>
        </div>
        <div><small>Round</small><strong>{index + 1} / {plan.questions.length}</strong></div>
      </section>

      <section className="cil-football-controls">
        <div className="cil-football-mode-panel">
          <p className="lw-eyebrow">{method === "quick" ? "Quick 速成" : "Cangjie 倉頡"}</p>
          <button type="button" className={difficulty === "easy" ? "is-active" : ""} onClick={() => setDifficulty("easy")} disabled={phase === "active"}>
            Easy mode <small>Key highlights</small>
          </button>
          <button type="button" className={difficulty === "difficult" ? "is-active" : ""} onClick={() => setDifficulty("difficult")} disabled={phase === "active"}>
            Difficult <small>No highlights</small>
          </button>
        </div>
        <div className="cil-football-keyboard-wrap">
          <VirtualCangjieKeyboard
            activeKeys={difficulty === "easy" ? lesson.activeKeys : Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ")}
            learnedKeys={lesson.activeKeys}
            expectedKey={difficulty === "easy" && phase === "active" ? expectedKey : ""}
            pressedKey={pressedKey}
            feedbackKey={resultState && !resultState.result.correct ? buffer[resultState.result.firstWrongPosition] || "" : ""}
            feedbackCorrect={resultState?.result.correct}
            guidanceLevel={difficulty === "easy" ? "full" : "off"}
            disabled={phase !== "active" || paused}
            onKey={handleInput}
          />
        </div>
        <div className="cil-football-actions">
          <button type="button" onClick={() => handleInput("Backspace")} disabled={!buffer || phase !== "active"}>← Backspace</button>
          <button type="button" onClick={() => setBuffer("")} disabled={!buffer || phase !== "active"}>↻ Clear</button>
          <PronunciationButton
            text={targetCharacter?.char || ""}
            label="Pronounce target"
            pronounce={pronounce}
            disabled={!targetCharacter}
            testId="chinese-football-pronounce"
          />
          <button type="button" onClick={() => setHintVisible(true)} disabled={phase !== "active" || hintVisible}>💡 Hint</button>
          {hintVisible && <p className="cil-football-hint">Code: <strong>{question.preferredCode}</strong></p>}
        </div>
      </section>

      {resultState && (
        <div className={`cil-football-result ${resultState.result.correct ? "is-correct" : "is-incorrect"}`} data-testid="chinese-football-feedback" aria-live="assertive">
          <strong>{resultState.result.correct ? "SAVE!" : "GOAL!"}</strong>
          <span>
            {targetCharacter.char} = {question.preferredCode}
            {resultState.result.correct
              ? ` · ${resultState.reward.rating} · +${resultState.reward.score} points`
              : resultState.timedOut ? " · Time expired" : " · Wrong code"}
          </span>
        </div>
      )}
    </div>
  );
}
