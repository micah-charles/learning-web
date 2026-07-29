function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

/**
 * Applies a generated entity-based migration without erasing existing progress.
 * Lesson completion is recalculated from stable character/root mastery; newly
 * added entities never inherit mastery merely because an old lesson completed.
 */
export function migrateChineseInputCurriculumProgress(moduleProgress, migration, generatedLessons, inputDigest = "") {
  const current = objectOrEmpty(moduleProgress);
  const characters = objectOrEmpty(current.characters);
  const roots = objectOrEmpty(current.roots);
  const words = objectOrEmpty(current.words);
  const achievements = objectOrEmpty(current.achievements);
  const oldLessons = objectOrEmpty(current.lessons);
  const lessons = { ...oldLessons };

  for (const generated of generatedLessons || []) {
    const entityIds = [...(generated.newRoots || []), ...(generated.newCharacters || [])];
    const mastered = entityIds.filter((entityId) => {
      if (entityId.startsWith("cj-")) return (roots[entityId] || roots[entityId.slice(-1)] || {}).masteryScore >= 80;
      return Math.max(
        characters[entityId]?.cangjie?.masteryScore || 0,
        characters[entityId]?.quick?.masteryScore || 0,
      ) >= 80;
    });
    const prior = objectOrEmpty(lessons[generated.lessonId]);
    lessons[generated.lessonId] = {
      ...prior,
      status: entityIds.length > 0 && mastered.length === entityIds.length
        ? "completed"
        : mastered.length > 0 ? "partial" : (prior.status || "not-started"),
      masteredEntityIds: mastered,
      requiredEntityIds: entityIds,
      migrationVersion: migration?.migrationVersion || 1,
    };
  }

  return {
    ...current,
    lessons,
    roots,
    characters,
    words,
    achievements,
    reviewQueue: objectOrEmpty(current.reviewQueue),
    sessions: Array.isArray(current.sessions) ? current.sessions : [],
    attemptEvents: Array.isArray(current.attemptEvents) ? current.attemptEvents : [],
    curriculumMigrationVersion: migration?.migrationVersion || 1,
    curriculumInputDigest: inputDigest || current.curriculumInputDigest || "",
  };
}
