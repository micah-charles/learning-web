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
  const wordLength = Array.from(word.word).length;
  const promptClass = `cik-word-prompt cik-word-prompt-length-${Math.min(wordLength, 4)}`;
  const optionClass = (optionIndex) => `cik-word-option${feedback !== null && optionIndex === 0 ? " is-correct" : ""}`;
  return <section className="lw-card cil-word-challenge" data-testid="chinese-input-word-challenge">
    <header className="cik-word-challenge-header">
      <div><p className="lw-eyebrow">3-Minute Word Challenge</p><h2>{index + 1}. {mode === "meaning" ? "Meaning recognition" : mode === "reading" ? "Word reading" : mode === "order" ? "Character order" : "Type the word"}</h2></div>
      <span className="cik-word-progress" aria-label={`Question ${index + 1} of ${MODES.length}`}>{index + 1}/{MODES.length}</span>
    </header>
    <div className="cik-word-prompt-area">
      <div className={promptClass} lang="zh-Hant" aria-label={`Word ${word.word}`}>{word.word}</div>
      <p className="cik-word-instruction">{mode === "meaning" ? "Choose the meaning" : mode === "reading" ? "Choose the word you hear" : mode === "order" ? "Choose the character order" : "Type the full word"}</p>
      {mode === "reading" && <PronunciationButton text={word.word} pronounce={pronounce} label="Hear the word" />}
    </div>
    <div className="cik-word-answer-area">
      {mode === "meaning" && <div className="cik-word-options">{meaningOptions.map((option, optionIndex) => <button type="button" key={option} className={optionClass(optionIndex)} onClick={() => answer(option)} aria-label={`Option ${String.fromCharCode(65 + optionIndex)}: ${option}`}><strong>{String.fromCharCode(65 + optionIndex)}.</strong><span>{option}</span></button>)}</div>}
      {mode === "reading" && <div className="cik-word-options">{readingOptions.map((option, optionIndex) => <button type="button" key={option} className={optionClass(optionIndex)} onClick={() => answer(option)} aria-label={`Option ${String.fromCharCode(65 + optionIndex)}: ${option}`}><strong>{String.fromCharCode(65 + optionIndex)}.</strong><span>{option}</span></button>)}</div>}
      {mode === "order" && <div className="cik-word-options">{[characters.map((character) => character.char).join("+"), [...characters].reverse().map((character) => character.char).join("+")].map((option, optionIndex) => <button type="button" key={option} className={optionClass(optionIndex)} onClick={() => answer(option)} aria-label={`Option ${String.fromCharCode(65 + optionIndex)}: ${option}`}><strong>{String.fromCharCode(65 + optionIndex)}.</strong><span>{option}</span></button>)}</div>}
      {mode === "typing" && <div className="cik-word-typing"><input className="cil-input-buffer" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Type the full word" aria-label="Word answer" /><button className="lw-btn lw-btn-primary" type="button" onClick={() => answer(input)} disabled={!input}>Check answer</button></div>}
    </div>
    <div className="cik-word-feedback-area" aria-live="polite">
      {feedback !== null ? <div className={`cil-feedback ${feedback ? "is-correct" : "is-incorrect"}`} role="status">{feedback ? `Correct — “${word.word}” means ${word.meaning || "this meaning"}.` : `Not quite. The answer is ${word.word}.`}</div> : <div className="cik-word-feedback-placeholder" aria-hidden="true" />}
      {feedback !== null && <button className="lw-btn lw-btn-primary cik-word-next" type="button" onClick={next}>{index === MODES.length - 1 ? "Finish challenge" : "Next"}</button>}
    </div>
  </section>;
}
