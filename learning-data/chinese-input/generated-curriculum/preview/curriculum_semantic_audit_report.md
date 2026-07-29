# Chinese Input curriculum semantic audit

Status: PASS_WITH_PROVISIONAL_WARNINGS

## Golden regressions

- rootIntroduction: pass
- repeatedIdsMany: pass
- saySourceGlyph: pass
- polyphonicCharacter: u5927
- complexCodeCharacter: u662f
- writtenCantonesePlaceholder: pass
- quickCollision: pass
- migration: pass

## Provisional warnings

- All preview character placements use derived MOE/EDB/Cangjie proxies and are not approved curriculum decisions.
- Learner definitions remain hidden or labelled pending review.
- Register claims remain hidden pending review.
- Context-sensitive word pronunciation is not generated.
- Written Cantonese and HK typing extension remain structural placeholders pending an approved lexical source.
- 110 component records require learner-visible SVG fallbacks.
- No approved independent Hong Kong frequency source is configured.
