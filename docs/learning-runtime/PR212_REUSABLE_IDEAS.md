# PR #212 reusable ideas

PR #212 was the design-exploration branch for the FoxChild Learning Runtime. Its implementation ideas are now carried by PR #211, the platform source of truth, and this note records what should remain reusable after PR #212 is closed.

## Ideas retained

- A deterministic Learning Director ranks generic candidates from learner evidence and an explicit intent. It recommends a next action without locking other actions.
- Session plans are immutable, content-revisioned contracts. Activities consume a plan at the boundary instead of rebuilding lesson logic inside each screen.
- Checkpoints persist the world, plan identity, content revision, cursor, and timestamp. Incompatible content is rejected rather than resumed against changed content.
- The Floating Flower is a reusable, keyboard-accessible module navigator. Its position is learner-owned state and its petals are action destinations, not route replacements.
- World UI is a composition layer: Adventure Board, HUD, overlays, journey path, review shelves, arena frame, museum, and Knowledge World can be reused by another subject adapter.
- Domain adapters own subject nouns, evidence extraction, challenge prompts, and evaluator references. The generic runtime must never invent Chinese roots, Cangjie codes, or another module's grading rules.
- QA should verify both generic contracts and a real adapter: recommendation determinism, immutable plans, checkpoint compatibility, mobile overflow, Flower keyboard/pointer interaction, and one complete activity launch.

## Ideas deliberately not carried forward

- A dashboard made of permanent destination buildings or numbered locks. The world remains one navigable place and readiness is advisory.
- A second module-specific navigation bar. The Flower owns in-world navigation while the FoxChild app bar continues to switch products.
- Runtime fallback to a reduced seed dataset. Generated curriculum validation is fail-closed and the Chinese adapter is the only place that knows its canonical data.

## Ownership rule

Future modules should add an adapter under `src/features/<module>/runtime/`, register activity capabilities, and reuse `src/learning-runtime/`. They should not fork the Director, checkpoint schema, Flower, or overlay primitives.
