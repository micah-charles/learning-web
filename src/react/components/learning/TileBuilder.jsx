import styles from "./TileBuilder.module.css";

export function TileBuilder({ answerTiles, bankTiles, onPick, onReturn, disabled = false }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.zone}>
        <label className={styles.zoneLabel}>Answer bar</label>
        <div className={`${styles.area} ${answerTiles.length ? "" : styles.empty}`}>
          {answerTiles.length
            ? answerTiles.map(t => (
                <button key={t.id} className={`${styles.tile} ${styles.answer}`} onClick={() => !disabled && onReturn(t.id)} disabled={disabled}>{t.text}</button>
              ))
            : <span className={styles.hint}>Tap tiles to build the answer.</span>}
        </div>
      </div>
      <div className={styles.zone}>
        <label className={styles.zoneLabel}>Tile bank</label>
        <div className={styles.area}>
          {bankTiles.map(t => (
            <button key={t.id} className={styles.tile} onClick={() => !disabled && onPick(t.id)} disabled={disabled}>{t.text}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
