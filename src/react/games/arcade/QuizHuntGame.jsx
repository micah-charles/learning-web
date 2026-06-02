/**
 * QuizHuntGame.jsx — Mode 1: Quiz Hunt.
 *
 * The fox moves PacMan-style (keeps gliding in the current direction) around a
 * grid. The HUD shows the prompt; 1 correct + up to 3 distractor answer tokens
 * are scattered on the board. Eat the correct one to score and advance; eat a
 * wrong one to lose a life (brief freeze + combo reset).
 *
 * Engineering notes (per project rules):
 *  - Authoritative per-step state lives in a ref (gRef); React state is a cheap
 *    snapshot updated once per discrete step, never per animation frame.
 *  - Side effects (sound, progress) fire imperatively in the step handler,
 *    never inside a setState updater (RC9-safe, StrictMode-safe).
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { generateMap } from "./maps/mapGenerator.js";
import { stepInDirection, isFloor } from "./engine/grid.js";
import { placeTokensNoOverlap, tokenContains } from "./utils/tokenLayout.js";
import { useGameLoop } from "./engine/useGameLoop.js";
import { useArcadeControls } from "./hooks/useArcadeControls.js";
import { useBoardMetrics } from "./hooks/useBoardMetrics.js";
import GameBoard from "./components/GameBoard.jsx";
import ArcadeHud from "./ui/ArcadeHud.jsx";
import DpadControls from "./ui/DpadControls.jsx";
import PauseOverlay from "./ui/PauseOverlay.jsx";

const STEP_MS = 170; // forgiving "educational arcade" pace
const START_LIVES = 3;

function nearestFloor(map, x, y) {
  if (isFloor(map, x, y)) return { x, y };
  for (let r = 1; r < Math.max(map.cols, map.rows); r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (isFloor(map, x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  return { x: 0, y: 0 };
}

function placeTokens(g, cellPx) {
  const q = g.questions[g.qIndex];
  // _isCorrect is the flag tokenLayout uses for the solvability BFS.
  const items = [
    { text: q.correctAnswer, isCorrect: true,  _isCorrect: true  },
    ...q.distractors.map((d) => ({ text: d,    isCorrect: false, _isCorrect: false })),
  ];
  const placed = placeTokensNoOverlap(g.map, items, [g.player], cellPx);
  g.tokens = placed.map((a, i) => ({
    id: `tok_${g.qIndex}_${i}`,
    x: a.x, y: a.y,
    text: a.text, isCorrect: a.isCorrect, state: "neutral",
  }));
}

function initState(map, questions, goal, cellPx) {
  const player = nearestFloor(map, Math.floor(map.cols / 2), Math.floor(map.rows / 2));
  const g = {
    map, questions, goal,
    status: "ready", qIndex: 0,
    player, direction: "none",
    tokens: [],
    score: 0, lives: START_LIVES, combo: 0, bestStreak: 0,
    correct: 0, answered: 0, freeze: 0,
    timeLeft: goal.mode === "time" ? goal.target : null,
  };
  placeTokens(g, cellPx);
  return g;
}

function snapshot(g) {
  return {
    status: g.status, qIndex: g.qIndex,
    player: g.player, tokens: g.tokens,
    score: g.score, lives: g.lives, combo: g.combo,
    bestStreak: g.bestStreak, correct: g.correct, answered: g.answered,
    timeLeft: g.timeLeft, map: g.map,
  };
}

function step(g, direction, dt, cellPx) {
  const events = [];
  if (g.status !== "playing") return events;

  // Countdown (time mode) ticks while playing, including during the brief freeze.
  if (g.timeLeft != null) {
    g.timeLeft -= dt / 1000;
    if (g.timeLeft <= 0) { g.timeLeft = 0; g.status = "over"; events.push({ type: "over" }); return events; }
  }

  g.direction = direction;
  if (g.freeze > 0) { g.freeze -= 1; return events; }

  const prevPos = g.player;
  g.player = stepInDirection(g.map, g.player, g.direction);
  // Blocked by a wall/edge → did not enter a new cell, so do not (re)trigger any
  // token under us. This prevents a wrong token from draining multiple lives when
  // the fox is stuck against a wall after a hit.
  if (g.player.x === prevPos.x && g.player.y === prevPos.y) return events;
  const q = g.questions[g.qIndex];
  // Footprint collision: the fox eats a word if it touches ANY cell the pill
  // covers. Skip tokens already marked "wrong" — once a wrong answer has been
  // hit its token stays on screen as a visual indicator but must not cost
  // another heart if the fox moves through or near it again.
  const hit = g.tokens.find((t) => t.state !== "wrong" && tokenContains(t, g.player.x, g.player.y, cellPx));
  if (!hit) return events;

  g.answered += 1;
  if (hit.isCorrect) {
    g.score += 10 + g.combo * 2;
    g.combo += 1;
    g.correct += 1;
    g.bestStreak = Math.max(g.bestStreak, g.combo);
    events.push({ type: "correct", wordId: q.wordId });
    // Reached the question-count goal → win.
    if (g.goal.mode === "questions" && g.correct >= g.goal.target) {
      g.status = "over"; events.push({ type: "over" });
    } else {
      // Cycle questions (wrap) so time/large-count goals keep going on small packs.
      g.qIndex = (g.qIndex + 1) % g.questions.length;
      placeTokens(g, cellPx);
    }
  } else {
    g.lives -= 1;
    g.combo = 0;
    g.freeze = 2;
    hit.state = "wrong";
    events.push({ type: "wrong", wordId: q.wordId });
    if (g.lives <= 0) { g.status = "over"; events.push({ type: "over" }); }
  }
  return events;
}

function summaryOf(g) {
  return {
    score: g.score, correct: g.correct, bestStreak: g.bestStreak,
    accuracy: g.answered ? Math.round((g.correct / g.answered) * 100) : 0,
    answered: g.answered,
  };
}

const DEFAULT_GOAL = { mode: "questions", target: 20 };

export default function QuizHuntGame({ questions, mapType = "open", goal = DEFAULT_GOAL, sound, reducedMotion, onExit, onRecord }) {
  const wrapRef = useRef(null);
  const { cols, rows, cellPx } = useBoardMetrics(wrapRef);
  const cellPxRef = useRef(cellPx);
  cellPxRef.current = cellPx;
  const gRef = useRef(null);
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

  // (Re)initialise when content, grid dimensions, or goal change.
  useEffect(() => {
    if (!questions || questions.length === 0) { gRef.current = null; setView(null); return; }
    const map = generateMap(mapType, cols, rows);
    gRef.current = initState(map, questions, goal, cellPx);
    setView(snapshot(gRef.current));
    setPaused(false);
  }, [questions, mapType, cols, rows, goal, cellPx]);

  const onDirection = useCallback(() => {
    const g = gRef.current;
    if (g && g.status === "ready") {
      g.status = "playing";
      setView(snapshot(g));
      sound.play("start");
    }
  }, [sound]);

  const togglePause = useCallback(() => {
    const g = gRef.current;
    if (!g || g.status !== "playing") return;
    setPaused((p) => !p);
  }, []);

  const { directionRef, press } = useArcadeControls({
    surfaceRef: wrapRef,
    enabled: !!view && view.status !== "over",
    onDirection,
    onPause: togglePause,
  });

  const handleStep = useCallback((dt) => {
    const g = gRef.current;
    if (!g) return;
    const events = step(g, directionRef.current, dt, cellPxRef.current);
    // Stand still after eating any token (correct or wrong) — the player must
    // give a fresh input to start moving again.
    if (events.some((e) => e.type === "correct" || e.type === "wrong")) {
      directionRef.current = "none";
    }
    setView(snapshot(g));
    for (const ev of events) {
      if (ev.type === "correct") { sound.play("correct"); onRecord?.("answer", { wordId: ev.wordId, correct: true }); }
      else if (ev.type === "wrong") { sound.play("wrong"); onRecord?.("answer", { wordId: ev.wordId, correct: false }); }
      else if (ev.type === "over") { sound.play("complete"); onRecord?.("over", summaryOf(g)); }
    }
  }, [directionRef, sound, onRecord]);

  const running = !!view && view.status === "playing" && !paused;
  useGameLoop({ running, stepIntervalMs: STEP_MS, onStep: handleStep });

  function restart() {
    const map = generateMap(mapType, cols, rows);
    gRef.current = initState(map, questions, goal, cellPx);
    directionRef.current = "none";
    setView(snapshot(gRef.current));
    setPaused(false);
  }

  if (!view) {
    return (
      <div className="arc-game-empty">
        <p>No playable items in this pack (it needs vocab cards with answer choices). Try another.</p>
        <button className="lw-btn lw-btn-primary" type="button" onClick={onExit} style={{ marginTop: 12 }}>
          ← Back to setup
        </button>
      </div>
    );
  }

  const q = questions[view.qIndex] || questions[questions.length - 1];
  const over = view.status === "over";
  const segments = [{ id: "fox", x: view.player.x, y: view.player.y, head: true }];

  return (
    <div className="arc-game">
      <ArcadeHud
        title="Find the answer for"
        prompt={q.questionText}
        hint={q.topic}
        score={view.score} streak={view.combo} lives={view.lives} maxLives={START_LIVES}
        goalText={goal.mode === "questions" ? `${view.correct}/${goal.target}` : null}
        timer={goal.mode === "time" ? view.timeLeft : undefined}
        muted={sound.muted} onToggleMute={sound.toggleMute} onPause={togglePause}
      />

      <div className="arc-board-wrap" ref={wrapRef}>
        <GameBoard
          map={view.map} cellPx={cellPx}
          tokens={view.tokens} segments={segments}
          playerEmoji="🦊" reducedMotion={reducedMotion}
        />
        {view.status === "ready" && (
          <div className="arc-start-hint">Swipe, use arrow keys, or the D-pad to move 🦊</div>
        )}
      </div>

      <DpadControls onPress={press} />

      {(paused || over) && (
        <PauseOverlay
          kind={over ? "over" : "paused"}
          summary={over ? summaryOf(gRef.current) : null}
          onResume={() => setPaused(false)}
          onRestart={restart}
          onExit={onExit}
        />
      )}
    </div>
  );
}
