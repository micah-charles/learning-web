# Chinese Input curriculum generator

The curriculum generator is the durable product. Lesson JSON files are disposable build artifacts.

Inputs:

- canonical facts in `learning-data/chinese-input/canonical/`;
- human decisions in `learning-data/chinese-input/reviewed/`;
- versioned rules in `learning-data/chinese-input/curriculum-policy/`.

Outputs live under `learning-data/chinese-input/generated-curriculum/<mode>/`. Every JSON document carries generated/do-not-edit markers, generator and policy versions, canonical version, deterministic timestamp and a digest of every source input.

Preview mode covers all currently eligible canonical characters using labelled, versioned proxies. Production mode uses reviewed records only and fails before writing output when its evidence gates are not satisfied.

The compiler emits stages, lessons, individual lesson files, root/character/word/prerequisite/review graphs, assessments, generic game nodes, 24 exercise templates, exercise pools, explanations, statistics, semantic audit data and entity-based progress migration metadata.

The generated count is data-driven. The current policy targets six new characters per core lesson and adds separate root, Quick, HK-extension, fluency and mastery layers.
