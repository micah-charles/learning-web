# Speak & Shadow Lab Implementation Notes

## Existing Patterns Reused

- Text-to-speech: reused `speakText`, `stopSpeaking`, and `isSpeechSynthesisSupported` from `src/utils.js`; extended `speakText` to accept optional callbacks while preserving the existing voice-name argument.
- Speech recognition: reused `src/react/services/speechRecognitionService.js` instead of adding another Web Speech wrapper.
- Voice criteria: matched the existing Language Ladder / Reading voice practice threshold pattern of approximate similarity at `0.85`, with confidence guard at `0.6`.
- Tutor UI: kept this as a scripted local tutor panel rather than using the global FoxChild Tutor chat, because the lab needs deterministic phrase-by-phrase state.
- Cards and controls: reused `lw-card`, `lw-btn-*`, `lw-chip`, `LabeledSelect`, and the existing page layout classes.
- Storage: added `speakShadow` to `DEFAULT_STATE` and persisted via `ProgressContext.updateProgress`; no direct `localStorage` access in the page.
- Pack loading: existing Reading passage packs are loaded through `listPassageGroups()` and `loadPassagePack()` and converted into local sessions.
- Reading rendering: followed the Reading workspace pattern of a scrollable article panel plus a sticky side panel, with phrase spans replacing paragraph spans.
- Language metadata: centralized Speak & Shadow language options in `src/react/utils/speakShadowConfig.js` rather than duplicating locale codes in the page.
