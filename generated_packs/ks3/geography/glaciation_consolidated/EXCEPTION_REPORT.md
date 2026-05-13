# Exception Report: KS3 Geography Glaciation — Consolidated Pack (v2)

**Consolidation date:** 2026-05-12  
**Consolidated by:** AI-assisted review (Claude)

---

## Sources

| Pack | Items | Vocab | Fill-blank | Sequence | CategorySort |
|---|---|---|---|---|---|
| `ks3_geography_glaciation/` | 46 | 26 | 14 | 3 | 3 |
| `ks3_geography_glaciation_2/` | 34 | 20 | 10 | 2 | 2 |
| `ks3_geography_glaciation_2_revise/` | 31 | 14 | 12 | 3 | 2 |
| **Total raw** | **111** | **60** | **36** | **8** | **7** |

**Passages:**
| Pack | Passages |
|---|---|
| `ks3_geography_glaciation/passage_unified.json` | 4 (formation, erosion, deposition, management) |
| `ks3_geography_glaciation_2/passage_unified.json` | 4 (moraine detail, drumlins+erratics, why manage, conflict solutions) |
| `ks3_geography_glaciation_2_revise/passage_unified.json` | 4 (moraine/retreat, drumlin form, erratics, managing fragile landscapes) |

---

## Final Result

| File | Items | Notes |
|---|---|---|
| `pack_unified.json` | **82 items** | 41 vocab · 27 fill-blank · 7 sequence · 7 categorySort |
| `passage_unified.json` | **7 passages** | 28 questions total |

---

## Changes from Raw to Consolidated

### A. Items removed (duplicates)

#### Vocab duplicates (19 removed from raw — first occurrence kept)

| Skipped item | Source | Kept item | Key term |
|---|---|---|---|
| `ks3_geography_glaciation_2_vocab_002` | pack2 | `ks3_glaciation_cons_vocab_019` | moraine |
| `ks3_geography_glaciation_2_vocab_003` | pack2 | `ks3_glaciation_cons_vocab_020` | terminal moraine |
| `ks3_geography_glaciation_2_vocab_004` | pack2 | `ks3_glaciation_cons_vocab_021` | lateral moraine |
| `ks3_geography_glaciation_2_vocab_005` | pack2 | `ks3_glaciation_cons_vocab_022` | medial moraine |
| `ks3_geography_glaciation_2_vocab_007` | pack2 | `ks3_glaciation_cons_vocab_023` | drumlin |
| `ks3_geography_glaciation_2_vocab_010` | pack2 | `ks3_glaciation_cons_vocab_024` | erratic |
| `ks3_geography_glaciation_2_vocab_012` | pack2 | `ks3_glaciation_cons_vocab_025` | honeypot site |
| `ks3_geography_glaciation_2_vocab_013` | pack2 | `ks3_glaciation_cons_vocab_026` | sustainable tourism |
| `ks3_glac2_vocab_001` | pack3 | `ks3_glaciation_cons_vocab_019` | moraine |
| `ks3_glac2_vocab_002` | pack3 | `ks3_glaciation_cons_vocab_020` | terminal moraine |
| `ks3_glac2_vocab_003` | pack3 | `ks3_glaciation_cons_vocab_021` | lateral moraine |
| `ks3_glac2_vocab_004` | pack3 | `ks3_glaciation_cons_vocab_022` | medial moraine |
| `ks3_glac2_vocab_005` | pack3 | `ks3_glaciation_cons_vocab_023` | drumlin |
| `ks3_glac2_vocab_006` | pack3 | `ks3_glaciation_cons_vocab_029` | drumlin field |
| `ks3_glac2_vocab_007` | pack3 | `ks3_glaciation_cons_vocab_024` | erratic |
| `ks3_glac2_vocab_009` | pack3 | `ks3_glaciation_cons_vocab_025` | honeypot site |
| `ks3_glac2_vocab_010` | pack3 | `ks3_glaciation_cons_vocab_026` | sustainable tourism |
| `ks3_glac2_vocab_012` | pack3 | `ks3_glaciation_cons_vocab_032` | conservationist |
| `ks3_glac2_vocab_013` | pack3 | `ks3_glaciation_cons_vocab_036` | erosion |

#### Fill-blank duplicates (9 removed)

| Removed item | Reason | Kept item |
|---|---|---|
| `ks3_glaciation_cons_fill_016` | Near-duplicate of fill_011 (both: terminal moraine) | `ks3_glaciation_cons_fill_011` |
| `ks3_glaciation_cons_fill_025` | Third terminal moraine question, same concept | `ks3_glaciation_cons_fill_011` |
| `ks3_glaciation_cons_fill_020` | Near-duplicate of fill_012 (both: honeypot site) | `ks3_glaciation_cons_fill_012` |
| `ks3_glaciation_cons_fill_033` | Third honeypot site question, same concept | `ks3_glaciation_cons_fill_012` |
| `ks3_glaciation_cons_fill_021` | Near-duplicate of fill_013 (both: sustainable tourism) | `ks3_glaciation_cons_fill_013` |
| `ks3_glaciation_cons_fill_034` | Third sustainable tourism question, same concept | `ks3_glaciation_cons_fill_013` |
| `ks3_glaciation_cons_fill_030` | Unverified numerical claim (drumlin width ~500 m) | — |
| `ks3_glaciation_cons_fill_031` | Unverified numerical claim (drumlin length 1–2 km) | — |
| `ks3_geography_glaciation_2_gap_001`* | Near-duplicate of fill_015 (both: "material deposited = moraine") | `ks3_glaciation_cons_fill_015` |

*Removed at initial merge stage.

#### Sequence duplicates (1 removed)

| Removed item | Reason | Kept items |
|---|---|---|
| `ks3_glaciation_cons_seq_006` | Near-identical to seq_003 (same 4 steps, one word difference) | `ks3_glaciation_cons_seq_003` (4-step), `ks3_glaciation_cons_seq_004` (6-step) |

---

### B. Data quality fixes applied

#### Critical: Broken `targetWord` fields (vocab_027–038)

**Root cause:** Pack 2 used a `translations` schema (term → term name) rather than the `sourceWord`/`targetWord` definition schema used in Pack 1 and Pack 3. The automated consolidation incorrectly copied the term name as its own definition.

**Fix applied:** All 12 items rewritten with proper definitions derived from the `examples` field in the source pack and cross-referenced with Pack 3 definitions.

| Item ID | Term | Was (broken) | Now (fixed) |
|---|---|---|---|
| vocab_027 | deposition | "deposition" | "when a glacier loses energy and drops the material it was carrying" |
| vocab_028 | ground moraine | "ground moraine" | "a layer of deposited material spread across the valley floor as the glacier retreats" |
| vocab_029 | drumlin field | "drumlin field" | "an area where many drumlins are found together, sometimes called a 'basket of eggs'" |
| vocab_030 | streamlining | "streamlining" | "the shaping of deposited material by moving ice into a smooth, tapered form pointing in the direction of flow" |
| vocab_031 | valley floor | "valley floor" | "the flat bottom of a glacial valley where deposited material may collect" |
| vocab_032 | conservationist | "conservationist" | "a person who works to conserve landscapes, habitats and wildlife for future generations" |
| vocab_033 | farmer | "farmer" | "someone who works the land; glacial valleys are often used for grazing livestock" |
| vocab_034 | visitor centre | "visitor centre" | "a building where tourists can learn about the environment and how to protect it" |
| vocab_035 | overcrowding | "overcrowding" | "when too many visitors use the same area at once, causing damage to paths and vegetation" |
| vocab_036 | erosion | "erosion" | "the wearing away and removal of soil or rock; tourist footfall can increase erosion on footpaths" |
| vocab_037 | speed limit | "speed limit" | "a rule limiting vehicle or boat speed; used on glacial lakes to reduce noise and water pollution" |
| vocab_038 | footpath diversion | "footpath diversion" | "a management strategy that moves walkers off a damaged route to allow it time to recover" |

---

### C. Items kept despite near-duplication (by design)

#### Three "How a Drumlin Forms" sequences (all kept)

| Item | Steps | Rationale for keeping |
|---|---|---|
| `ks3_glaciation_cons_seq_003` | 4 | Focused, accessible version |
| `ks3_glaciation_cons_seq_004` | 6 | Most complete / detailed version |

The third sequence (`seq_006`) was removed as it was near-identical to seq_003.

#### Three "Tourist Problem / Solution" sorts (all kept)

| Item | Title | Categories | Pairs |
|---|---|---|---|
| `ks3_glaciation_cons_sort_003` | Tourist Impact or Management Solution? | Impact or Problem / Management Solution | 6 |
| `ks3_glaciation_cons_sort_005` | Tourist Problem or Solution? | Problem / Solution | 8 |
| `ks3_glaciation_cons_sort_007` | Problem or Solution? | Tourist problem / Management solution | 6 |

Kept all three because they cover different pair sets and offer varied difficulty levels for differentiated practice.

#### Two "Types of Moraine" sorts (all kept)

| Item | Title | Categories |
|---|---|---|
| `ks3_glaciation_cons_sort_004` | Sort the Moraine Types | Terminal / Lateral / Medial / Ground (4 categories) |
| `ks3_glaciation_cons_sort_006` | Types of Moraine | Terminal / Lateral / Medial (3 categories) |

Different because sort_004 includes ground moraine as a fourth category.

---

## Passage Consolidation

7 passages selected from 12 across 3 source packs. Pack 3 passages excluded as Pack 1 and Pack 2 provided superior coverage of the same topics with richer question sets.

| # | Passage title | Source | Topic |
|---|---|---|---|
| 001 | How Glaciers Form | pack1 | Formation |
| 002 | How Glaciers Erode the Landscape | pack1 | Erosion |
| 003 | Depositional Landforms | pack1 | Deposition (overview) |
| 004 | How Moraine Is Deposited | pack2 | Moraine (detailed) |
| 005 | Drumlins and Erratics | pack2 | Drumlins + erratics |
| 006 | Managing Glacial Landscapes | pack1 | Tourism management (overview) |
| 007 | Solving Conflict in Glacial Landscapes | pack2 | Management solutions (detailed) |

Passages 003 and 004 cover overlapping topics (depositional landforms) but serve different learning purposes: 003 gives a broad overview of all deposition features; 004 focuses exclusively on moraine types in more detail.

---

## Remaining quality flags (not fixed — for human review)

| Item | Issue | Recommendation |
|---|---|---|
| `ks3_glaciation_cons_vocab_033` (farmer) | Definition is functional rather than conceptual; may seem trivial to students | Consider revising to focus on the farmer's role in the glacial tourism conflict |
| `ks3_glaciation_cons_seq_005` | "Managing Tourist Pressure" sequence — steps 3–4 are slightly repetitive | Review for redundancy |
| `ks3_glaciation_cons_sort_003` & `sort_007` | Both have 6 pairs and similar content but different category labels | Could reduce to one if screen space is limited |
| Pack 3 fill_030/031 (removed) | Claimed specific drumlin dimensions (500 m wide, 1–2 km long) without an explicit source | Do not reinstate without verified reference |
| Pack 2 seq_002 | "Managing Tourist Pressure" sequence — step ordering places "footpath diversion" before "conflict arises"; possible logical inversion | Review step order if reinstating |

---

## Data quality checks

- All 82 items: valid JSON ✓
- No duplicate item IDs ✓
- All vocab items: `sourceWord` ≠ `targetWord` (fixed) ✓
- All fill-blank items: `sentence` + `answer` present ✓
- All sequence items: `title`, `instruction`, `items[]`, `shuffle` present ✓
- All categorySort items: `title`, `instruction`, `categories[]`, `pairs[]` present ✓
- All 7 passages: `sourceTitle`, `sourcePassage`, `questions[]` present ✓
- Pack-level metadata: `subject`, `level`, `topics`, `tags`, `description` added ✓
