# FoxChild Tutor — Phase 1 Documentation

## Overview

The **FoxChild Tutor** is a local-first, text-based study assistant that lives inside Learning Web. It helps students with the **current learning content only** — quiz questions, vocabulary, reading passages, and Study Book notes.

> **Key principle:** No external AI APIs, no backend, no Live2D, no neural TTS. Everything runs in the browser using deterministic retrieval and template-based responses.

---

## What the Tutor Does

| Capability | Description |
|------------|-------------|
| **Quiz hints** | Gives contextual hints for the current quiz question (never the direct answer first) |
| **Quiz explanations** | After student tries, explains the correct answer with reasoning |
| **Vocabulary help** | Shows word meaning, gender, part of speech, example sentences from current pack |
| **Reading comprehension** | Quotes short evidence from the current passage; asks student to explain in own words |
| **Study Book search** | Searches and explains content from the open Study Book markdown |
| **Grammar guidance** | Explains German cases, tenses, PEE writing structure, etc. |
| **Read aloud** | Uses browser `speechSynthesis` for TTS (per-message or always-on) |
| **Privacy-first** | Zero data leaves the browser; no API keys, no network calls for AI |

---

## What the Tutor Does NOT Do

- ❌ Answer general knowledge questions (weather, news, celebrities, etc.)
- ❌ Act as a general chatbot or conversational AI
- ❌ Give direct quiz answers without the student attempting first
- ❌ Send any user data to external servers
- ❌ Use Live2D avatars (Phase 4)
- ❌ Use neural TTS or external voice APIs (Phase 1 uses browser TTS only)
- ❌ Require internet connection after initial load (fully offline-capable)

---

## Privacy Notes

- **All processing is local** — retrieval, scoring, and response generation happen entirely in the browser
- **No telemetry** — no analytics, no tracking, no data collection
- **Uses existing storage** — preferences saved via `storage.js` (`loadStoredState`/`saveStoredState`), never direct `localStorage` access
- **SpeechSynthesis** — browser built-in TTS; voice data may be processed by the browser vendor (Chrome → Google) per standard Web Speech API behavior
- **No cookies, no localStorage keys beyond the app's existing `learningGermanWeb.v1`**

---

## How Retrieval Works (Phase 1)

1. **Tokenization** — User query is split into lowercase tokens; stop words removed
2. **Multi-source search** — Concurrently searches:
   - Current quiz question (prompt, answer, hint, options, explanation)
   - Current reading passage (source text + translation)
   - Current reading questions (question, model answer, options)
   - Study Book HTML content (tags stripped)
3. **Scoring** — Simple token overlap scoring (0–1), with phrase-match bonus
4. **Snippet extraction** — Returns top 3–8 relevant snippets with ~200 chars context
5. **Response templating** — Deterministic templates based on query intent:
   - `hint` → quiz hint templates
   - `explanation` → full answer + reasoning
   - `vocabulary` → word card format
   - `reading` → evidence quote + "explain in your own words"
   - `grammar` → structured grammar explanations
   - `refusal` → "I can only help with the current pack or study book"

**No LLM, no embeddings, no vector database.** Pure deterministic string matching.

---

## Architecture

```
src/features/tutor/
├── TutorProvider.jsx      # React Context — state, prefs, integration hooks
├── TutorWidget.jsx        # Mount point (Button + Panel)
├── TutorButton.jsx        # Floating action button (bottom-right)
├── TutorPanel.jsx         # Chat panel (messages, input, controls)
├── tutorEngine.js         # Response generation (templates, intent routing)
├── tutorRetrieval.js      # Tokenization, scoring, snippet extraction
├── tutorSpeech.js         # Browser SpeechSynthesis wrapper
├── tutorStorage.js        # Preferences via existing storage.js
└── tutor.css              # Styles matching Learning Web design system
```

### Integration Points

- **TutorProvider** wraps `AppContent` in `App.jsx` (same level as `StudyBookProvider`)
- **TutorWidget** renders once at App level (like `StudyBookDrawer`)
- **QuizPage** → `setQuizSession(session)` + `setDataset(dataset)`
- **ReadingPage** → `setReadingPassage(passage, targetText)` + `setDataset(group)`

---

## Enabling / Disabling

### Feature Flag (development default: enabled)

Set in `tutorStorage.js` `DEFAULT_TUTOR_PREFS`:

```javascript
enabled: true,           // master toggle
speechMode: "toggle",    // "none" | "toggle" | "always"
openOnLoad: false,       // start open on page load
```

### Runtime Toggle

- **UI:** Click the 🦊 floating button → panel opens → header has speech mode toggle (🔇/🔊/🔈)
- **Code:** `useTutor().toggleEnabled()` / `toggleSpeechMode()`
- **Persistence:** Saved to `storage.js` under `prefs.tutor`

### Disable Completely (Production)

In `TutorProvider.jsx`, change initial load:

```javascript
// Force disabled
const [state, setState] = useState({ ...INITIAL_STATE, enabled: false });
```

Or remove `<TutorProvider>` / `<TutorWidget>` from `App.jsx`.

---

## Speech / Read Aloud

| Mode | Behavior |
|------|----------|
| `none` | No auto-speak; no read-aloud buttons |
| `toggle` (default) | Per-message 🔊 button on tutor messages; click to hear |
| `always` | Every tutor response auto-spoken via `speechSynthesis` |

**Voices:** Prefers female/natural voices for the detected language (falls back to first available).

---

## UI Behavior

- **Desktop:** Panel opens above FAB (360×520px), FAB stays visible
- **Mobile:** Full-width bottom sheet (70vh), semi-transparent scrim backdrop
- **Accessibility:** `aria-labels`, `role="dialog"`, `Escape` closes, `Enter` sends, focus management
- **Animation:** Slide-up panel, fade-in messages, typing indicator while loading

---

## Future Roadmap

| Phase | Feature | Notes |
|-------|---------|-------|
| **2** | Voice input | Browser `webkitSpeechRecognition` (Chrome only) — speech-to-text for queries |
| **3** | Local browser LLM | WebLLM / Transformers.js — optional, ~1GB model download, zero keys, runs in WebGPU |
| **4** | Avatar / Live2D skin | Swappable character (like ai-avatar-bot) — purely visual, engine unchanged |

**Phase 2+ will remain:**
- Local-first (no external API calls by default)
- Privacy-preserving (user controls what data is sent, if anything)
- Configurable (feature flags for each capability)

---

## Testing Checklist

| Test | Expected |
|------|----------|
| `npm run build` | ✅ Passes (no TypeScript/ESLint errors) |
| Open tutor (click 🦊) | Panel slides up, welcome message shown |
| Ask about current vocab | Shows word card with meaning, example |
| Ask about current quiz question | Gives hint (not answer) |
| Ask again for explanation | Gives full answer + reasoning |
| Ask unrelated question | "I can only help with the current pack or study book." |
| Click 🔊 on tutor message | Reads aloud via browser TTS |
| Toggle speech mode (🔇→🔊→🔈) | Cycles modes, persists in storage |
| Mobile layout (<480px) | Bottom sheet, scrim, no horizontal overflow |
| Switch tabs (Quiz → Reading → Vocab) | Tutor context updates, panel persists |
| Close panel (✕ or Escape) | Panel closes, FAB remains |
| Clear chat (🗑️) | Messages reset, hint flag resets |

---

## File Reference

| File | Purpose |
|------|---------|
| `src/features/tutor/TutorProvider.jsx` | Context, state, integration hooks |
| `src/features/tutor/TutorWidget.jsx` | Mount point (Button + Panel) |
| `src/features/tutor/TutorButton.jsx` | Floating action button |
| `src/features/tutor/TutorPanel.jsx` | Chat panel UI |
| `src/features/tutor/tutorEngine.js` | Response templates, intent detection |
| `src/features/tutor/tutorRetrieval.js` | Tokenization, scoring, snippets |
| `src/features/tutor/tutorSpeech.js` | `speechSynthesis` wrapper |
| `src/features/tutor/tutorStorage.js` | Prefs via `storage.js` |
| `src/features/tutor/tutor.css` | Styles (CSS custom properties) |
| `docs/foxchild_tutor.md` | This file |

---

## Extending the Tutor

### Add a New Response Type

1. Add to `ResponseType` in `tutorEngine.js`
2. Add intent pattern (e.g., `WRITING_PATTERNS`)
3. Add `generateWritingResponse()` function
4. Add routing in `generateTutorResponse()`

### Add a New Content Source

1. Add source to `retrieveContent()` in `tutorRetrieval.js`
2. Pass source from relevant page/component via `TutorProvider` setter
3. Engine will automatically use it

### Customize Hints/Explanations

Edit the template functions in `tutorEngine.js`:
- `generateQuizHint()`
- `generateQuizExplanation()`
- `generateVocabResponse()`
- `generateReadingResponse()`
- `generateGrammarResponse()`

---

*Generated as part of FoxChild Tutor Phase 1 — Local, private, deterministic study assistance.*