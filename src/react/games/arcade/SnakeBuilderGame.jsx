/**
 * SnakeBuilderGame.jsx — Mode 2: Classic Snake × Sentence Builder.
 *
 * Classic Snake mechanics:
 *   - Open map (no walls) — the snake wraps its OWN body, not a maze.
 *   - Every correct word eaten grows the tail by one segment.
 *   - Exactly TWO tokens on screen at a time: the next word to collect (correct)
 *     + one distractor drawn from the remaining sentence words.
 *   - As words are collected the distractor pool shrinks; on the final word
 *     only one token remains — the correct answer.
 *   - Tokens always spawn on cells NOT occupied by the snake body.
 *   - Eating a wrong token costs a life + brief freeze; tokens respawn in new
 *     positions so the player can try again without being trapped.
 *
 * Engineering: same ref-authoritative / snapshot-once-per-step discipline as
 * QuizHuntGame (RC16).
 */
import { useRef, useState, useEffect, useCallback } from "react";
import { generateMap } from "./maps/mapGenerator.js";
import { stepInDirection, isFloor, OPPOSITE } from "./engine/grid.js";
import { useGameLoop } from "./engine/useGameLoop.js";
import { useArcadeControls } from "./hooks/useArcadeControls.js";
import { useBoardMetrics } from "./hooks/useBoardMetrics.js";
import { placeTokensNoOverlap, tokenContains } from "./utils/tokenLayout.js";
import { shuffle } from "@/utils.js";
import GameBoard from "./components/GameBoard.jsx";
import ArcadeHud from "./ui/ArcadeHud.jsx";
import DpadControls from "./ui/DpadControls.jsx";
import PauseOverlay from "./ui/PauseOverlay.jsx";

const STEP_MS = 180;
const START_LIVES = 3;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/**
 * Spawn exactly 2 tokens for the current step:
 *   - slot 0: the correct next word  (order = g.expected)
 *   - slot 1: a distractor chosen from the remaining (not-yet-collected) words
 *             — or absent if this is the final word in the sentence.
 *
 * Tokens are placed on cells not occupied by the snake's body.
 * The distractor comes from the SAME sentence's remaining words so the player
 * is learning the full sentence as they play.
 */
function spawnPair(g, cellPx) {
  const q = g.questions[g.qIndex];
  const correctToken = q.tokens[g.expected - 1]; // 1-based

  // Pool of remaining words (expected+1 … end) for the distractor.
  const remaining = q.tokens.slice(g.expected); // tokens[expected] onward
  const distractor = remaining.length > 0 ? shuffle([...remaining])[0] : null;

  const items = [
    { text: correctToken.text, _isCorrect: true  },
    ...(distractor ? [{ text: distractor.text, _isCorrect: false }] : []),
  ];

  // Reserve every snake body cell so tokens never spawn on the tail.
  const reserved = [...g.body];
  const placed = placeTokensNoOverlap(g.map, items, reserved, cellPx);

  g.tokens = placed.map((a) => ({
    id: `tk_${g.qIndex}_${g.expected}_${Math.random().toString(36).slice(2, 7)}`,
    x: a.x, y: a.y,
    text: a.text,
    isCorrect: a._isCorrect,
    state: "neutral",
  }));
}

function initState(map, questions, goal, cellPx) {
  const head = nearestFloor(map, Math.floor(map.cols / 2), Math.floor(map.rows / 2));
  const queue = goal.mode === "fullset"
    ? shuffle([...Array(questions.length).keys()])
    : null;
  const startIdx = queue ? queue[0] : 0;
  const g = {
    map, questions, goal,
    status: "ready",
    qIndex: startIdx,
    body: [head], heading: "none",
    tokens: [], expected: 1, tokenCount: 0, collected: [],
    score: 0, lives: START_LIVES, combo: 0, bestStreak: 0,
    correct: 0, wrong: 0, freeze: 0,
    timeLeft: goal.mode === "time" ? goal.target : null,
    queue,
    doneInSet: 0,
    totalInSet: questions.length,
  };
  g.tokenCount = questions[startIdx]?.tokens?.length || 0;
  spawnPair(g, cellPx);
  return g;
}

function snapshot(g) {
  return {
    status: g.status, qIndex: g.qIndex,
    body: g.body, tokens: g.tokens, collected: g.collected,
    score: g.score, lives: g.lives, combo: g.combo,
    bestStreak: g.bestStreak, correct: g.correct, wrong: g.wrong,
    timeLeft: g.timeLeft, map: g.map,
    expected: g.expected, tokenCount: g.tokenCount,
    doneInSet: g.doneInSet, totalInSet: g.totalInSet,
  };
}

function step(g, inputDir, dt, cellPx) {
  const events = [];
  if (g.status !== "playing") return events;

  if (g.timeLeft != null) {
    g.timeLeft -= dt / 1000;
    if (g.timeLeft <= 0) {
      g.timeLeft = 0; g.status = "over"; events.push({ type: "over" }); return events;
    }
  }

  if (g.freeze > 0) { g.freeze -= 1; return events; }

  let dir = inputDir;
  if (dir === "none") return events; // stay still until input given
  // Classic snake rule: can't reverse into own body.
  if (g.body.length > 1 && dir === OPPOSITE[g.heading]) dir = g.heading;

  const head = g.body[0];
  // Use stepInDirection — the outer border is now a real wall in map.walls,
  // so the snake stops at the edge instead of wrapping outside the visible area.
  const nh = stepInDirection(g.map, head, dir);
  if (nh.x === head.x && nh.y === head.y) return events; // blocked by wall

  // Self-collision: check if the new head enters any body segment.
  // Exclude the very last tail cell — it moves away this step (unless we grow),
  // so hitting it should not penalise the player.
  const checkBody = g.body.slice(0, g.body.length - 1);
  if (checkBody.some((seg) => seg.x === nh.x && seg.y === nh.y)) {
    g.lives -= 1;
    g.combo = 0;
    g.freeze = 3;
    events.push({ type: "self-hit" });
    if (g.lives <= 0) { g.status = "over"; events.push({ type: "over" }); }
    return events; // don't move; snake stays where it is
  }

  g.heading = dir;
  g.body.unshift(nh);

  let grew = false;
  const q = g.questions[g.qIndex];
  const hit = g.tokens.find((t) => tokenContains(t, nh.x, nh.y, cellPx));
  if (hit) {
    if (hit.isCorrect) {
      g.score += 10 + g.combo * 2;
      g.combo += 1;
      g.bestStreak = Math.max(g.bestStreak, g.combo);
      g.collected.push(hit.text);
      g.expected += 1;
      grew = true;                      // tail grows — classic Snake behaviour
      events.push({ type: "collect" });

      if (g.expected > g.tokenCount) {
        // Sentence complete.
        g.score += 25;
        g.correct += 1;
        events.push({ type: "complete", itemId: q.itemId });

        let nextIdx;
        if (g.goal.mode === "fullset") {
          g.doneInSet += 1;
          g.queue.shift();          // remove completed sentence from queue
          if (g.queue.length === 0) {
            g.status = "over"; events.push({ type: "over" });
            nextIdx = null;
          } else {
            nextIdx = g.queue[0];
          }
        } else if (g.goal.mode === "questions" && g.correct >= g.goal.target) {
          g.status = "over"; events.push({ type: "over" });
          nextIdx = null;
        } else {
          nextIdx = (g.qIndex + 1) % g.questions.length;
        }

        if (nextIdx !== null) {
          g.qIndex = nextIdx;
          g.expected = 1;
          g.tokenCount = g.questions[nextIdx]?.tokens?.length || 0;
          g.collected = [];
          g.body = [g.body[0]];
          spawnPair(g, cellPx);
        }
      } else {
        spawnPair(g, cellPx); // spawn next word pair
      }
    } else {
      // Wrong token: lose a life, respawn both tokens in new positions.
      g.lives -= 1;
      g.combo = 0;
      g.wrong += 1;
      g.freeze = 3;
      events.push({ type: "wrong", itemId: q.itemId });
      if (g.lives <= 0) {
        g.status = "over"; events.push({ type: "over" });
      } else {
        spawnPair(g, cellPx); // move tokens so snake isn't forced into wrong again
      }
    }
  }

  if (!grew) g.body.pop(); // normal Snake tail movement
  return events;
}

function summaryOf(g) {
  const answered = g.correct + g.wrong;
  return {
    score: g.score, correct: g.correct, bestStreak: g.bestStreak,
    accuracy: answered ? Math.round((g.correct / answered) * 100) : 0,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

const DEFAULT_GOAL = { mode: "questions", target: 20 };

export default function SnakeBuilderGame({ questions, mapType = "open", goal = DEFAULT_GOAL, sound, reducedMotion, onExit, onRecord }) {
  const wrapRef = useRef(null);
  const { cols, rows, cellPx } = useBoardMetrics(wrapRef);
  const cellPxRef = useRef(cellPx);
  cellPxRef.current = cellPx;
  const gRef = useRef(null);
  const [view, setView] = useState(null);
  const [paused, setPaused] = useState(false);

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
    // After eating, self-hit, or wrong token — stop gliding until next input.
    if (events.some((e) => ["collect", "wrong", "complete", "self-hit"].includes(e.type))) {
      directionRef.current = "none";
    }
    setView(snapshot(g));
    for (const ev of events) {
      if (ev.type === "collect")   sound.play("collect");
      else if (ev.type === "complete")  { sound.play("correct"); onRecord?.("builderComplete", { itemId: ev.itemId, correct: true }); }
      else if (ev.type === "wrong")     { sound.play("wrong");   onRecord?.("builderComplete", { itemId: ev.itemId, correct: false }); }
      else if (ev.type === "self-hit")  sound.play("wrong");
      else if (ev.type === "over")      { sound.play("complete"); onRecord?.("over", summaryOf(g)); }
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
        <p>No sentence-builder items in this pack (cards need at least two word tiles). Try another.</p>
        <button className="lw-btn lw-btn-primary" type="button" onClick={onExit} style={{ marginTop: 12 }}>
          ← Back to setup
        </button>
      </div>
    );
  }

  const q = questions[view.qIndex] || questions[questions.length - 1];
  const over = view.status === "over";

  // Body segments — each tail segment [i] carries the word from collected[i-1]
  // so the snake's body visually spells out the sentence being built.
  const segments = view.body.map((c, i) => ({
    id: `s${i}`, x: c.x, y: c.y, head: i === 0,
    word: i > 0 ? (view.collected[i - 1] || null) : null,
  }));

  const wordsCollected = view.expected - 1;
  const wordProgress = wordsCollected > 0
    ? `${view.collected.join(" ")}  (${wordsCollected} / ${view.tokenCount})`
    : `0 / ${view.tokenCount} words`;

  // q.sentence is c.prompt (the question to answer), falling back to c.answer if no prompt.
  // Never show the answer in the HUD — the player must build it.
  const questionText = q.sentence || "What's the next word?";

  return (
    <div className="arc-game">
      <ArcadeHud
        title="Answer the question"
        prompt={questionText}
        hint={wordProgress}
        score={view.score} streak={view.combo} lives={view.lives} maxLives={START_LIVES}
        goalText={
          goal.mode === "fullset"
            ? `${view.doneInSet} / ${view.totalInSet} ✓`
            : goal.mode === "questions"
              ? `${view.correct} / ${goal.target} done`
              : null
        }
        timer={goal.mode === "time" ? view.timeLeft : undefined}
        muted={sound.muted} onToggleMute={sound.toggleMute} onPause={togglePause}
      />

      <div className="arc-board-wrap" ref={wrapRef}>
        <GameBoard
          map={view.map} cellPx={cellPx}
          tokens={view.tokens} segments={segments}
          playerEmoji="/images/foxchild-girl.png" reducedMotion={reducedMotion}
        />
        {view.status === "ready" && (
          <div className="arc-start-hint">Read the question above, then eat words in order to build the answer 🐍</div>
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
