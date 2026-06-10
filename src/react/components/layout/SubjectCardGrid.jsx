import styles from "./SubjectCardGrid.module.css";

const SUBJECT_META = {
  language:   { label: "Language",   icon: "🌐" },
  history:    { label: "History",    icon: "📜" },
  geography:  { label: "Geography",  icon: "🌍" },
  science:    { label: "Science",    icon: "🔬" },
  literature: { label: "Literature", icon: "📖" },
  computing:  { label: "Computing",  icon: "💻" },
  religion:   { label: "Religion",   icon: "🕊️" },
  other:      { label: "Other",      icon: "🗂️" },
};

export function SubjectCardGrid({ subjects, activeSubject, onSelect }) {
  return (
    <div className={styles.grid}>
      {subjects.map(({ id, count }) => {
        const meta = SUBJECT_META[id] || { label: id, icon: "📚" };
        const empty = count === 0;
        return (
          <button
            key={id}
            type="button"
            className={`${styles.card} ${activeSubject === id ? styles.active : ""} ${empty ? styles.empty : ""}`}
            onClick={() => !empty && onSelect(id)}
            disabled={empty}
          >
            <span className={styles.icon}>{meta.icon}</span>
            <span className={styles.label}>{meta.label}</span>
            <span className={styles.meta}>{empty ? "No packs yet" : `${count} pack${count === 1 ? "" : "s"}`}</span>
          </button>
        );
      })}
    </div>
  );
}
