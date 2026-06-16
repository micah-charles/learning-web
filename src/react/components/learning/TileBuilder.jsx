import styles from "./TileBuilder.module.css";

export function TileBuilder({ answerTiles, bankTiles, onPick, onReturn, disabled = false }) {
  return (
    <div className={styles.wrap} data-testid="sentence-builder">
      <div className={styles.zone} data-testid="sentence-builder-answer-zone">
        <label className={styles.zoneLabel}>Answer bar</label>
        <div className={`${styles.area} ${answerTiles.length ? "" : styles.empty}`} data-testid="sentence-builder-answer-bar">
          {answerTiles.length
            ? answerTiles.map(t => (
                <button key={t.id} className={`${styles.tile} ${styles.answer}`} data-testid="sentence-builder-answer-token" onClick={() => !disabled && onReturn(t.id)} disabled={disabled}>{t.text}</button>
              ))
            : <span className={styles.hint}>Tap tiles to build the answer.</span>}
        </div>
      </div>
      <div className={styles.zone} data-testid="sentence-builder-bank-zone">
        <label className={styles.zoneLabel}>Tile bank</label>
        <div className={styles.area} data-testid="sentence-builder-tile-bank">
          {bankTiles.map(t => (
            <button key={t.id} className={styles.tile} data-testid="sentence-word-token" onClick={() => !disabled && onPick(t.id)} disabled={disabled}>{t.text}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
