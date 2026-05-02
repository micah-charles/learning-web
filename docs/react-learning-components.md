# React Learning Components

> How the React layer works on top of the existing learning-web data layer.

---

## Architecture Overview

```
data/                      ← Shared with vanilla app
  generated/manifest.json  ← Master index (all packs)
  Packs/[name]/pack_unified.json
  core_unified.json
  PassagePacks/*/pack_unified.json

src/
  react/                   ← NEW React app (Vite, port 5173)
    App.jsx               ← Root component + routing
    main.jsx              ← React mount point
    index.html            ← React HTML entry
    components/learning/  ← 10 reusable UI components
    hooks/
      usePackLoader.js    ← Pack loading + normalisation
      useQuizEngine.js   ← Quiz state machine
    utils/
      packAdapters.js    ← Normalise unified items → common shape
      scoring.js          ← Pure scoring utilities
  data.js                 ← Existing data layer (unchanged)
  quiz.js                 ← Existing quiz logic (unchanged)
  main.js                 ← Vanilla app (unchanged)
```

Two apps serve simultaneously:
- **Vanilla app**: `python3 -m http.server 4173` → port 4173 (existing behaviour)
- **React app**: `npm run dev` → port 5173 (new React layer)

They share the same `data/` files. The vanilla app is unaffected.

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `QuizCard` | `components/learning/QuizCard.jsx` | MCQ question + options + feedback + progress |
| `AnswerButton` | `AnswerButton.jsx` | Individual option button with correct/wrong states |
| `FeedbackPanel` | `FeedbackPanel.jsx` | Correct/incorrect banner |
| `ProgressBar` | `ProgressBar.jsx` | Progress + score indicator |
| `Flashcard` | `Flashcard.jsx` | Front/back card, click to flip |
| `PackSelector` | `PackSelector.jsx` | Grid of pack cards |
| `PassageReader` | `PassageReader.jsx` | Passage + translation + comprehension questions |
| `ReviewPanel` | `ReviewPanel.jsx` | End-of-session summary with per-question results |
| `SequenceQuiz` | `SequenceQuiz.jsx` | Tap-to-swap sequence ordering game |
| `SortQuiz` | `SortQuiz.jsx` | Item pool + category zone sorting game |

---

## Hooks

### `usePackLoader`
```javascript
const { pack, loading, error, questions, reload } = usePackLoader({
  packId: "revision:ks3_geography_glaciation_1",  // load from manifest
  // OR
  url: "./data/Packs/my_pack/pack_unified.json",  // direct URL
  // OR
  rawPack: someRawObject,  // pass directly
  mode: "mcq",   // normalise for specific game mode
  count: 12,     // max questions
});
```
Loads, caches in `sessionStorage`, normalises via `packAdapters.js`, and returns `{pack, loading, error, questions}`.

### `useQuizEngine`
```javascript
const engine = useQuizEngine({
  questions: normalisedQuestions,  // array from packAdapters
  mode: "mcq",                    // or "typing", "flashcard", "sequence", "sort", "passage"
  count: 12,
  shuffleQ: true,
});
```
Returns full quiz state: `currentQuestion`, `selectedAnswer`, `showFeedback`, `score`, `answers`, `isFinished`, plus actions: `answerQuestion`, `nextQuestion`, `resetQuiz`, `flipCard`, `selectSequenceIndex`, `placeSortItem`, etc.

---

## Data Flow

```
manifest.json
  → usePackLoader({ packId })
      → find revision/builder/passage entry by runtime id
      → fetch(entry.unifiedPath)
          → normalisePack(raw)
              → groupByType(items)
                  → getQuestionsForMode(pack, mode)
                      → normalised questions[]
                          → useQuizEngine({ questions })
                              → React components render
```

---

## Adding a New Game Mode

**Step 1 — Define the question shape in `packAdapters.js`**
Add a case to `normaliseUnifiedItem()`:
```javascript
case "myNewType":
  return {
    id: item.id,
    type: "myNewMode",  // must match a case in getQuestionsForMode
    question: d.prompt || "",
    correctAnswer: d.answer || "",
    options: d.choices || [],
    // ... other fields
  };
```

**Step 2 — Add mode to `getQuestionsForMode`**
```javascript
case "myNewMode":
  questions = byType.myNewMode;
  break;
```

**Step 3 — Create a component**
```jsx
// components/learning/MyNewMode.jsx
export function MyNewMode({ question, buildState, onAction }) {
  // implement the interaction
}
```

**Step 4 — Wire in `App.jsx`**
```jsx
{mode === "myNewMode" && (
  <MyNewMode question={currentQuestion} buildState={buildState} onAction={...} />
)}
```

**Step 5 — Add to quiz engine if needed**
Extend `useQuizEngine` to handle new interaction state (e.g. `dragOrder`, `connectedPairs`).

---

## Adding a New Pack Adapter

Runtime React loading is unified-only. New source formats should be converted into
`pack_unified.json` during data generation, then handled by `normaliseUnifiedItem()`.
Do not add `vocabPath`, `jsonlPath`, or legacy JSONL fallbacks to `usePackLoader()`.

---

## Example Pack Items

### MCQ (vocab item)
```json
{
  "id": "vocab_0034",
  "type": "vocab",
  "level": "Y7",
  "topics": ["Glaciation"],
  "data": {
    "sourceWord": "firn",
    "targetWord": "compact granular snow before it becomes glacier ice",
    "gender": "n",
    "exampleSource": "Das Firn ist sehr dicht.",
    "exampleTarget": "The firn is very dense."
  }
}
```

### Sequence
```json
{
  "id": "seq_001",
  "type": "sequence",
  "level": "Y7",
  "data": {
    "title": "How a Glacier Forms",
    "instruction": "Put the glacier formation steps in the correct order.",
    "items": [
      "More snow falls than melts.",
      "Snow builds up.",
      "Snow becomes dense firn.",
      "Firn becomes glacier ice.",
      "The glacier moves downhill."
    ]
  }
}
```

### Flashcard
```json
{
  "id": "sb_001",
  "type": "sentenceBuilder",
  "level": "Y7",
  "data": {
    "prompt": "331BC",
    "answer": "The Macedonians defeat the Persians at Gaugamela",
    "tiles": ["The","Macedonians","defeat","the","Persians","at","Gaugamela"]
  }
}
```

### Passage
```json
{
  "id": "pass_001",
  "type": "passage",
  "level": "Y9",
  "data": {
    "sourceTitle": "Ferien in Frankfurt",
    "sourcePassage": "In den Sommerferien fahre ich immer zu meiner Oma...",
    "targetPassage": "In the summer holidays I always go to my grandma's...",
    "speechLanguage": "de-DE",
    "questions": [
      {
        "id": "q1",
        "questionType": "open",
        "question": "What does Laura do during the summer?",
        "modelAnswer": "She goes to her grandma's in Frankfurt.",
        "acceptedKeywords": ["grandma", "Frankfurt", "Oma"]
      }
    ]
  }
}
```

---

## Running the React App

```bash
# Terminal 1 — vanilla app (existing)
cd /Volumes/ExtremePro/project/learning-web
python3 -m http.server 4173

# Terminal 2 — React app
cd /Volumes/ExtremePro/project/learning-web
npm run dev
```

Open: http://localhost:5173

Production build (no dev server):
```bash
npm run build   # outputs to dist/
npm run preview # serve the build locally
```

---

## Manual Test Checklist

- [ ] App starts — React app at :5173 with no console errors
- [ ] Pack selector shows revision packs from manifest
- [ ] Selecting a pack loads its unified data
- [ ] MCQ mode: questions display, options work, feedback shows, score updates
- [ ] Flashcard mode: front/back flip works, Skip/Next navigate
- [ ] Sequence mode: tap-to-swap works, Check order responds correctly
- [ ] Sort mode: place items into categories, remove back to pool
- [ ] Review screen shows at end of session
- [ ] "Try again" resets the quiz
- [ ] No console errors
- [ ] Vanilla app at :4173 still works independently

---

## TODOs / Future Work

- [ ] Wire gap-fill (typing) mode to `QuizCard` + text input
- [x] Connect `PassageReader` to passage mode in the quiz engine
- [ ] Persist React quiz session to localStorage (reuse `storage.js` logic)
- [ ] Add a routing layer (e.g. react-router) for direct URL navigation
- [ ] Add mode selector UI (MCQ / Flashcard / Sequence / Sort tabs within Quiz page)
- [ ] Migrate one tab from vanilla `main.js` to React, verifying no regressions
