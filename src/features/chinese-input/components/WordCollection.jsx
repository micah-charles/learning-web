import { useMemo, useState } from "react";
import PronunciationButton from "./PronunciationButton.jsx";

export default function WordCollection({ wordIndex, moduleProgress, pronounce, onStartChallenge }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const records = moduleProgress.words || {};
  const words = useMemo(() => Object.values(wordIndex?.wordsById || {}).filter((word) => {
    const state = records[word.wordId]?.state || "hidden";
    if (!["discovered", "introduced", "learning", "ready-to-review", "secure"].includes(state)) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${word.word} ${word.meaning || ""}`.toLowerCase().includes(needle);
  }), [query, records, wordIndex]);
  const selected = words.find((word) => word.wordId === selectedId);
  return <div data-testid="chinese-input-word-collection"><section className="lw-card cil-section-heading"><div><p className="lw-eyebrow">Word Explorer</p><h2>Discovered Words</h2><p className="lw-subtitle">Discovery is separate from mastery. Keep practising to make each word secure.</p></div><label><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="明亮 or bright" /></label></section>{words.length ? <section className="cil-character-grid">{words.slice(0, 80).map((word) => { const state = records[word.wordId]?.state || "discovered"; return <button className="lw-card cil-character-card" type="button" key={word.wordId} onClick={() => setSelectedId(word.wordId)}><span className="cil-character-glyph" lang="zh-Hant">{word.word}</span><strong>{word.meaning || "Meaning pending educational review"}</strong><span>{state}</span><span>{records[word.wordId]?.typingMastery || 0}% typing</span></button>; })}</section> : <section className="lw-card lw-empty"><h3>No discovered words yet</h3><p>Complete character practice to reveal words whose prerequisites are ready.</p></section>}{selected && <section className="lw-card cil-character-detail" aria-live="polite"><button className="lw-btn lw-btn-ghost cil-detail-close" type="button" onClick={() => setSelectedId("")}>Close detail</button><div className="cil-character-detail-heading"><span className="cil-character-glyph" lang="zh-Hant">{selected.word}</span><div><h3>{selected.meaning || "Meaning pending educational review"}</h3><p>{selected.requiredCharacterIds.join(" · ")} · {records[selected.wordId]?.state || "discovered"}</p><PronunciationButton text={selected.word} pronounce={pronounce} /></div></div><p>Characters: {selected.requiredCharacterIds.join(" + ")}</p><p>Full-word typing and meaning challenges are available through the Learning Director.</p>{onStartChallenge && <button className="lw-btn lw-btn-primary" type="button" onClick={() => onStartChallenge(selected)}>Try word challenge</button>}</section>}</div>;
}
