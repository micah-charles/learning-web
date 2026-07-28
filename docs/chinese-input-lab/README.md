# Chinese Input Lab

Chinese Input Lab（中文輸入實驗室）is a static-first FoxChild@Learn module for Cangjie 5 and Quick typing practice. Its canonical route is `/chinese-input`.

Implemented surfaces:

- dashboard and method selection;
- full 26-key visual root keyboard;
- root explorer and staged lessons;
- physical, pointer and touch input;
- deterministic guided typing and feedback;
- verified character detail, code sequence and Quick comparison;
- local mastery, review, collection and persistence;
- Cantonese browser TTS controls with a silent/Jyutping fallback;
- public route metadata, onboarding and feature rollout control.

The module is independent from Language Ladder because input-method code, review and keyboard state have different domain rules. It shares the app shell, progress bridge, speech helper, design tokens and QA infrastructure.
