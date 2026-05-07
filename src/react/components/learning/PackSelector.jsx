import { useState } from "react";
import styles from "./PackSelector.module.css";

const SUBJECT_ORDER = ["language", "history", "geography", "other"];
const SUBJECT_LABELS = {
  language: "Language",
  history: "History",
  geography: "Geography",
  other: "Other",
};

function inferSubject(pack) {
  if (pack.subject) return pack.subject;
  const text = `${pack.id || ""} ${pack.displayName || ""}`.toLowerCase();
  if (/german|latin|deutsch|nicos|dino|frankfurt|bbc/.test(text)) return "language";
  if (/histor|black.?death|silk.?road/.test(text)) return "history";
  if (/geograph|glaciat|geolog/.test(text)) return "geography";
  return "other";
}

function groupPacksBySubject(packs) {
  const grouped = {};
  for (const pack of packs) {
    const subject = inferSubject(pack);
    if (!grouped[subject]) grouped[subject] = [];
    grouped[subject].push(pack);
  }
  return SUBJECT_ORDER.filter((s) => grouped[s]).map((s) => ({
    subject: s,
    label: SUBJECT_LABELS[s],
    packs: grouped[s],
  }));
}

const KIND_LABEL = { revision: "Quiz", builder: "Builder", passage: "Reading" };
const KIND_COLOR = { revision: "blue", builder: "amber", passage: "green" };

export function PackSelector({ packs = [], onSelectPack, selectedPackId, passageGroupIds = new Set() }) {
  const [activeSubject, setActiveSubject] = useState("all");

  if (!packs.length) {
    return (
      <div className={styles.empty}>
        <h3>No packs available</h3>
        <p>No learning packs found. Try refreshing.</p>
      </div>
    );
  }

  const groups = groupPacksBySubject(packs);
  const subjectTabs = [
    { id: "all", label: "All" },
    ...groups.map((g) => ({ id: g.subject, label: g.label })),
  ];
  const visibleGroups = activeSubject === "all" ? groups : groups.filter((g) => g.subject === activeSubject);

  return (
    <div>
      <div className={styles.subjectTabs}>
        {subjectTabs.map((s) => (
          <button
            key={s.id}
            className={`lw-nav-pill ${activeSubject === s.id ? "active" : ""}`}
            onClick={() => setActiveSubject(s.id)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>

      {visibleGroups.map((group) => (
        <div key={group.subject} className={styles.subjectGroup}>
          <h3 className={styles.subjectHeading}>{group.label}</h3>
          <div className={styles.grid}>
            {group.packs.map((pack) => {
              const runtimeId = pack.runtimeId || pack.id;
              const isSelected = runtimeId === selectedPackId;
              const hasReadingPack = pack.packKind === "passage" || passageGroupIds.has(pack.id);

              return (
                <div
                  key={runtimeId}
                  className={`${styles.card} ${isSelected ? styles.selected : ""}`}
                  onClick={() => onSelectPack(runtimeId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelectPack(runtimeId)}
                >
                  <h4 className={styles.cardTitle}>{pack.displayName || pack.title || pack.id}</h4>
                  {(pack.grammarFocusEn || pack.topicEn) && (
                    <p className={styles.cardDesc}>{pack.grammarFocusEn || pack.topicEn}</p>
                  )}
                  <div className={styles.badges}>
                    <span className={`lw-chip ${KIND_COLOR[pack.packKind] || "blue"} ${styles.badge}`}>
                      {KIND_LABEL[pack.packKind] || pack.packKind}
                    </span>

                    {pack.packKind === "revision" && hasReadingPack && (
                      <span className={`lw-chip green ${styles.badge}`}>Reading</span>
                    )}
                    {pack.packKind === "revision" && !hasReadingPack && (
                      <span className={`lw-chip ${styles.badge} ${styles.badgeMuted}`}>No reading</span>
                    )}

                    {pack.wordCount > 0 && (
                      <span className={`lw-chip ${styles.badge}`}>{pack.wordCount} words</span>
                    )}
                    {pack.cardCount > 0 && (
                      <span className={`lw-chip ${styles.badge}`}>{pack.cardCount} cards</span>
                    )}
                    {pack.level && (
                      <span className={`lw-chip amber ${styles.badge}`}>{pack.level}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
