import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, "data/ProgressiveLanguagePacks/manifest.json");

const expectedTranslations = {
  semantic_pack_l2_025_time: {
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
  semantic_pack_l2_027_days_of_week: {
    S001: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  semantic_pack_l2_030_bedtime: {
    S002: {
      en: "What do you do on Saturday?",
      de: "Was machst du am Samstag?",
      fr: "Qu'est-ce que tu fais le samedi?",
      es: "¿Qué haces el sábado?",
      zh: "你星期六做什麼？",
      ja: "土曜日に何をしますか？",
    },
  },
  semantic_pack_l2_064_actions_people: {
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
  semantic_pack_l2_066_actions_people: {
    S002: {
      en: "How does your friend play football?",
      de: "Wie spielt dein Freund Fußball?",
      fr: "Comment ton ami joue-t-il au football?",
      es: "¿Cómo juega al fútbol tu amigo?",
      zh: "你的朋友怎麼踢足球？",
      ja: "あなたの友だちはどうやってサッカーをしますか？",
    },
  },
  semantic_pack_l2_067_actions_people: {
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
  semantic_pack_l2_068_actions_people: {
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
  semantic_pack_l2_070_actions_people: {
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

const manifest = readJson(manifestPath);
const beta1 = manifest.packs.find((pack) => pack.id === "beta1");
const stage2 = beta1.stages.find((stage) => stage.id === "stage2");

assert.equal(stage2.lessons.length, 100, "Stage 2 should expose 100 lessons");

for (const lesson of stage2.lessons) {
  assert.ok(!lesson.id.endsWith("_"), `manifest lesson id still malformed: ${lesson.id}`);
  assert.ok(!lesson.packId.endsWith("_"), `manifest lesson packId still malformed: ${lesson.packId}`);

  const packPath = path.join(repoRoot, lesson.path.replace(/^\.\//, ""));
  const pack = readJson(packPath);

  assert.equal(pack.packId, lesson.packId, `packId mismatch for ${lesson.id}`);
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
      assert.equal(
        finalStep.translations?.[lang]?.text,
        sentence.translations?.[lang]?.text,
        `${lesson.id} ${sentence.sentenceId} ${lang} chain/builder drift`,
      );
    }
  }
}

for (const [packId, sentenceMap] of Object.entries(expectedTranslations)) {
  const lesson = stage2.lessons.find((item) => item.packId === packId);
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

console.log("progressive Stage 2 audit passed");
