import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { buildVocabOptions } from "../src/progressive-language-lesson.js";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data/ProgressiveLanguagePacks/manifest.json");

function shiftedPackId(oldPackId) {
  const match = String(oldPackId).match(/^semantic_pack_l2_(\d{3})_(.+)$/);
  if (!match) throw new Error(`Unexpected Stage 2 pack id: ${oldPackId}`);
  const next = String(Number(match[1]) + 10).padStart(3, "0");
  return `semantic_pack_l1_${next}_${match[2]}`;
}

const expectedTranslations = {
  [shiftedPackId("semantic_pack_l2_025_time")]: {
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
  [shiftedPackId("semantic_pack_l2_027_days_of_week")]: {
    S001: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  [shiftedPackId("semantic_pack_l2_030_bedtime")]: {
    S002: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  [shiftedPackId("semantic_pack_l2_064_actions_people")]: {
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
  [shiftedPackId("semantic_pack_l2_066_actions_people")]: {
    S002: {
      en: "How does your friend play football?",
      de: "Wie spielt dein Freund Fußball?",
      fr: "Comment ton ami joue-t-il au football?",
      es: "¿Cómo juega al fútbol tu amigo?",
      zh: "你的朋友怎麼踢足球？",
      ja: "あなたの友だちはどうやってサッカーをしますか？",
    },
  },
  [shiftedPackId("semantic_pack_l2_067_actions_people")]: {
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
  [shiftedPackId("semantic_pack_l2_068_actions_people")]: {
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
  [shiftedPackId("semantic_pack_l2_070_actions_people")]: {
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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function expectedJoin(lang, tiles) {
  return lang === "zh" || lang === "ja" ? tiles.join("") : tiles.join(" ");
}

const manifest = readJson(manifestPath);
const beta1 = manifest.packs.find((pack) => pack.id === "beta1");
assert.equal(beta1.stages.length, 1, "Beta 1 should expose a single merged Stage 1");
const stage1 = beta1.stages.find((stage) => stage.id === "stage1");
assert.ok(stage1, "Stage 1 should exist");
assert.equal(stage1.lessons.length, 110, "Merged Stage 1 should expose 110 lessons");

const lessonIds = new Set();
const packIds = new Set();

for (const [index, lesson] of stage1.lessons.entries()) {
  const expectedNumber = String(index + 1).padStart(3, "0");
  assert.ok(lesson.id.startsWith(`semantic_pack_l1_${expectedNumber}_`), `lesson id should be resequenced: ${lesson.id}`);
  assert.ok(lesson.packId.startsWith(`semantic_pack_l1_${expectedNumber}_`), `packId should be resequenced: ${lesson.packId}`);
  assert.ok(!lesson.id.endsWith("_"), `manifest lesson id still malformed: ${lesson.id}`);
  assert.ok(!lesson.packId.endsWith("_"), `manifest lesson packId still malformed: ${lesson.packId}`);
  assert.ok(!lessonIds.has(lesson.id), `duplicate lesson id: ${lesson.id}`);
  assert.ok(!packIds.has(lesson.packId), `duplicate pack id: ${lesson.packId}`);
  lessonIds.add(lesson.id);
  packIds.add(lesson.packId);

  const packPath = path.join(repoRoot, lesson.path.replace(/^\.\//, ""));
  const pack = readJson(packPath);

  assert.equal(pack.packId, lesson.packId, `packId mismatch for ${lesson.id}`);
  assert.equal(pack.sourceTopic?.topicId, `L1_${expectedNumber}`, `topicId should be resequenced for ${lesson.id}`);
  assert.equal(pack.sourceTopic?.difficultyStage, 1, `difficultyStage should be 1 for ${lesson.id}`);
  assert.equal((pack.vocabulary || []).length, lesson.vocabularyCount, `vocabularyCount mismatch for ${lesson.id}`);

  const vocabIds = new Set((pack.vocabulary || []).map((item) => item.conceptId));
  for (const conceptId of Object.keys(pack.conceptSentenceIndex || {})) {
    assert.ok(vocabIds.has(conceptId), `${lesson.id} missing vocabulary for concept ${conceptId}`);
  }

  const chains = new Map((pack.phraseProgressionChains || []).map((chain) => [chain.chainId, chain]));
  for (const sentence of pack.sentenceBuilders || []) {
    assert.equal(
      (sentence.translations?.en?.tiles || []).join(" "),
      sentence.translations?.en?.text,
      `${lesson.id} ${sentence.sentenceId} en tiles do not match text`,
    );

    const chain = chains.get(sentence.sourceChainId);
    assert.ok(chain, `${lesson.id} ${sentence.sentenceId} missing source chain ${sentence.sourceChainId}`);
    const finalStep = chain.steps[chain.steps.length - 1];
    for (const lang of Object.keys(sentence.translations || {})) {
      const tiles = sentence.translations?.[lang]?.tiles || [];
      if (lang === "zh" || lang === "ja") {
        assert.ok(tiles.length > 1, `${lesson.id} ${sentence.sentenceId} ${lang} should have segmented tiles`);
      }
      assert.equal(
        expectedJoin(lang, tiles),
        sentence.translations?.[lang]?.text,
        `${lesson.id} ${sentence.sentenceId} ${lang} tiles do not match text`,
      );
      assert.equal(
        finalStep.translations?.[lang]?.text,
        sentence.translations?.[lang]?.text,
        `${lesson.id} ${sentence.sentenceId} ${lang} chain/builder drift`,
      );
    }
  }

  for (const [index, vocab] of (pack.vocabulary || []).entries()) {
    for (const lang of ["de", "fr", "es", "zh", "ja"]) {
      const distractors = vocab.distractors?.[lang] || [];
      assert.equal(distractors.length, 3, `${lesson.id} ${vocab.conceptId} ${lang} should have 3 distractors`);
      assert.equal(new Set(distractors).size, distractors.length, `${lesson.id} ${vocab.conceptId} ${lang} distractors should be unique`);
      const options = buildVocabOptions(pack, index, lang);
      assert.equal(options.length, 4, `${lesson.id} ${vocab.conceptId} ${lang} should render 4 vocab choices`);
    }
  }
}

for (const [packId, sentenceMap] of Object.entries(expectedTranslations)) {
  const lesson = stage1.lessons.find((item) => item.packId === packId);
  assert.ok(lesson, `Missing manifest lesson for ${packId}`);
  const pack = readJson(path.join(repoRoot, lesson.path.replace(/^\.\//, "")));
  for (const [sentenceId, expectedLangMap] of Object.entries(sentenceMap)) {
    const sentence = (pack.sentenceBuilders || []).find((item) => item.sentenceId === sentenceId);
    assert.ok(sentence, `Missing sentence ${sentenceId} in ${packId}`);
    for (const [lang, expectedText] of Object.entries(expectedLangMap)) {
      assert.equal(
        sentence.translations?.[lang]?.text,
        expectedText,
        `${packId} ${sentenceId} ${lang} translation mismatch`,
      );
    }
  }
}

assert.ok(!fs.existsSync(path.join(repoRoot, "data/ProgressiveLanguagePacks/beta1/stage2")), "legacy stage2 directory should be removed");

console.log("progressive Beta 1 merged-stage audit passed");
