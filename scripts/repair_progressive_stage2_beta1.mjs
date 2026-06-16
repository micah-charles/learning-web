import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data/ProgressiveLanguagePacks/manifest.json");
const stageRoot = path.join(repoRoot, "data/ProgressiveLanguagePacks/beta1/stage2");
const betaRoot = path.join(repoRoot, "data/ProgressiveLanguagePacks/beta1");

const malformedPackRenames = {
  semantic_pack_l2_021_: "semantic_pack_l2_021_morning_routine",
  semantic_pack_l2_023_: "semantic_pack_l2_023_afternoon_activities",
  semantic_pack_l2_026_: "semantic_pack_l2_026_appointments",
  semantic_pack_l2_027_: "semantic_pack_l2_027_days_of_week",
  semantic_pack_l2_028_: "semantic_pack_l2_028_months_year",
  semantic_pack_l2_030_: "semantic_pack_l2_030_bedtime",
};

const translationOverrides = {
  "L2-025": {
    S001: {
      en: "What time is lunch?",
      de: "Wann ist das Mittagessen?",
      fr: "Quand est le déjeuner?",
      es: "¿Cuándo es el almuerzo?",
      zh: "午餐是什麼時候？",
      ja: "昼食はいつですか？",
    },
    S002: {
      en: "When do you eat dinner?",
      de: "Wann isst du zu Abend?",
      fr: "Quand est-ce que tu dînes?",
      es: "¿Cuándo cenas?",
      zh: "你什麼時候吃晚餐？",
      ja: "いつ夕食を食べますか？",
    },
  },
  "L2-027": {
    S001: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  "L2-030": {
    S002: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  "L2-064": {
    S001: {
      en: "How does the child draw a picture?",
      de: "Wie zeichnet das Kind ein Bild?",
      fr: "Comment l'enfant dessine-t-il une image?",
      es: "¿Cómo dibuja un cuadro el niño?",
      zh: "小朋友怎麼畫圖？",
      ja: "子どもはどうやって絵を描きますか？",
    },
    S002: {
      en: "How does the dancer practise singing?",
      de: "Wie übt der Tänzer das Singen?",
      fr: "Comment le danseur s'exerce-t-il à chanter?",
      es: "¿Cómo practica el bailarín el canto?",
      zh: "舞者怎麼練習唱歌？",
      ja: "踊り手はどうやって歌を練習しますか？",
    },
  },
  "L2-066": {
    S002: {
      en: "How does your friend play football?",
      de: "Wie spielt dein Freund Fußball?",
      fr: "Comment ton ami joue-t-il au football?",
      es: "¿Cómo juega al fútbol tu amigo?",
      zh: "你的朋友怎麼踢足球？",
      ja: "あなたの友だちはどうやってサッカーをしますか？",
    },
  },
  "L2-067": {
    S001: {
      en: "How does the child draw a picture?",
      de: "Wie zeichnet das Kind ein Bild?",
      fr: "Comment l'enfant dessine-t-il une image?",
      es: "¿Cómo dibuja un cuadro el niño?",
      zh: "小朋友怎麼畫圖？",
      ja: "子どもはどうやって絵を描きますか？",
    },
    S002: {
      en: "How does the parent read this book?",
      de: "Wie liest der Elternteil dieses Buch?",
      fr: "Comment le parent lit-il ce livre?",
      es: "¿Cómo lee este libro el padre?",
      zh: "家長怎麼讀這本書？",
      ja: "親はどうやってこの本を読みますか？",
    },
  },
  "L2-068": {
    S001: {
      en: "How does the mother cook dinner?",
      de: "Wie kocht die Mutter das Abendessen?",
      fr: "Comment la mère prépare-t-elle le dîner?",
      es: "¿Cómo cocina la cena la madre?",
      zh: "媽媽怎麼煮晚餐？",
      ja: "お母さんはどうやって夕食を作りますか？",
    },
    S002: {
      en: "What does the cook like to drink?",
      de: "Was trinkt der Koch gern?",
      fr: "Qu'est-ce que le cuisinier aime boire?",
      es: "¿Qué le gusta beber al cocinero?",
      zh: "廚師喜歡喝什麼？",
      ja: "料理人は何を飲むのが好きですか？",
    },
  },
  "L2-070": {
    S001: {
      en: "How does the child learn songs?",
      de: "Wie lernt das Kind Lieder?",
      fr: "Comment l'enfant apprend-il des chansons?",
      es: "¿Cómo aprende canciones el niño?",
      zh: "小朋友怎麼學歌？",
      ja: "子どもはどうやって歌を覚えますか？",
    },
    S002: {
      en: "How does the teacher draw a map?",
      de: "Wie zeichnet der Lehrer eine Karte?",
      fr: "Comment le professeur dessine-t-il une carte?",
      es: "¿Cómo dibuja un mapa el profesor?",
      zh: "老師怎麼畫地圖？",
      ja: "先生はどうやって地図を描きますか？",
    },
  },
};

const manualConceptEntries = {
  EVENT_MEETING: {
    conceptId: "EVENT_MEETING",
    type: "noun",
    senseKey: "event_meeting",
    semanticCategory: "events",
    translations: {
      en: { text: "meeting" },
      de: { text: "Treffen", article: "das" },
      fr: { text: "réunion", article: "la" },
      es: { text: "reunión", article: "la" },
      zh: { text: "會議" },
      ja: { text: "会議" },
    },
  },
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function slugifyTopicTitle(title) {
  return String(title || "")
    .replace(/^\d+\s+—\s+/u, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function tokenize(lang, text) {
  if (lang === "zh" || lang === "ja") return [text];
  return String(text).trim().split(/\s+/).filter(Boolean);
}

function analysisTokens(lang, tiles) {
  if (lang === "zh" || lang === "ja") {
    return [
      {
        text: tiles[0] || "",
        type: "sentence",
        role: "full_question",
        meaning: "full question",
        grammarNote: "",
      },
    ];
  }

  return tiles.map((tile) => ({
    text: tile,
    type: "word",
    role: "sentence_element",
    meaning: "sentence element",
    grammarNote: "",
  }));
}

function applyTranslation(translation, lang, text) {
  const tiles = tokenize(lang, text);
  const existingAnalysis = translation.analysis || {};
  translation.text = text;
  translation.tiles = tiles;
  translation.analysis = {
    ...existingAnalysis,
    literalOrderExplanation: lang === "zh" || lang === "ja" ? text : tiles.join(" → "),
    tokens: analysisTokens(lang, tiles),
  };
}

function buildConceptIndex() {
  const index = new Map();
  const packPaths = fs.readdirSync(betaRoot, { recursive: true })
    .filter((entry) => String(entry).endsWith("/pack.json"))
    .map((entry) => path.join(betaRoot, entry));

  for (const packPath of packPaths) {
    const pack = readJson(packPath);
    for (const vocab of pack.vocabulary || []) {
      if (!index.has(vocab.conceptId)) {
        index.set(vocab.conceptId, JSON.parse(JSON.stringify(vocab)));
      }
    }
  }

  for (const [conceptId, entry] of Object.entries(manualConceptEntries)) {
    index.set(conceptId, JSON.parse(JSON.stringify(entry)));
  }

  return index;
}

function renameMalformedPackDirs() {
  for (const [oldName, newName] of Object.entries(malformedPackRenames)) {
    const fromPath = path.join(stageRoot, oldName);
    const toPath = path.join(stageRoot, newName);
    if (fs.existsSync(fromPath) && !fs.existsSync(toPath)) {
      fs.renameSync(fromPath, toPath);
    }
  }
}

function packPathFromLesson(lesson) {
  const rel = lesson.path.replace(/^\.\//, "");
  return path.join(repoRoot, rel);
}

function updatePackFile(packPath, conceptIndex) {
  const pack = readJson(packPath);
  const topicId = pack.sourceTopic?.topicId;
  let changed = false;

  if (translationOverrides[topicId]) {
    for (const [sentenceId, langMap] of Object.entries(translationOverrides[topicId])) {
      const sentence = (pack.sentenceBuilders || []).find((item) => item.sentenceId === sentenceId);
      if (!sentence) continue;

      for (const [lang, text] of Object.entries(langMap)) {
        if (sentence.translations?.[lang]?.text !== text) {
          changed = true;
        }
        applyTranslation(sentence.translations[lang], lang, text);
      }

      const chain = (pack.phraseProgressionChains || []).find(
        (item) => item.chainId === sentence.sourceChainId,
      );
      if (chain?.steps?.length) {
        const finalStep = chain.steps[chain.steps.length - 1];
        for (const [lang, text] of Object.entries(langMap)) {
          if (finalStep.translations?.[lang]?.text !== text) {
            changed = true;
          }
          applyTranslation(finalStep.translations[lang], lang, text);
        }
      }
    }

    pack.sourceTopic.sentenceGoals = (pack.sentenceBuilders || []).map(
      (item) => item.translations?.en?.text || "",
    );
  }

  const vocabIds = new Set((pack.vocabulary || []).map((item) => item.conceptId));
  for (const conceptId of Object.keys(pack.conceptSentenceIndex || {})) {
    if (vocabIds.has(conceptId)) continue;
    const entry = conceptIndex.get(conceptId);
    if (!entry) {
      throw new Error(`No canonical vocabulary entry found for missing concept ${conceptId} in ${packPath}`);
    }
    pack.vocabulary.push(JSON.parse(JSON.stringify(entry)));
    vocabIds.add(conceptId);
    changed = true;
  }

  const desiredSlug = slugifyTopicTitle(pack.sourceTopic?.title);
  if (pack.packId in malformedPackRenames) {
    const newPackId = malformedPackRenames[pack.packId];
    const topicCode = pack.sourceTopic?.topicId?.replace("-", "_") || "L2_000";
    pack.packId = newPackId;
    pack.title = `Semantic Pack ${topicCode} — ${desiredSlug}`;
    changed = true;
  }

  if (changed) {
    writeJson(packPath, pack);
  }
  return pack;
}

function updateManifestAndPacks() {
  const manifest = readJson(manifestPath);
  const beta1 = manifest.packs.find((pack) => pack.id === "beta1");
  const stage2 = beta1?.stages?.find((stage) => stage.id === "stage2");
  if (!stage2) throw new Error("Could not find beta1/stage2 manifest block");

  const conceptIndex = buildConceptIndex();

  for (const lesson of stage2.lessons) {
    if (malformedPackRenames[lesson.id]) {
      lesson.id = malformedPackRenames[lesson.id];
    }
    if (malformedPackRenames[lesson.packId]) {
      lesson.packId = malformedPackRenames[lesson.packId];
    }

    const slug = slugifyTopicTitle(lesson.label);
    if (lesson.id.endsWith("_")) {
      lesson.id = `semantic_pack_l2_${lesson.label.slice(0, 3)}_${slug}`;
    }
    if (lesson.packId.endsWith("_")) {
      lesson.packId = `semantic_pack_l2_${lesson.label.slice(0, 3)}_${slug}`;
    }
    if (lesson.path.includes("/semantic_pack_l2_") && /semantic_pack_l2_\d{3}_\/pack\.json$/.test(lesson.path)) {
      lesson.path = `./data/ProgressiveLanguagePacks/beta1/stage2/${lesson.packId}/pack.json`;
    }

    const packPath = packPathFromLesson(lesson);
    const pack = updatePackFile(packPath, conceptIndex);
    lesson.title = pack.title;
    lesson.packId = pack.packId;
    lesson.vocabularyCount = (pack.vocabulary || []).length;
    lesson.chainCount = (pack.phraseProgressionChains || []).length;
    lesson.sentenceBuilderCount = (pack.sentenceBuilders || []).length;
    lesson.path = `./data/ProgressiveLanguagePacks/beta1/stage2/${path.basename(path.dirname(packPath))}/pack.json`;
  }

  manifest.generatedAt = new Date().toISOString();
  writeJson(manifestPath, manifest);
}

renameMalformedPackDirs();
updateManifestAndPacks();

console.log("Stage 2 Beta 1 repair complete.");
