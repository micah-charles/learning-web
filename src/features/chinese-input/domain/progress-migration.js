export const CHINESE_INPUT_PROGRESS_SCHEMA_VERSION = 1;
export const CHINESE_INPUT_PREFS_MIGRATION_VERSION = 2;
export const CHINESE_INPUT_DATASET_VERSION = "0.1.0";
export const CHINESE_INPUT_EVENT_LIMIT = 500;
export const CHINESE_INPUT_SESSION_LIMIT = 100;

export function createChineseInputPrefs() {
  return {
    enabled: true,
    method: "cangjie",
    cangjieVersion: "5",
    locale: "zh-HK",
    guidanceLevel: "full",
    soundEnabled: true,
    speechEnabled: true,
    autoPronounce: true,
    autoSubmit: false,
    lastLessonId: "",
    lastView: "dashboard",
    migrationVersion: CHINESE_INPUT_PREFS_MIGRATION_VERSION,
  };
}

export function createChineseInputProgress() {
  return {
    schemaVersion: CHINESE_INPUT_PROGRESS_SCHEMA_VERSION,
    datasetVersion: CHINESE_INPUT_DATASET_VERSION,
    lessons: {},
    roots: {},
    characters: {},
    reviewQueue: {},
    sessions: [],
    attemptEvents: [],
    achievements: {},
  };
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

export function migrateChineseInputState(state) {
  if (!state || typeof state !== "object") return state;
  state.prefs = objectOrEmpty(state.prefs);
  state.progress = objectOrEmpty(state.progress);
  const incomingPrefs = objectOrEmpty(state.prefs.chineseInputLab);
  state.prefs.chineseInputLab = {
    ...createChineseInputPrefs(),
    ...incomingPrefs,
    locale: incomingPrefs.locale === "zh-TW" ? "zh-TW" : "zh-HK",
    autoPronounce: incomingPrefs.autoPronounce !== false,
    migrationVersion: CHINESE_INPUT_PREFS_MIGRATION_VERSION,
  };
  const incoming = objectOrEmpty(state.progress.chineseInputLab);
  state.progress.chineseInputLab = {
    ...createChineseInputProgress(),
    ...incoming,
    lessons: objectOrEmpty(incoming.lessons),
    roots: objectOrEmpty(incoming.roots),
    characters: objectOrEmpty(incoming.characters),
    reviewQueue: objectOrEmpty(incoming.reviewQueue),
    achievements: objectOrEmpty(incoming.achievements),
    sessions: Array.isArray(incoming.sessions) ? incoming.sessions.slice(-CHINESE_INPUT_SESSION_LIMIT) : [],
    attemptEvents: Array.isArray(incoming.attemptEvents) ? incoming.attemptEvents.slice(-CHINESE_INPUT_EVENT_LIMIT) : [],
    schemaVersion: CHINESE_INPUT_PROGRESS_SCHEMA_VERSION,
  };
  return state;
}

export function appendBounded(items, item, limit) {
  return [...(Array.isArray(items) ? items : []), item].slice(-limit);
}
