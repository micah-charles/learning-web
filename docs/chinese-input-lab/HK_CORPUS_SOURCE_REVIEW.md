# Hong Kong corpus source review

Status: **source approval required**

The production curriculum must not begin its 2,500-record approval process until a versioned and legally usable Hong Kong evidence source is pinned. `curriculum-policy.json` therefore has an empty `approvedHongKongCorpusSources` list.

## Evaluated candidates

### Corpus of Chinese Written Language in Hong Kong

- Publisher: Centre for Research on Chinese Language and Education, The Education University of Hong Kong
- URL: https://ccwlhk.eduhk.hk/
- Scope: approximately 8.67 million characters from Hong Kong government press releases, Hong Kong Year Books and *Word Power*, covering 1997–2023.
- Strength: contemporary formal Hong Kong written Chinese with documented query-result CSV export and citation format.
- Current blocker: the public documentation describes downloading search results, but does not publish a versioned bulk snapshot, stable bulk API, explicit redistribution licence, or immutable checksum target suitable for this deterministic pipeline.
- Decision: candidate for formal-written-Chinese evidence; do not ingest or assign `hk_frequency_rank` yet.

### CUHK transregional character frequency survey

- Publisher: Research Centre for Humanities Computing, The Chinese University of Hong Kong
- URL: https://humanum.arts.cuhk.edu.hk/Lexis/chifreq/manual_e.html
- Scope: Hong Kong, Mainland China and Taiwan corpus units from the 1960s and 1980s–1990s.
- Strength: explicit Hong Kong character-frequency tables and regional comparison.
- Current blocker: older corpus period and no confirmed redistribution terms or pinned bulk snapshot in this review.
- Decision: useful secondary/historical evidence; not approved as the sole contemporary HK rank.

### Hong Kong Supplementary Character Set open data

- Publisher: Hong Kong Digital Policy Office
- URL: https://data.gov.hk/en-data/dataset/hk-dpo-dpo_hp-hong-kong-supplementary-character-set-related-information
- Strength: official machine-readable Hong Kong character, Cangjie and Cantonese metadata.
- Limitation: character-set inclusion evidence, not frequency evidence.
- Decision: suitable for a future HK typing-extension evidence layer, but never label it as corpus rank.

## Approval requirements

A source can be added to `approvedHongKongCorpusSources` only when the PR records:

1. publisher, corpus scope, collection dates and register;
2. stable acquisition URL or documented manual snapshot procedure;
3. version identifier, row/token counts and checksum;
4. licence and redistribution decision;
5. deterministic parser and anchor tests;
6. conflict policy against EDB, MOE and other HK sources;
7. whether the evidence represents formal writing, news, child text or written Cantonese.

Formal Hong Kong writing and written-Cantonese frequency are different evidence layers. Neither may silently substitute for the other.
