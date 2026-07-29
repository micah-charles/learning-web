export const DATASET_VERSION = "1.3.0";
export const SCHEMA_VERSION = 4;
export const GENERATED_AT = "2026-07-29T00:00:00.000Z";

export const EDB_CANONICAL_GLYPH_ALIASES = Object.freeze({
  "説": Object.freeze({
    canonical: "說",
    method: "reviewed-cross-source-glyph-alias-v1",
    evidence: Object.freeze([
      "unicode-unihan-17:kZVariant",
      "tw-moe-character-frequency-mainland",
      "rime-cangjie5",
    ]),
  }),
});

export const SOURCE_DEFINITIONS = Object.freeze({
  edb: {
    id: "hk-edb-primary-lexical-list",
    name: "Hong Kong EDB online character inventory",
    publisher: "Hong Kong Education Bureau",
    version: "2007 (online edition accessed 2026-07-28)",
    baseUrl: "https://www.edbchinese.hk/lexlist_ch",
    expectedCharacterCount: 4804,
    license: "Hong Kong Education Bureau copyright; redistribution review required",
  },
  frequency: {
    id: "tw-moe-character-frequency-mainland",
    name: "Traditional Chinese Character Frequency Table",
    publisher: "Ministry of Education, Taiwan",
    version: "online table accessed 2026-07-28",
    url: "https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/MAINLAND/download/dlrest1.zip",
    expectedCharacterCount: 3951,
    expectedTotalFrequency: 728902,
    license: "Taiwan Ministry of Education website terms apply",
  },
  wordFrequency: {
    id: "tw-moe-word-frequency-mainland",
    name: "Traditional Chinese Word Frequency Table",
    publisher: "Ministry of Education, Taiwan",
    version: "online archive accessed 2026-07-28",
    url: "https://language.moe.gov.tw/001/Upload/files/SITE_CONTENT/M0001/MAINLAND/download/dlrest2.zip",
    expectedWordCount: 23007,
    expectedTotalFrequency: 470028,
    license: "Taiwan Ministry of Education website terms apply",
  },
  cangjie: {
    id: "rime-cangjie5",
    name: "Rime Cangjie 5 base dictionary",
    repository: "https://github.com/rime/rime-cangjie",
    commit: "52d90a1b1312e74042b38c1cbc8142defbc53171",
    relativePath: "rime-cangjie@52d90a1b1312e74042b38c1cbc8142defbc53171/cangjie5.base.dict.yaml",
    sha256: "8690f2ad8aafd38780846881aa916b5779e6d9247a351a1da426d3f3257afca4",
    license: "GPL table header; repository LGPL-3.0",
  },
  quick: {
    id: "rime-quick5",
    name: "Rime Quick 5 schema",
    repository: "https://github.com/rime/rime-quick",
    commit: "5dcdb9e353d314239e9c8cddc0f42d52da4837bb",
    relativePath: "rime-quick@5dcdb9e353d314239e9c8cddc0f42d52da4837bb/quick5.schema.yaml",
    sha256: "0eed4b8b10cd50132a691c8027cb774f481eb571c9d5c0b901d54bc7c5867c53",
    rule: "first and last Cangjie keys, except z-prefixed special codes",
    license: "LGPL-3.0",
  },
  unihan: {
    id: "unicode-unihan-17",
    name: "Unicode Unihan Database",
    publisher: "Unicode Consortium",
    version: "17.0.0",
    baseUrl: "https://www.unicode.org/Public/17.0.0/ucd/Unihan.zip",
    relativePaths: {
      readings: "unihan@17.0.0/Unihan_Readings.txt",
      radicalStrokes: "unihan@17.0.0/Unihan_IRGSources.txt",
      variants: "unihan@17.0.0/Unihan_Variants.txt",
      dictionaryLikeData: "unihan@17.0.0/Unihan_DictionaryLikeData.txt",
    },
    license: "Unicode-3.0",
  },
  opencc: {
    id: "opencc-st-characters",
    name: "OpenCC Simplified-to-Traditional character map",
    repository: "https://github.com/BYVoid/OpenCC",
    commit: "2904aa4dd06df17c538fbeae9f1efa14e25bb4a5",
    sourcePath: "data/dictionary/STCharacters.txt",
    relativePath: "opencc@2904aa4dd06df17c538fbeae9f1efa14e25bb4a5/STCharacters.txt",
    sha256: "a0ca1601c70648cf48b33c3c6210ccbecc5c7eead4b4c3daf76587ba2c03582b",
    license: "Apache-2.0",
  },
  ids: {
    id: "chise-ids-ucs-basic",
    name: "CHISE IDS for CJK Unified Ideographs",
    repository: "https://github.com/chise/ids",
    commit: "352e13378e411c322cfa16bfd7a6d21d670d7eca",
    sourcePath: "IDS-UCS-Basic.txt",
    relativePath: "chise-ids@352e13378e411c322cfa16bfd7a6d21d670d7eca/IDS-UCS-Basic.txt",
    sha256: "296f2ad81911e92bba6387a7cf0713c955a0047ec95304039507e94144bee302",
    license: "GPL-2.0-or-later",
  },
});

export const CHARACTER_COLUMNS = Object.freeze([
  "character", "unicode", "unicode_hex", "edb_presence", "edb_source_glyph", "edb_version", "edb_grade_level",
  "moe_frequency_rank", "moe_frequency_score", "moe_frequency_band", "hk_frequency_rank",
  "foxchild_selection_rank", "foxchild_selection_score", "foxchild_selection_method",
  "frequency_bucket", "foxchild_frequency_tier", "foxchild_frequency_tier_method",
  "usage_level", "literacy_level", "curriculum_stage", "curriculum_priority",
  "register", "formal_written_chinese", "written_cantonese",
  "spoken_cantonese_transcription", "hk_education_core", "hk_typing_extension",
  "register_review_status",
  "cangjie", "quick", "root_count", "code_length", "first_root", "last_root",
  "cangjie_difficulty", "cangjie_difficulty_method",
  "simple_code_candidate", "simple_code_candidate_method",
  "radical", "total_strokes", "structure", "left_right", "top_bottom", "surround", "single",
  "decomposition_status", "structure_source",
  "visual_complexity", "visual_complexity_method", "visual_complexity_confidence",
  "unihan_definition", "learner_definition_en", "learner_definition_status",
  "suggested_category", "category_method", "category_confidence", "category_review_status",
  "example_word", "example_phrase", "example_sentence",
  "code_uniqueness", "code_uniqueness_method", "cangjie_first_root_group",
  "source_frequency", "source_cangjie", "source_unihan", "source_edb", "source_opencc",
  "last_verified", "dataset_version",
]);

export const WORD_COLUMNS = Object.freeze([
  "word", "unicode_sequence", "character_ids",
  "moe_frequency_rank", "moe_frequency_score", "hk_frequency_rank",
  "foxchild_selection_rank", "foxchild_selection_score", "foxchild_selection_method",
  "frequency_bucket", "foxchild_frequency_tier", "foxchild_frequency_tier_method",
  "usage_level", "curriculum_priority",
  "register", "formal_written_chinese", "written_cantonese",
  "spoken_cantonese_transcription", "hk_education_core", "hk_typing_extension",
  "register_review_status",
  "character_selection_ceiling", "pronunciation_status",
  "learner_definition_en", "learner_definition_status",
  "suggested_category", "category_method", "category_confidence", "category_review_status",
  "example_sentence", "source_frequency", "last_verified", "dataset_version",
]);

export const CHARACTER_READING_COLUMNS = Object.freeze([
  "character", "language", "reading", "usage", "word_example",
  "is_default_for_display", "source", "source_property", "review_status",
]);

export const CHARACTER_DECOMPOSITION_COLUMNS = Object.freeze([
  "character", "ids", "top_level_operator", "structure",
  "ordered_component_occurrences", "ordered_component_ids", "unique_components",
  "component_occurrence_count", "unique_component_count", "source", "source_commit",
  "confidence", "review_status", "license",
]);

export const COMPONENT_METADATA_COLUMNS = Object.freeze([
  "component_id", "source_token", "unicode_character", "display_glyph",
  "svg_fallback", "plain_name_zh_hk", "plain_name_en", "render_status",
  "name_review_status", "source", "source_commit", "license",
]);

export const CHARACTER_FAMILY_COLUMNS = Object.freeze([
  "family_id", "family_type", "character", "basis", "relationship",
  "source", "confidence", "review_status",
]);

export const CHARACTER_REVIEW_QUEUE_COLUMNS = Object.freeze([
  "character", "foxchild_selection_rank", "moe_frequency_rank", "hk_frequency_rank",
  "edb_presence", "edb_source_glyph",
  "unihan_definition", "suggested_category", "cangjie", "quick",
  "reading_count", "decomposition_status", "top_level_operator",
  "register_review_status", "review_tasks", "review_priority_band",
]);

export const SEMANTIC_ANCHOR_CHARACTERS = Object.freeze(Array.from(
  "一二三人口日月木水火我你他她佢們的是有在學校書讀寫聽說話行長著地為和得還了個小數多上不來少這下米面大分用中出麼子到時天要把方想每看國以算什成年千生就樣同兩去可起幾做十第好動作家比後過位能它題平計各練那體文自曲法也形會種課從高歌表邊克都對習怎兒又花四心工加些老再音發車共意圖相哪唱物聲開事本果進點樹現然合積產前沒山條頭走民求道組給正快媽段重明公向路紅樂手先字除全五百部叫啦主思回畫答機氣元當師像間例實放最萬情知解角隊很白運次隻化活句電釐等美倍經完量球飛軍之詞色度根問呀打光空如見原節身爸線己乘嗎只內填變星別外件愛連級式於力直張均班被噸帶應已理風奏照立常西結或真總新約示塊請整圓買號海並而所商河馬東列吃陽",
));

export const HONG_KONG_CANTONESE_CHARACTER_ANCHORS = Object.freeze([
  "佢", "說", "嘅", "唔", "咗", "啲", "嚟", "冇", "喺", "咁", "呢", "咩", "哋",
]);

export const HONG_KONG_CANTONESE_WORD_ANCHORS = Object.freeze([
  "唔該", "多謝", "而家", "點解", "冇嘢", "咁樣", "佢哋", "喺度",
]);
