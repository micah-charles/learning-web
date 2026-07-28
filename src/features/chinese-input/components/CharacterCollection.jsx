import { useMemo, useState } from "react";
import CharacterDecomposition from "./CharacterDecomposition.jsx";
import PronunciationButton from "./PronunciationButton.jsx";
import { isReviewDue } from "../domain/review-scheduler.js";

export default function CharacterCollection({
  dataset,
  method,
  moduleProgress,
  pronounce,
  reviewOnly = false,
  reviewCount = 0,
  onStartReview,
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(reviewOnly ? "due" : "all");
  const [selectedId, setSelectedId] = useState("");
  const records = moduleProgress.characters || {};
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return dataset.characters.filter((character) => {
      const mastery = records[character.id]?.[method];
      if (status === "learned" && !mastery?.attempts) return false;
      if (status === "mastered" && (mastery?.masteryScore || 0) < 80) return false;
      if (status === "due" && !isReviewDue(mastery)) return false;
      if (!needle) return true;
      const haystack = [
        character.char,
        character.meaning.en,
        character.pronunciations[0]?.value,
        character[method]?.preferredCode,
      ].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [dataset.characters, method, query, records, status]);
  const selected = dataset.characters.find((character) => character.id === selectedId);

  return (
    <div data-testid={reviewOnly ? "chinese-input-review" : "chinese-input-collection"}>
      <section className="lw-card cil-section-heading">
        <div>
          <p className="lw-eyebrow">{reviewOnly ? "Adaptive queue" : "Verified seed set"}</p>
          <h2>{reviewOnly ? "Review" : "Character Collection"}</h2>
          <p className="lw-subtitle">
            {reviewOnly ? "Due and weaker characters appear here after practice." : "Search by character, meaning, Jyutping or input code."}
          </p>
        </div>
        <div className="cil-collection-filters">
          {reviewOnly && reviewCount > 0 && (
            <button className="lw-btn lw-btn-primary" type="button" onClick={onStartReview}>
              Start adaptive review ({reviewCount})
            </button>
          )}
          <label>
            <span>Search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="林, forest, lam4 or DD" />
          </label>
          <label>
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All</option>
              <option value="learned">Practised</option>
              <option value="mastered">Mastered</option>
              <option value="due">Due for review</option>
            </select>
          </label>
        </div>
      </section>
      {filtered.length ? (
        <section className="cil-character-grid">
          {filtered.slice(0, 80).map((character) => {
            const mastery = records[character.id]?.[method];
            return (
              <button className="lw-card cil-character-card" type="button" key={character.id} onClick={() => setSelectedId(character.id)}>
                <span className="cil-character-glyph" lang="zh-Hant">{character.char}</span>
                <strong>{character[method].preferredCode}</strong>
                <span>{character.pronunciations[0].value}</span>
                <span>{mastery?.masteryScore || 0}% mastery</span>
              </button>
            );
          })}
        </section>
      ) : (
        <section className="lw-card lw-empty">
          <h3>{reviewOnly ? "Nothing is due yet" : "No matching characters"}</h3>
          <p>{reviewOnly ? "Complete a lesson and your review queue will grow from real attempts." : "Try a character, meaning, code or Jyutping search."}</p>
        </section>
      )}
      {selected && (
        <section className="lw-card cil-character-detail" aria-live="polite">
          <button className="lw-btn lw-btn-ghost cil-detail-close" type="button" onClick={() => setSelectedId("")}>Close detail</button>
          <div className="cil-character-detail-heading">
            <span className="cil-character-glyph" lang="zh-Hant">{selected.char}</span>
            <div>
              <h3>{selected.meaning.en}</h3>
              <p>{selected.pronunciations[0].value} · {selected.codePoint}</p>
              <PronunciationButton text={selected.char} pronounce={pronounce} />
            </div>
          </div>
          <CharacterDecomposition character={selected} method={method} />
          <p lang="zh-Hant">{selected.examples[0].zhHant}</p>
          <p>{selected.examples[0].en}</p>
          <PronunciationButton
            text={selected.examples[0].zhHant}
            pronounce={pronounce}
            label="Hear example sentence"
          />
        </section>
      )}
    </div>
  );
}
