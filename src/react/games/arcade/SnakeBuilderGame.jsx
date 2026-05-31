/**
 * SnakeBuilderGame.jsx — Mode 2: Sentence Builder Snake (the key mode).
 *
 * The snake must eat the sentence's word tokens IN ORDER. Each correct next
 * word grows the snake and adds to the built sentence; a wrong/out-of-order
 * token (or a decoy word) costs a life. Completing a sentence loads the next.
 *
 * Fully data-driven and multilingual: tokens come straight from a builder
 * pack's `tiles` (any language). No German-specific logic.
 *
 * Same engine discipline as QuizHuntGame: ref-authoritative state, snapshot to
 * React once per step, side effects fired outside setState updaters.
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { generateMap } from "./maps/mapGenerator.js";
import { stepInDirection, randomFloorCells, cellKey, isFloor, OPPOSITE } from "./engine/grid.js";
import { useGameLoop } from "./engine/useGameLoop.js";
import { useArcadeControls } from "./hooks/useArcadeControls.js";
import { useBoardMetrics } from "./hooks/useBoardMetrics.js";
import { snakeBuilderDecoys } from "./utils/gameQuestionAdapter.js";
import { shuffle } from "@/utils.js";
import GameBoard from "./components/GameBoard.jsx";
import ArcadeHud from "./ui/ArcadeHud.jsx";
import DpadControls from "./ui/DpadControls.jsx";
import PauseOverlay from "./ui/PauseOverlay.jsx";

const STEP_MS = 200; // a touch slower than Quiz Hunt — more thinking time
const START_LIVES = 3;
const MAX_DECOYS = 3;

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

function loadSentence(g) {
  const q = g.questions[g.qIndex];
  g.expected = 1;
  g.tokenCount = q.tokens.length;
  g.collected = [];
  g.body = [g.body[0]]; // reset snake to a single head between sentences
  const occupied = new Set([cellKey(g.body[0].x, g.body[0].y)]);
  const decoys = snakeBuilderDecoys(g.questions, q.tokens, MAX_DECOYS);
  // Correct tokens first so they are always placed; decoys fill remaining cells.
  const wanted = [
    ...q.tokens.map((t) => ({ text: t.text, order: t.order })),
    ...shuffle(decoys).map((d) => ({ text: d, order: 0 })),
  ];
  const cells = randomFloorCells(g.map, wanted.length, occupied);
  g.tokens = wanted.slice(0, cells.length).map((a, i) => ({
    id: `tk_${g.qIndex}_${i}`,
    x: cells[i].x, y: cells[i].y,
    text: a.text, order: a.order, collected: false, state: "neutral",
  }));
}

function initState(map, questions) {
  const head = nearestFloor(map, Math.floor(map.cols / 2), Math.floor(map.rows / 2));
  const g = {
    map, questions,
    status: "ready", qIndex: 0,
    body: [head], heading: "none",
    tokens: [], expected: 1, tokenCount: 0, collected: [],
    score: 0, lives: START_LIVES, combo: 0, bestStreak: 0,
    correct: 0, wrong: 0, freeze: 0,
  };
  loadSentence(g);
  return g;
}

function snapshot(g) {
  return {
    status: g.status, qIndex: g.qIndex,
    body: g.body, tokens: g.tokens, collected: g.collected,
    score: g.score, lives: g.lives, combo: g.combo,
    bestStreak: g.bestStreak, correct: g.correct, wrong: g.wrong,
    map: g.map,
  };
}

function step(g, inputDir) {
  const events = [];
  if (g.status !== "playing") return events;
  if (g.freeze > 0) { g.freeze -= 1; return events; }

  let dir = inputDir;
  if (dir === "none") dir = g.heading;
  // Block reversing directly into the body (classic snake rule).
  if (g.body.length > 1 && dir === OPPOSITE[g.heading]) dir = g.heading;

  const head = g.body[0];
  const nh = stepInDirection(g.map, head, dir);
  if (nh.x === head.x && nh.y === head.y) return events; // blocked
  g.heading = dir;
  g.body.unshift(nh);

  let grew = false;
  const q = g.questions[g.qIndex];
  const hit = g.tokens.find((t) => !t.collected && t.x === nh.x && t.y === nh.y);
  if (hit) {
    if (hit.order === g.expected) {
      g.score += 10 + g.combo * 2;
      g.combo += 1;
      g.bestStreak = Math.max(g.bestStreak, g.combo);
      g.collected.push(hit.text);
      hit.collected = true;
      hit.state = "correct";
      g.expected += 1;
      grew = true;
      events.push({ type: "collect" });
      if (g.expected > g.tokenCount) {
        g.score += 25;
        g.correct += 1;
        events.push({ type: "complete", itemId: q.itemId });
        g.qIndex += 1;
        if (g.qIndex >= g.questions.length) { g.status = "over"; events.push({ type: "over" }); }
        else loadSentence(g); // resets body to head → keep grew=true to skip pop
      }
    } else {
      g.lives -= 1;
      g.combo = 0;
      g.wrong += 1;
      g.freeze = 2;
      hit.state = "wrong";
      events.push({ type: "wrong", itemId: q.itemId });
      if (g.lives <= 0) { g.status = "over"; events.push({ type: "over" }); }
    }
  }
  if (!grew) g.body.pop();
  return events;
}

function summaryOf(g) {
  const answered = g.correct + g.wrong;
  return {
    score: g.score, correct: g.correct, bestStreak: g.bestStreak,
    accuracy: answered ? Math.round((g.correct / answered) * 100) : 0,
  };
}

export default function SnakeBuilderGame({ questions, mapType = "open", sound, reducedMotion, onExit, onRecord }) {
  const wrapRef = useRef(null);
  const { cols, rows, cellPx } = useBoardMetrics(wrapRef);
  const gRef = useRef(null);
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

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
      if (ev.type === "collect") sound.play("collect");
      else if (ev.type === "complete") { sound.play("correct"); onRecord?.("builderComplete", { itemId: ev.itemId, correct: true }); }
      else if (ev.type === "wrong") { sound.play("wrong"); onRecord?.("builderComplete", { itemId: ev.itemId, correct: false }); }
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
    return (
      <div className="arc-game-empty">
        <p>No sentence-builder items in this pack (cards need at least two word tiles). Try another.</p>
        <button className="lw-btn lw-btn-primary" type="button" onClick={onExit} style={{ marginTop: 12 }}>
          ← Back to setup
        </button>
      </div>
    );
  }

  const q = questions[view.qIndex] || questions[questions.length - 1];
  const over = view.status === "over";
  const segments = view.body.map((c, i) => ({ id: `s${i}`, x: c.x, y: c.y, head: i === 0 }));
  const built = view.collected.join(" → ") || "—";

  return (
    <div className="arc-game">
      <ArcadeHud
        title="Build, in order"
        prompt={q.sentence}
        hint={`So far: ${built}`}
        score={view.score} streak={view.combo} lives={view.lives} maxLives={START_LIVES}
        muted={sound.muted} onToggleMute={sound.toggleMute} onPause={togglePause}
      />

      <div className="arc-board-wrap" ref={wrapRef}>
        <GameBoard
          map={view.map} cellPx={cellPx}
          tokens={view.tokens.filter((t) => !t.collected)} segments={segments}
          playerEmoji="🐍" reducedMotion={reducedMotion}
        />
        {view.status === "ready" && (
          <div className="arc-start-hint">Eat the words in order to build the sentence 🐍</div>
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
