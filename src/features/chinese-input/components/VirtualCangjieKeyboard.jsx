import { KEYBOARD_ROWS, ROOT_BY_KEY } from "../data/keyboard-layout.js";
import { resolveKeyState } from "../domain/key-state.js";

function stateForKey(key, {
  activeKeys,
  learnedKeys,
  expectedKey,
  pressedKey,
  feedbackKey,
  feedbackCorrect,
}) {
  const states = [];
  const active = activeKeys.includes(key);
  if (active) states.push("available");
  else states.push("inactive");
  if (learnedKeys.includes(key)) states.push("learned");
  if (expectedKey === key) states.push("expected");
  if (pressedKey === key) states.push("pressed");
  if (feedbackKey === key) states.push(feedbackCorrect ? "correct" : "incorrect");
  return resolveKeyState(states);
}

export default function VirtualCangjieKeyboard({
  activeKeys = [],
  learnedKeys = [],
  expectedKey = "",
  pressedKey = "",
  feedbackKey = "",
  feedbackCorrect = false,
  disabled = false,
  onKey,
}) {
  return (
    <div className="cil-keyboard" data-testid="chinese-input-keyboard" aria-label="Cangjie keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div className={`cil-keyboard-row cil-keyboard-row-${rowIndex + 1}`} key={row.join("")}>
          {row.map((key) => {
            const root = ROOT_BY_KEY[key];
            const state = stateForKey(key, {
              activeKeys,
              learnedKeys,
              expectedKey,
              pressedKey,
              feedbackKey,
              feedbackCorrect,
            });
            const inactive = state === "inactive";
            return (
              <button
                key={key}
                type="button"
                className={`cil-key cil-key-${state}`}
                data-testid={`chinese-input-key-${key}`}
                data-key-state={state}
                disabled={disabled || inactive}
                onClick={() => onKey?.(key, { source: "pointer" })}
                aria-label={`${key} key, Cangjie root ${root.primaryRoot}, ${state}`}
              >
                <span className="cil-key-latin">{key}</span>
                <span className="cil-key-root" lang="zh-Hant">{root.primaryRoot}</span>
                <span className="cil-key-state-label">{state}</span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
