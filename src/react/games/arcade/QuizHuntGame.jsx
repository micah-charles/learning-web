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
import { stepInDirection, randomFloorCells, cellKey, isFloor } from "./engine/grid.js";
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

function placeTokens(g) {
  const q = g.questions[g.qIndex];
  // Correct first so it is always included even if few free cells exist.
  const answers = [
    { text: q.correctAnswer, isCorrect: true },
    ...q.distractors.map((d) => ({ text: d, isCorrect: false })),
  ];
  const occupied = new Set([cellKey(g.player.x, g.player.y)]);
  const cells = randomFloorCells(g.map, answers.length, occupied);
  g.tokens = answers.slice(0, cells.length).map((a, i) => ({
    id: `tok_${g.qIndex}_${i}`,
    x: cells[i].x, y: cells[i].y,
    text: a.text, isCorrect: a.isCorrect, state: "neutral",
  }));
}

function initState(map, questions) {
  const player = nearestFloor(map, Math.floor(map.cols / 2), Math.floor(map.rows / 2));
  const g = {
    map, questions,
    status: "ready", qIndex: 0,
    player, direction: "none",
    tokens: [],
    score: 0, lives: START_LIVES, combo: 0, bestStreak: 0,
    correct: 0, answered: 0, freeze: 0,
  };
  placeTokens(g);
  return g;
}

function snapshot(g) {
  return {
    status: g.status, qIndex: g.qIndex,
    player: g.player, tokens: g.tokens,
    score: g.score, lives: g.lives, combo: g.combo,
    bestStreak: g.bestStreak, correct: g.correct, answered: g.answered,
    map: g.map,
  };
}

function step(g, direction) {
  const events = [];
  if (g.status !== "playing") return events;
  g.direction = direction;
  if (g.freeze > 0) { g.freeze -= 1; return events; }

  g.player = stepInDirection(g.map, g.player, g.direction);
  const q = g.questions[g.qIndex];
  const hit = g.tokens.find((t) => t.x === g.player.x && t.y === g.player.y);
  if (!hit) return events;

  g.answered += 1;
  if (hit.isCorrect) {
    g.score += 10 + g.combo * 2;
    g.combo += 1;
    g.correct += 1;
    g.bestStreak = Math.max(g.bestStreak, g.combo);
    events.push({ type: "correct", wordId: q.wordId });
    g.qIndex += 1;
    if (g.qIndex >= g.questions.length) { g.status = "over"; events.push({ type: "over" }); }
    else placeTokens(g);
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

export default function QuizHuntGame({ questions, mapType = "open", sound, reducedMotion, onExit, onRecord }) {
  const wrapRef = useRef(null);
  const { cols, rows, cellPx } = useBoardMetrics(wrapRef);
  const gRef = useRef(null);
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

  // (Re)initialise when content or grid dimensions change.
  useEffect(() => {
    if (!questions || questions.length === 0) { gRef.current = null; setView(null); return; }
    const map = generateMap(mapType, cols, rows);
    gRef.current = initState(map, questions);
    setView(snapshot(gRef.current));
    setPaused(false);
  }, [questions, mapType, cols, rows]);

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

  const handleStep = useCallback(() => {
    const g = gRef.current;
    if (!g) return;
    const events = step(g, directionRef.current);
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
    gRef.current = initState(map, questions);
    setView(snapshot(gRef.current));
    setPaused(false);
  }

  if (!view) {
    return <div className="arc-game-empty">No playable items in this pack. Try another.</div>;
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
