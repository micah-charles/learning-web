import assert from "node:assert/strict";

const store = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    clear() {
      store.clear();
    },
  },
};

const {
  getResumeRecommendation,
  loadStoredState,
  recordLessonCompletion,
  recordLessonStart,
  saveStoredState,
} = await import("../src/storage.js");

const catalog = {
  packs: [
    {
      id: "test-pack",
      stages: [
        {
          id: "stage-1",
          lessons: [
            { id: "lesson-1", label: "Lesson 1", path: "./lesson-1.json" },
            { id: "lesson-2", label: "Lesson 2", path: "./lesson-2.json" },
          ],
        },
      ],
    },
  ],
};

{
  window.localStorage.clear();
  let state = loadStoredState();
  recordLessonStart(state, "lesson-1", "de");
  saveStoredState(state);

  state = loadStoredState();
  recordLessonCompletion(state, "lesson-1", "de", 100);
  saveStoredState(state);

  const recommendation = getResumeRecommendation(loadStoredState(), catalog);
  assert.equal(recommendation.lesson.id, "lesson-2");
  assert.deepEqual(recommendation.skippedLessons, []);
}

{
  window.localStorage.clear();
  let state = loadStoredState();
  recordLessonStart(state, "lesson-1", "de");
  saveStoredState(state);

  state = loadStoredState();
  recordLessonCompletion(state, "lesson-1", "de", 100);
  state.prefs.languageLadder.langs.de.currentLessonId = "lesson-2";
  state.prefs.languageLadder.currentLessonId = "de-lesson-2";
  saveStoredState(state);

  const recommendation = getResumeRecommendation(loadStoredState(), catalog);
  assert.equal(recommendation.lesson.id, "lesson-2");
  assert.deepEqual(recommendation.skippedLessons, []);
}
