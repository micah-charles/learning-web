# Geography Study Book word targets

Planning ranges for each learner-facing guide. Targets are based on the scope of the England KS3 programme and AQA GCSE 8035, with larger allowances for chapters that require detailed case studies and shorter allowances for overview and cross-cutting skills chapters.

Counts use whitespace-separated Markdown tokens (the same convention as `wc -w`), including headings, tables and vocabulary. The expansion goal is useful explanation, sourced place examples, worked map/data reading and retrieval practice; it is not filler.

The 18 existing US Middle School Geography books range from 6,980 to 9,958 words, with a median of 8,162 and mean of 8,309. That supports an approximately 8–10k baseline for most KS3 guides. England KS3 lists required themes without prescribing one national chapter order ([DfE programme](https://www.gov.uk/government/publications/national-curriculum-in-england-geography-programmes-of-study/national-curriculum-in-england-geography-programmes-of-study)). AQA divides GCSE Geography into four units, assesses them across three papers weighted 35%, 35% and 30%, and distinguishes broad case studies from more focused examples ([AQA specification](https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/subject-content), [assessment overview](https://www.aqa.org.uk/subjects/geography/gcse/geography-8035/specification/specification-at-a-glance)). Case-study chapters therefore get more space; overview and skills chapters get less to avoid repeating the full course.

## England KS3

| Guide | Current words | Target range | Progress |
|---|---:|---:|---|
| 1. World locations and connected places | 10,993 | 9,000–11,000 | Within target |
| 2. The geography of the United Kingdom | 6,230 | 5,000–7,000 | Within target |
| 3. Geological time, rocks, weathering and soils | 8,795 | 8,000–10,000 | Within target |
| 4. Plate tectonics and tectonic hazards | 9,154 | 9,000–11,000 | Within target |
| 5. Weather, climate and climate change | 9,236 | 9,000–11,000 | Within target |
| 6. Glaciation and changing landscapes | 9,335 | 8,000–10,000 | Within target |
| 7. Hydrology, the water cycle and water resources | 8,671 | 8,000–10,000 | Within target |
| 8. Rivers and river landscapes | 8,432 | 8,000–10,000 | Within target |
| 9. Coasts and coastal change | 8,394 | 8,000–10,000 | Within target |
| 10. Ecosystems, biomes and interdependence | 9,075 | 8,000–10,000 | Within target |
| 11. Population, migration and urbanisation | 9,458 | 9,000–11,000 | Within target |
| 12. Settlements, land use and urban change | 8,840 | 8,000–10,000 | Within target |
| 13. International development and globalisation | 10,305 | 9,000–11,000 | Within target |
| 14. Economic activity, trade and natural resources | 9,328 | 9,000–11,000 | Within target |
| 15. Geographical skills and fieldwork | 10,384 | 9,000–11,000 | Within target |

**England KS3 total:** current 136,630; estimated target 124,000–154,000 words.

## AQA GCSE Geography 8035

| Guide | Current words | Target range | Progress |
|---|---:|---:|---|
| 1. Natural hazards and risk | 7,166 | 6,000–8,000 | Within target |
| 2. Tectonic hazards | 11,983 | 11,000–14,000 | Within target |
| 3. Weather hazards | 12,249 | 10,000–13,000 | Within target |
| 4. Climate change | 9,988 | 8,000–10,000 | Within target |
| 5. Ecosystems | 8,920 | 7,000–9,000 | Within target |
| 6. Tropical rainforests | 9,979 | 9,000–12,000 | Within target |
| 7. Hot deserts — school option | 9,429 | 9,000–12,000 | Within target |
| 8. Cold environments — school option | 9,037 | 9,000–12,000 | Within target |
| 9. Physical landscapes in the UK | 5,085 | 5,000–7,000 | Within target |
| 10. Coastal landscapes in the UK — school option | 11,120 | 11,000–14,000 | Within target |
| 11. River landscapes in the UK — school option | 11,039 | 11,000–14,000 | Within target |
| 12. Glaciated landscapes in the UK — school option | 11,009 | 11,000–14,000 | Within target |
| 13. Urban issues and challenges | 10,115 | 10,000–13,000 | Within target |
| 14. The changing economic world | 11,049 | 11,000–14,000 | Within target |
| 15. Resource management: food, water and energy overview | 5,014 | 5,000–7,000 | Within target |
| 16. Food — school option | 8,046 | 8,000–10,000 | Within target |
| 17. Water — school option | 8,051 | 8,000–10,000 | Within target |
| 18. Energy — school option | 8,085 | 8,000–10,000 | Within target |
| 19. Issue evaluation | 6,090 | 6,000–8,000 | Within target |
| 20. Fieldwork and geographical enquiry | 8,199 | 8,000–10,000 | Within target |
| 21. Geographical skills | 7,323 | 7,000–9,000 | Within target |

**AQA GCSE 8035 total:** current 188,976; estimated target 178,000–230,000 words.

**Combined target:** 302,000–384,000 words across 36 England KS3 and AQA GCSE guides. The current combined draft length is 325,606 words.

## Completion status

All 15 England KS3 and 21 AQA GCSE 8035 guides have been expanded. Every guide is within its planned word range; the totals above are recalculated from the learner-facing Markdown each time this report is generated.

The source framework and prompt file remain available for future corrections or curriculum updates. Run `npm run validate:geography-studybooks` after editing content. Run `npm run generate:geography-studybooks` without `--force` to refresh registration, targets and the image queue while preserving enriched notes. The `--force` flag replaces existing notes with brief framework drafts and must not be used to refresh completed content.

AQA choice chapters remain optional school routes: students normally study either hot deserts or cold environments, two of the three UK landscape options, and one of food, water or energy. The library contains every option so teachers can select their route.
