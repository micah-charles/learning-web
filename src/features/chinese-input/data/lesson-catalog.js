import { STATIC_CHINESE_INPUT_LESSONS } from "./chinese-input-lessons.generated.js";

export const CHINESE_INPUT_LESSONS = STATIC_CHINESE_INPUT_LESSONS.length
  ? STATIC_CHINESE_INPUT_LESSONS
  : [
      {
        id: "cj-orientation-01",
        method: "cangjie",
        stage: 1,
        order: 1,
        title: { en: "Keyboard tour", zhHant: "鍵盤導覽" },
        introducedKeys: ["A", "S", "D", "F"],
        reviewedKeys: [],
        activeKeys: ["A", "S", "D", "F"],
        characterIds: ["u65e5", "u5c38", "u6728", "u706b"],
        activityMix: { keyboardExplore: 4, rootRecognition: 4, guidedTyping: 4, characterBuild: 0 },
        passCriteria: { minimumAccuracy: 0.75, minimumQuestions: 8 },
        prerequisites: [],
        estimatedMinutes: 5,
        accessibilityNotes: "All activities support pointer, touch and physical keyboard input.",
      },
    ];

export function getLessonById(lessonId) {
  return CHINESE_INPUT_LESSONS.find((lesson) => lesson.id === lessonId) || null;
}

export function lessonsForMethod(method) {
  return CHINESE_INPUT_LESSONS.filter((lesson) => lesson.method === method);
}
