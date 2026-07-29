# Chinese Input curriculum policy

Human-maintained policy files are in `learning-data/chinese-input/curriculum-policy/`.

| File | Responsibility |
|---|---|
| `curriculum-policy.json` | versions, deterministic timestamp and review threshold |
| `root-progression.json` | 26 root identities, confusion pairs and spacing |
| `stage-policy.json` | stage and branch definitions |
| `lesson-policy.json` | lesson size, cognitive limits and clustering weights |
| `review-policy.json` | curriculum review opportunities |
| `assessment-policy.json` | checkpoints, pass and retry rules |
| `game-policy.json` | generic challenge and reward policy |
| `register-policy.json` | formal-core and HK-extension safety |
| `source-policy.json` | approved, pinned HK corpus sources |

Policy calculations are derived curriculum facts, never canonical facts. Change policy, regenerate, inspect the migration map and run the complete QA command. Do not edit generated lessons.

The approved HK source list is intentionally empty. Adding a source requires version, acquisition date, digest, licensing and redistribution status. Preview policy cannot alter or bypass this production gate.
