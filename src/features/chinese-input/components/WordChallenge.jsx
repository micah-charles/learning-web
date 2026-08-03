import { useMemo, useState } from "react";
import PronunciationButton from "./PronunciationButton.jsx";

const MODES = ["meaning", "reading", "order", "typing"];

export default function WordChallenge({ word, dataset, pronounce, recordWordAttempt, onExit }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [input, setInput] = useState("");
  const characters = useMemo(() => (word.requiredCharacterIds || []).map((id) => dataset.characters.find((character) => character.id === id)).filter(Boolean), [dataset.characters, word.requiredCharacterIds]);
  const mode = MODES[index];
  const meaningOptions = useMemo(() => [word.meaning || "Meaning pending educational review", "dark", "noisy", "messy"], [word.meaning]);
  const readingOptions = useMemo(() => [word.word, ...characters.slice(0, 2).map((character) => character.char), "美麗"].filter((value, position, all) => all.indexOf(value) === position), [characters, word.word]);
  function answer(value) {
    if (feedback) return;
    const correct = mode === "meaning" ? value === meaningOptions[0] : mode === "reading" ? value === word.word : mode === "order" ? value === characters.map((character) => character.char).join("+") : value === word.word;
    setFeedback(correct);
    recordWordAttempt({ wordId: word.wordId, mode: mode === "order" ? "context" : mode, correct });
  }
  function next() {
    if (index >= MODES.length - 1) { onExit(); return; }
    setIndex((value) => value + 1); setFeedback(null); setInput("");
  }
  return <section className="lw-card cil-word-challenge" data-testid="chinese-input-word-challenge"><div className="cil-lesson-header"><div><p className="lw-eyebrow">3-Minute Word Challenge</p><h2>{index + 1}. {mode === "meaning" ? "Meaning recognition" : mode === "reading" ? "Word reading" : mode === "order" ? "Character order" : "Type the word"}</h2></div><span>{index + 1}/{MODES.length}</span></div><div className="cil-word-challenge-body"><div className="cil-question-character" lang="zh-Hant">{word.word}</div>{mode === "meaning" && <div className="cik-word-options">{meaningOptions.map((option, optionIndex) => <button type="button" key={option} className={feedback !== null && optionIndex === 0 ? "is-correct" : ""} onClick={() => answer(option)}>{String.fromCharCode(65 + optionIndex)} · {option}</button>)}</div>}{mode === "reading" && <><PronunciationButton text={word.word} pronounce={pronounce} label="Hear the word" /><div className="cik-word-options">{readingOptions.map((option) => <button type="button" key={option} onClick={() => answer(option)}>{option}</button>)}</div></>}{mode === "order" && <div className="cik-word-options">{[characters.map((character) => character.char).join("+"), [...characters].reverse().map((character) => character.char).join("+")].map((option) => <button type="button" key={option} onClick={() => answer(option)}>{option}</button>)}</div>}{mode === "typing" && <><input className="cil-input-buffer" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type the full word" aria-label="Word answer" /><button className="lw-btn lw-btn-primary" type="button" onClick={() => answer(input)} disabled={!input}>Check answer</button></>}{feedback !== null && <div className={`cil-feedback ${feedback ? "is-correct" : "is-incorrect"}`} role="status">{feedback ? "Correct — this adds word evidence." : `Not quite. The answer is ${word.word}.`}</div>} {feedback !== null && <button className="lw-btn lw-btn-primary" type="button" onClick={next}>{index === MODES.length - 1 ? "Finish challenge" : "Next"}</button>}</div></section>;
}
