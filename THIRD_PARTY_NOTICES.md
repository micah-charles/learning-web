# Third-Party Notices

Learning Web is a local-first browser learning app. This file records third-party projects that were used as architectural references or dependencies for feature work.

## Speak & Shadow Browser Speech References

Project: react-speech-recognition
Source: https://github.com/JamesBrill/react-speech-recognition
Licence: MIT
Used as: Architectural reference for hook-based speech recognition state, microphone availability handling, transcript reset, and browser support checks. No source code copied.
Files affected:
- src/react/services/speechRecognitionService.js
- src/react/hooks/useSpeechRecognitionAttempt.js
- src/react/pages/SpeakShadowPage.jsx
Notes: Learning Web keeps its own raw Web Speech API wrapper because Speak & Shadow needs per-attempt language selection, alternatives, and confidence values for scoring.

Project: MDN Web Speech API documentation
Source: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
Licence: Creative Commons Attribution-ShareAlike 2.5 or later for documentation content, as documented by MDN
Used as: API reference for SpeechRecognition lifecycle fields and events including `continuous`, `interimResults`, `maxAlternatives`, `onresult`, `onerror`, and `onend`. No documentation text copied into app source.
Files affected:
- src/react/services/speechRecognitionService.js
Notes: Browser support remains limited; Chrome and Edge are the primary target browsers for speech recognition.

Project: whisper-web
Source: https://github.com/xenova/whisper-web
Licence: MIT
Used as: Future reference for optional browser-based Whisper ASR with Transformers.js. Not included in this MVP.
Files affected: none
Notes: Do not bundle model files unless licence, bundle size, first-load time, device performance, and privacy implications are reviewed.

Project: Transformers.js examples
Source: https://github.com/huggingface/transformers.js-examples
Licence: Apache-2.0
Used as: Future reference for browser ML demos and optional ASR adapter structure. Not included in this MVP.
Files affected: none
Notes: The current Speak & Shadow implementation continues to use the browser Web Speech API and manual fallback.
