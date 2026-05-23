import { escapeHtml, humanizeLabel } from "./utils.js";
import {
  hasGrammarAnalysis,
  renderGrammarHelpPanel,
  renderGrammarTokenTooltip,
} from "./components/language/grammar-help.js";

// Prototype module for multilingual progressive phrase learning.
export const PROGRESSIVE_LANGUAGE_CATALOG_PATH = "./data/ProgressiveLanguagePacks/manifest.json";
export const PROGRESSIVE_LANGUAGE_PACK_PATH = "./data/ProgressiveLanguagePacks/prototype/stage1/bank_river_bank_go_sit/pack.json";

export const FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG = {
  schemaVersion: "progressive-language-catalog-1.0",
  packs: [
    {
      id: "prototype",
      label: "Prototype Packs",
      description: "Small hand-reviewed prototype lessons used while building Progressive Language.",
      stages: [
        {
          id: "stage1",
          label: "Stage 1",
          description: "Prototype starter lessons",
          lessons: [
            {
              id: "bank_river_bank_go_sit",
              label: "Bank, River Bank, Go and Sit",
              path: PROGRESSIVE_LANGUAGE_PACK_PATH,
            },
          ],
        },
      ],
    },
  ],
};

const TARGET_LANGUAGES = [
  { code: "de", label: "English → German" },
  { code: "fr", label: "English → French" },
  { code: "es", label: "English → Spanish" },
  { code: "zh", label: "English → Chinese" },
  { code: "ja", label: "English → Japanese" },
];

const ARTICLE_LANGUAGES = new Set(["de", "fr", "es"]);
const SPEECH_LANGUAGE = {
  de: "de-DE",
  fr: "fr-FR",
  es: "es-ES",
  zh: "zh-HK",
  ja: "ja-JP",
  en: "en-GB",
};

const packCache = new Map();
let catalogCache = null;

export async function loadProgressiveLessonCatalog(path = PROGRESSIVE_LANGUAGE_CATALOG_PATH) {
  if (catalogCache) return catalogCache;
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Could not load progressive language catalog: ${response.status}`);
    catalogCache = normalizeProgressiveCatalog(await response.json());
  } catch (error) {
    console.warn(error);
    catalogCache = normalizeProgressiveCatalog(FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG);
  }
  return catalogCache;
}

export async function loadProgressiveLessonPack(path = PROGRESSIVE_LANGUAGE_PACK_PATH) {
  if (packCache.has(path)) return packCache.get(path);
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load progressive language pack: ${response.status}`);
  }
  const pack = await response.json();
  packCache.set(path, pack);
  return pack;
}

export function createProgressiveLessonState(targetLang = "de", packPath = PROGRESSIVE_LANGUAGE_PACK_PATH, selection = {}) {
  return {
    packPath,
    catalogPackId: selection.catalogPackId || "prototype",
    stageId: selection.stageId || "stage1",
    lessonId: selection.lessonId || "bank_river_bank_go_sit",
    targetLang,
    phase: "listen",
    chainIndex: 0,
    stepIndex: 0,
    vocabIndex: 0,
    sentenceIndex: 0,
    selectedTiles: [],
    bankTiles: [],
    vocabOptions: [],
    feedback: null,
    spokenStepKey: "",
    showListenGrammar: false,
    showBuilderHint: false,
    showGrammarLabels: false,
    answered: {
      vocab: {},
      builder: {},
    },
    mistakes: [],
    score: {
      vocabCorrect: 0,
      vocabTotal: 0,
      builderCorrect: 0,
      builderTotal: 0,
    },
  };
}

export function getTargetLanguageOptions() {
  return TARGET_LANGUAGES;
}

export function normalizeProgressiveCatalog(catalog = FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG) {
  const packs = Array.isArray(catalog.packs) ? catalog.packs : [];
  return {
    ...catalog,
    packs: packs.map((pack) => ({
      ...pack,
      id: pack.id || "pack",
      label: pack.label || humanizeLabel(pack.id || "pack"),
      stages: (Array.isArray(pack.stages) ? pack.stages : []).map((stage) => ({
        ...stage,
        id: stage.id || "stage",
        label: stage.label || humanizeLabel(stage.id || "stage"),
        lessons: (Array.isArray(stage.lessons) ? stage.lessons : []).filter((lesson) => lesson.path).map((lesson) => ({
          ...lesson,
          id: lesson.id || lesson.packId || lesson.path,
          label: lesson.label || lesson.title || humanizeLabel(lesson.id || lesson.packId || "lesson"),
        })),
      })),
    })).filter((pack) => pack.stages.some((stage) => stage.lessons.length)),
  };
}

export function getDefaultProgressiveLesson(catalog = FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG) {
  const normalized = normalizeProgressiveCatalog(catalog);
  const pack = normalized.packs[0];
  const stage = pack?.stages?.[0];
  const lesson = stage?.lessons?.[0];
  return { pack, stage, lesson };
}

export function ensureProgressiveLessonStateForCatalog(state, catalog = FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG) {
  const targetLang = state?.targetLang || "de";
  if (!state) {
    const fallback = getDefaultProgressiveLesson(catalog);
    return createProgressiveLessonState(targetLang, fallback.lesson?.path || PROGRESSIVE_LANGUAGE_PACK_PATH, {
      catalogPackId: fallback.pack?.id || "prototype",
      stageId: fallback.stage?.id || "stage1",
      lessonId: fallback.lesson?.id || "bank_river_bank_go_sit",
    });
  }

  const selection = findProgressiveCatalogSelection(catalog, state);
  if (selection.lesson) {
    state.catalogPackId = selection.pack.id;
    state.stageId = selection.stage.id;
    state.lessonId = selection.lesson.id;
    state.packPath = selection.lesson.path;
    return state;
  }

  const fallback = getDefaultProgressiveLesson(catalog);
  return createProgressiveLessonState(targetLang, fallback.lesson?.path || PROGRESSIVE_LANGUAGE_PACK_PATH, {
    catalogPackId: fallback.pack?.id || "prototype",
    stageId: fallback.stage?.id || "stage1",
    lessonId: fallback.lesson?.id || "bank_river_bank_go_sit",
  });
}

export function findProgressiveCatalogSelection(catalog = FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG, state = {}) {
  const normalized = normalizeProgressiveCatalog(catalog);
  const exactPack = normalized.packs.find((pack) => pack.id === state.catalogPackId);
  const exactStage = exactPack?.stages?.find((stage) => stage.id === state.stageId);
  const exactLesson = exactStage?.lessons?.find((lesson) => lesson.id === state.lessonId);
  if (exactPack && exactStage && exactLesson) {
    return { pack: exactPack, stage: exactStage, lesson: exactLesson };
  }

  for (const pack of normalized.packs) {
    for (const stage of pack.stages || []) {
      const lesson = (stage.lessons || []).find((item) => item.path === state.packPath);
      if (lesson) return { pack, stage, lesson };
    }
  }

  const fallback = getDefaultProgressiveLesson(normalized);
  return { pack: fallback.pack, stage: fallback.stage, lesson: fallback.lesson };
}

function createStateFromSelection(state, selection) {
  return createProgressiveLessonState(state?.targetLang || "de", selection.lesson.path, {
    catalogPackId: selection.pack.id,
    stageId: selection.stage.id,
    lessonId: selection.lesson.id,
  });
}

export function changeProgressiveLessonCollection(state, catalog, catalogPackId) {
  const normalized = normalizeProgressiveCatalog(catalog);
  const pack = normalized.packs.find((item) => item.id === catalogPackId) || normalized.packs[0];
  const stage = pack?.stages?.[0];
  const lesson = stage?.lessons?.[0];
  if (!pack || !stage || !lesson) return createProgressiveLessonState(state?.targetLang || "de");
  return createStateFromSelection(state, { pack, stage, lesson });
}

export function changeProgressiveLessonStage(state, catalog, stageId) {
  const current = findProgressiveCatalogSelection(catalog, state);
  const stage = current.pack?.stages?.find((item) => item.id === stageId) || current.pack?.stages?.[0];
  const lesson = stage?.lessons?.[0];
  if (!current.pack || !stage || !lesson) return createProgressiveLessonState(state?.targetLang || "de");
  return createStateFromSelection(state, { pack: current.pack, stage, lesson });
}

export function changeProgressiveLessonLesson(state, catalog, lessonId) {
  const current = findProgressiveCatalogSelection(catalog, state);
  const lesson = current.stage?.lessons?.find((item) => item.id === lessonId) || current.stage?.lessons?.[0];
  if (!current.pack || !current.stage || !lesson) return createProgressiveLessonState(state?.targetLang || "de");
  return createStateFromSelection(state, { pack: current.pack, stage: current.stage, lesson });
}

export function getDisplayText(entry = {}, lang = "en") {
  const text = entry.text || entry.base || entry.pastPhrase || entry.past || entry.pastContext || "";
  const article = entry.article;
  if (article && ARTICLE_LANGUAGES.has(lang) && text) {
    if (String(article).endsWith("'") || String(article).endsWith("’")) {
      return `${article}${text}`;
    }
    return `${article} ${text}`;
  }
  return text;
}

export function getSpeechLang(lang) {
  return SPEECH_LANGUAGE[lang] || SPEECH_LANGUAGE.en;
}

export function isSpeechAvailable() {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

export function speak(text, lang) {
  if (!text || !isSpeechAvailable()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getSpeechLang(lang);
  window.speechSynthesis.speak(utterance);
  return true;
}

export function shuffleArray(array) {
  const copy = [...array];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

export function buildVocabOptions(correctItem, allVocabulary, targetLang) {
  const correct = getDisplayText(correctItem.translations[targetLang], targetLang);
  const seen = new Set([correct]);
  const distractors = [];

  for (const item of shuffleArray(allVocabulary)) {
    if (item.conceptId === correctItem.conceptId) continue;
    const option = getDisplayText(item.translations[targetLang], targetLang);
    if (!option || seen.has(option)) continue;
    seen.add(option);
    distractors.push(option);
    if (distractors.length >= 3) break;
  }

  return shuffleArray([correct, ...distractors].slice(0, 4));
}

export function compareTiles(selectedTiles, expectedTiles) {
  if (!Array.isArray(selectedTiles) || !Array.isArray(expectedTiles)) return false;
  if (selectedTiles.length !== expectedTiles.length) return false;
  return selectedTiles.every((tile, index) => tile === expectedTiles[index]);
}

export function prepareProgressiveLessonState(state, pack) {
  state.answered ||= { vocab: {}, builder: {} };
  state.answered.vocab ||= {};
  state.answered.builder ||= {};
  state.score.vocabTotal = pack.vocabulary.length;
  state.score.builderTotal = pack.sentenceBuilders.length;

  if (state.phase === "vocab" && !state.vocabOptions.length) {
    const current = pack.vocabulary[state.vocabIndex];
    state.vocabOptions = current ? buildVocabOptions(current, pack.vocabulary, state.targetLang) : [];
  }

  if (state.phase === "builder" && !state.bankTiles.length && !state.selectedTiles.length) {
    resetBuilderTiles(state, pack);
  }
}

export function getCurrentListenStep(pack, state) {
  const chain = pack.phraseProgressionChains[state.chainIndex];
  const step = chain && chain.steps[state.stepIndex];
  return { chain, step };
}

export function getCurrentSpeechCue(pack, state) {
  if (state.phase !== "listen") return null;
  const { chain, step } = getCurrentListenStep(pack, state);
  const text = step?.translations?.[state.targetLang]?.text || "";
  if (!chain || !step || !text) return null;
  return {
    key: `${state.targetLang}:${chain.chainId}:${state.stepIndex}`,
    text,
    lang: state.targetLang,
  };
}

export function markCurrentStepSpoken(state, cue) {
  if (cue) state.spokenStepKey = cue.key;
}

export function renderProgressiveLanguageLesson(pack, state, catalog = FALLBACK_PROGRESSIVE_LANGUAGE_CATALOG) {
  prepareProgressiveLessonState(state, pack);
  const selection = findProgressiveCatalogSelection(catalog, state);
  const catalogPack = selection.pack;
  const catalogStage = selection.stage;
  const catalogLesson = selection.lesson;
  const packOptions = catalog.packs.map((packOption) => `
    <option value="${escapeHtml(packOption.id)}" ${catalogPack?.id === packOption.id ? "selected" : ""}>
      ${escapeHtml(packOption.label)}
    </option>
  `).join("");
  const stageOptions = (catalogPack?.stages || []).map((stageOption) => `
    <option value="${escapeHtml(stageOption.id)}" ${catalogStage?.id === stageOption.id ? "selected" : ""}>
      ${escapeHtml(stageOption.label)}
    </option>
  `).join("");
  const lessonOptions = (catalogStage?.lessons || []).map((lessonOption) => `
    <option value="${escapeHtml(lessonOption.id)}" ${catalogLesson?.id === lessonOption.id ? "selected" : ""}>
      ${escapeHtml(lessonOption.label)}
    </option>
  `).join("");
  const languageOptions = getTargetLanguageOptions().map((language) => `
    <option value="${escapeHtml(language.code)}" ${state.targetLang === language.code ? "selected" : ""}>
      ${escapeHtml(language.label)}
    </option>
  `).join("");

  return `
    <div class="section-stack progressive-lesson-shell">
      <section class="section-card lead progressive-lesson-hero">
        <div>
          <p class="eyebrow">Progressive Language</p>
          <h2>${escapeHtml(pack.title || "Progressive Language")}</h2>
          <p class="muted tiny">${escapeHtml(pack.description || "Build phrases, learn concepts, and practise sentence order.")}</p>
        </div>
        <div class="progressive-selector-stack">
          <label class="field progressive-pack-selector">
            <span>Pack</span>
            <select id="progressive-pack-collection">
              ${packOptions}
            </select>
          </label>
          <label class="field progressive-stage-selector">
            <span>Stage</span>
            <select id="progressive-stage">
              ${stageOptions}
            </select>
          </label>
          <label class="field progressive-lesson-selector">
            <span>Lesson</span>
            <select id="progressive-lesson">
              ${lessonOptions}
            </select>
          </label>
          <label class="field progressive-language-selector">
            <span>Language</span>
            <select id="progressive-language">
              ${languageOptions}
            </select>
          </label>
        </div>
      </section>
      ${renderPhaseSteps(state.phase)}
      ${renderCurrentPhase(pack, state)}
      ${renderGrammarSupport(pack, state)}
    </div>
  `;
}

function renderPhaseSteps(activePhase) {
  const phases = [
    ["listen", "Listen", true],
    ["vocab", "Vocabulary", true],
    ["builder", "Builder", true],
    ["review", "Review", false],
  ];
  return `
    <div class="progressive-phase-row" aria-label="Lesson phase">
      ${phases.map(([id, label, canJump], index) => canJump ? `
        <button type="button"
                class="progressive-phase-chip ${activePhase === id ? "is-active" : ""}"
                data-action="progressive-jump-phase"
                data-phase="${escapeHtml(id)}"
                ${activePhase === id ? `aria-current="step"` : ""}>
          <strong>${index + 1}</strong>${escapeHtml(label)}
        </button>
      ` : `
        <span class="progressive-phase-chip ${activePhase === id ? "is-active" : ""}" ${activePhase === id ? `aria-current="step"` : ""}>
          <strong>${index + 1}</strong>${escapeHtml(label)}
        </span>
      `).join("")}
    </div>
  `;
}

function renderCurrentPhase(pack, state) {
  if (state.phase === "vocab") return renderVocabPhase(pack, state);
  if (state.phase === "builder") return renderBuilderPhase(pack, state);
  if (state.phase === "review") return renderReviewPhase(pack, state);
  return renderListenPhase(pack, state);
}

function renderListenPhase(pack, state) {
  const { chain, step } = getCurrentListenStep(pack, state);
  if (!chain || !step) {
    return renderLessonError("This pack does not contain a listen-and-repeat chain.");
  }

  const en = step.translations.en?.text || "";
  const targetTranslation = step.translations[state.targetLang] || {};
  const target = targetTranslation.text || "";
  const analysis = targetTranslation.analysis;
  const stepCount = chain.steps.length;
  const hasGrammar = hasGrammarAnalysis(analysis);
  const speechNote = isSpeechAvailable()
    ? ""
    : renderProgressiveFeedback({
        tone: "info",
        title: "Audio unavailable",
        body: "Your browser does not expose speech synthesis here, so you can continue without audio.",
      });

  return `
    <section class="question-shell lead progressive-lesson-card">
      <div class="question-meta">
        <div>
          <p class="eyebrow">Listen and repeat</p>
          <h2>${escapeHtml(humanizeLabel(chain.chainId))}</h2>
        </div>
        <span class="mode-chip blue">Step ${state.stepIndex + 1} / ${stepCount}</span>
      </div>
      <div class="progressive-progress-track"><span style="width:${((state.stepIndex + 1) / stepCount) * 100}%"></span></div>
      <div class="progressive-phrase-grid">
        <article>
          <span>English</span>
          <strong>${escapeHtml(en)}</strong>
        </article>
        <article>
          <span>Target phrase</span>
          <strong>${escapeHtml(target)}</strong>
          ${renderInlineGrammarTokens(analysis)}
        </article>
      </div>
      <div class="badge-row">
        <span class="badge amber">${escapeHtml(humanizeLabel(step.focus))}</span>
      </div>
      ${speechNote}
      <div class="button-row">
        <button class="button secondary" data-action="progressive-listen-back" ${isFirstListenStep(state) ? "disabled" : ""}>Back</button>
        <button class="button secondary" data-action="progressive-replay">Replay</button>
        ${hasGrammar ? `<button class="button secondary grammar-icon-button" data-action="progressive-toggle-listen-grammar" aria-expanded="${state.showListenGrammar ? "true" : "false"}" aria-label="Open grammar help">?</button>` : ""}
        <button class="button" data-action="progressive-listen-next">${isLastListenStep(pack, state) ? "Start vocabulary" : "Next"}</button>
      </div>
      ${hasGrammar && state.showListenGrammar ? renderGrammarHelpPanel(analysis, { id: "progressive-listen-grammar", open: true, hideSummary: true }) : ""}
    </section>
  `;
}

function renderVocabPhase(pack, state) {
  const item = pack.vocabulary[state.vocabIndex];
  if (!item) return renderLessonError("This pack does not contain vocabulary items.");

  const prompt = getDisplayText(item.translations.en, "en");
  const correctAnswer = getDisplayText(item.translations[state.targetLang], state.targetLang);
  const selected = state.feedback?.selected || "";

  return `
    <section class="question-shell lead progressive-lesson-card">
      <div class="question-meta">
        <div>
          <p class="eyebrow">Vocabulary multiple choice</p>
          <h2>Choose the ${escapeHtml(languageName(pack, state.targetLang))} word</h2>
        </div>
        <span class="mode-chip blue">${state.vocabIndex + 1} / ${pack.vocabulary.length}</span>
      </div>
      <div class="question-box">
        <div class="question-box-copy">
          <p class="muted tiny">English meaning</p>
          <div class="question-prompt">${escapeHtml(prompt)}</div>
          <div class="badge-row">
            <span class="badge amber">${escapeHtml(item.conceptId)}</span>
            ${item.senseKey ? `<span class="badge blue">${escapeHtml(humanizeLabel(item.senseKey))}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="option-grid progressive-options">
        ${state.vocabOptions.map((option) => {
          const isSelected = selected === option;
          const isCorrect = state.feedback && option === correctAnswer;
          const isWrong = state.feedback && isSelected && !state.feedback.correct;
          const cls = [
            "option-button",
            isSelected ? "is-selected" : "",
            isCorrect ? "is-correct" : "",
            isWrong ? "is-wrong" : "",
          ].filter(Boolean).join(" ");
          return `<button class="${cls}" data-action="progressive-vocab-answer" data-value="${escapeHtml(option)}" ${state.feedback ? "disabled" : ""}>${escapeHtml(option)}</button>`;
        }).join("")}
      </div>
      ${state.feedback ? renderVocabFeedback(state.feedback, correctAnswer) : ""}
      <div class="button-row">
        <button class="button secondary" data-action="progressive-vocab-back">Back</button>
        ${state.feedback ? `<button class="button" data-action="progressive-vocab-next">${isLastVocabItem(pack, state) ? "Start sentence builder" : "Next word"}</button>` : ""}
      </div>
    </section>
  `;
}

function renderVocabFeedback(feedback, correctAnswer) {
  return feedback.correct
    ? renderProgressiveFeedback({ tone: "correct", title: "Correct", body: correctAnswer })
    : renderProgressiveFeedback({ tone: "wrong", title: "Not quite", body: `Correct answer: ${correctAnswer}` });
}

function renderBuilderPhase(pack, state) {
  const sentence = pack.sentenceBuilders[state.sentenceIndex];
  if (!sentence) return renderLessonError("This pack does not contain sentence builders.");

  const expectedTiles = sentence.translations[state.targetLang]?.tiles || [];
  const prompt = sentence.translations.en?.text || "";
  const targetTranslation = sentence.translations[state.targetLang] || {};
  const analysis = targetTranslation.analysis;
  const fullAnswer = targetTranslation.text || expectedTiles.join(" ");
  const feedback = state.feedback;
  const hasGrammar = hasGrammarAnalysis(analysis);

  return `
    <section class="builder-shell lead progressive-lesson-card">
      <div class="question-meta">
        <div>
          <p class="eyebrow">Sentence builder</p>
          <h2>Build this sentence in ${escapeHtml(languageName(pack, state.targetLang))}</h2>
        </div>
        <span class="mode-chip blue">${state.sentenceIndex + 1} / ${pack.sentenceBuilders.length}</span>
      </div>
      <div class="question-box">
        <div class="question-box-copy">
          <p class="muted tiny">English prompt</p>
          <div class="question-prompt">${escapeHtml(prompt)}</div>
          <div class="badge-row">
            ${(sentence.concepts || []).map((concept) => `<span class="badge amber">${escapeHtml(concept)}</span>`).join("")}
          </div>
        </div>
      </div>
      <div class="tile-area ${feedback?.correct ? "answer-correct" : feedback ? "answer-wrong" : ""}">
        <div class="chip-row">
          ${state.selectedTiles.length
            ? state.selectedTiles.map((tile) => renderBuilderTile(tile, analysis, {
                action: "progressive-builder-remove",
                answer: true,
                showGrammarLabels: state.showGrammarLabels,
              })).join("")
            : `<span class="muted tiny">Tap tiles below to build the sentence.</span>`}
        </div>
      </div>
      <div class="tile-area">
        <div class="chip-row">
          ${state.bankTiles.map((tile) => renderBuilderTile(tile, analysis, {
            action: "progressive-builder-pick",
            disabled: feedback?.correct,
            showGrammarLabels: state.showGrammarLabels,
          })).join("")}
        </div>
      </div>
      ${feedback ? renderBuilderFeedback(feedback, fullAnswer, analysis) : ""}
      ${hasGrammar && state.showBuilderHint ? renderGrammarHelpPanel(analysis, {
        id: "progressive-builder-grammar",
        open: true,
        compact: !feedback,
        hideSummary: true,
      }) : ""}
      <div class="button-row">
        <button class="button secondary" data-action="progressive-builder-back">Back</button>
        ${hasGrammar ? `<button class="button secondary grammar-icon-button" data-action="progressive-toggle-builder-hint" aria-expanded="${state.showBuilderHint ? "true" : "false"}" aria-label="Show builder grammar help">?</button>` : ""}
        ${hasGrammar ? `<button class="button secondary" data-action="progressive-toggle-grammar-labels" aria-pressed="${state.showGrammarLabels ? "true" : "false"}">${state.showGrammarLabels ? "Hide Grammar Labels" : "Show Grammar Labels"}</button>` : ""}
        <button class="button secondary" data-action="progressive-builder-reset" ${feedback?.correct ? "disabled" : ""}>Reset</button>
        <button class="button" data-action="progressive-builder-check" ${feedback?.correct || !state.selectedTiles.length ? "disabled" : ""}>Check answer</button>
        ${feedback?.correct ? `<button class="button" data-action="progressive-builder-next">${isLastBuilderSentence(pack, state) ? "Review result" : "Next sentence"}</button>` : ""}
      </div>
    </section>
  `;
}

function renderBuilderFeedback(feedback, fullAnswer, analysis) {
  if (feedback.correct) {
    return renderProgressiveFeedback({ tone: "correct", title: "Nice sentence", body: fullAnswer });
  }
  const grammarClue = Array.isArray(analysis?.grammarExplanation) && analysis.grammarExplanation.length
    ? `<p class="tiny">${escapeHtml(analysis.grammarExplanation[0])}</p>`
    : "";
  return renderProgressiveFeedback({
    tone: "wrong",
    title: "Try again",
    body: feedback.hint || "Check the next tile in the sequence.",
    extra: grammarClue,
  });
}

function renderProgressiveFeedback({ tone = "info", title, body, extra = "" }) {
  const expression = tone === "correct" ? "happy" : tone === "wrong" ? "sad" : "thinking";
  return `
    <div class="feedback ${escapeHtml(tone)}">
      <div class="feedback-header">
        <span class="feedback-icon" aria-hidden="true">
          <img src="./brand/fox-tutor/transparent/${expression}.png" class="fox-mascot" alt="" />
        </span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <p class="tiny">${escapeHtml(body)}</p>
      ${extra}
    </div>
  `;
}

function renderInlineGrammarTokens(analysis) {
  const tokens = Array.isArray(analysis?.tokens) ? analysis.tokens : [];
  if (!tokens.length) return "";
  return `
    <div class="grammar-inline-tokens" aria-label="Grammar token hints">
      ${tokens.map((token) => renderGrammarTokenTooltip(token)).join("")}
    </div>
  `;
}

function renderBuilderTile(tile, analysis, { action, answer = false, disabled = false, showGrammarLabels = false } = {}) {
  const token = findGrammarTokenForTile(tile.text, analysis);
  const label = showGrammarLabels && token ? humanizeLabel(token.type || token.role || "") : "";
  return `
    <button class="tile ${answer ? "answer" : ""} ${label ? "has-grammar-label" : ""}"
            data-action="${escapeHtml(action)}"
            data-tile-id="${escapeHtml(tile.id)}"
            ${disabled ? "disabled" : ""}>
      <span>${escapeHtml(tile.text)}</span>
      ${label ? `<small>${escapeHtml(label)}</small>` : ""}
    </button>
  `;
}

function findGrammarTokenForTile(tileText, analysis) {
  const tokens = Array.isArray(analysis?.tokens) ? analysis.tokens : [];
  const needle = normalizeTokenText(tileText);
  if (!needle) return null;
  return tokens.find((token) => {
    const haystack = normalizeTokenText(token.text);
    return haystack === needle || haystack.includes(needle) || needle.includes(haystack);
  }) || null;
}

function normalizeTokenText(value) {
  return String(value || "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?;:。！？]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function renderReviewPhase(pack, state) {
  const vocabWrong = state.score.vocabTotal - state.score.vocabCorrect;
  const builderWrong = state.score.builderTotal - state.score.builderCorrect;
  return `
    <section class="summary-card lead progressive-lesson-card">
      <p class="eyebrow">Review result</p>
      <h2>Lesson complete</h2>
      <div class="progressive-review-grid">
        <div class="metric"><strong>${state.score.vocabCorrect}/${state.score.vocabTotal}</strong><span>vocabulary correct</span></div>
        <div class="metric"><strong>${state.score.builderCorrect}/${state.score.builderTotal}</strong><span>sentence builders correct</span></div>
        <div class="metric"><strong>${vocabWrong + builderWrong}</strong><span>items to revisit</span></div>
      </div>
      <div class="divider"></div>
      <h3>Mistakes list</h3>
      ${state.mistakes.length ? `
        <div class="review-list">
          ${state.mistakes.map((mistake) => `
            <div class="review-item">
              <div class="review-item-main">
                <strong>${escapeHtml(mistake.prompt)}</strong>
                <span class="tiny muted">${escapeHtml(mistake.phase)} · expected: ${escapeHtml(mistake.expected)}</span>
                ${mistake.selected ? `<span class="tiny muted">selected: ${escapeHtml(mistake.selected)}</span>` : ""}
              </div>
              ${mistake.conceptId ? `<span class="badge amber">${escapeHtml(mistake.conceptId)}</span>` : ""}
            </div>
          `).join("")}
        </div>
      ` : `<p class="muted tiny">No mistakes recorded for this run.</p>`}
      <div class="button-row">
        <button class="button" data-action="progressive-restart">Restart lesson</button>
        <button class="button secondary" data-action="progressive-change-language">Change language</button>
      </div>
    </section>
  `;
}

function renderLessonError(message) {
  return `<section class="empty-state-card"><h2>Lesson unavailable</h2><p>${escapeHtml(message)}</p></section>`;
}

function renderGrammarSupport(pack, state) {
  const tokens = Array.isArray(pack.grammarTokens) ? pack.grammarTokens : [];
  if (!tokens.length) return "";
  return `
    <details class="progressive-grammar-support">
      <summary>Grammar support tokens</summary>
      <div class="progressive-grammar-grid">
        ${tokens.map((token) => `
          <div class="progressive-grammar-token">
            <span>${escapeHtml(token.translations?.en || token.tokenId)}</span>
            <strong>${escapeHtml(token.translations?.[state.targetLang] || "—")}</strong>
          </div>
        `).join("")}
      </div>
    </details>
  `;
}

export function runProgressiveLessonAction(state, pack, action, dataset = {}) {
  prepareProgressiveLessonState(state, pack);

  switch (action) {
    case "progressive-replay":
      return replayCurrentStep(pack, state);
    case "progressive-jump-phase":
      jumpProgressivePhase(state, pack, dataset.phase);
      return null;
    case "progressive-listen-back":
      goBackListen(pack, state);
      return null;
    case "progressive-listen-next":
      advanceListenStep(pack, state);
      return null;
    case "progressive-toggle-listen-grammar":
      state.showListenGrammar = !state.showListenGrammar;
      return null;
    case "progressive-vocab-answer":
      return answerVocab(state, pack, dataset.value);
    case "progressive-vocab-back":
      goBackVocab(state, pack);
      return null;
    case "progressive-vocab-next":
      advanceVocab(state, pack);
      return null;
    case "progressive-builder-pick":
      moveBuilderTile(state, dataset.tileId, "bank");
      return null;
    case "progressive-builder-remove":
      moveBuilderTile(state, dataset.tileId, "answer");
      return null;
    case "progressive-builder-reset":
      state.feedback = null;
      state.showBuilderHint = false;
      state.selectedTiles = [];
      resetBuilderTiles(state, pack);
      return null;
    case "progressive-toggle-builder-hint":
      state.showBuilderHint = !state.showBuilderHint;
      return null;
    case "progressive-toggle-grammar-labels":
      state.showGrammarLabels = !state.showGrammarLabels;
      return null;
    case "progressive-builder-check":
      return checkBuilder(state, pack);
    case "progressive-builder-back":
      goBackBuilder(state, pack);
      return null;
    case "progressive-builder-next":
      advanceBuilder(state, pack);
      return null;
    case "progressive-restart":
    case "progressive-change-language":
      return createProgressiveLessonState(state.targetLang, state.packPath, state);
    default:
      return null;
  }
}

export function changeProgressiveLessonLanguage(state, targetLang) {
  return createProgressiveLessonState(targetLang, state.packPath, state);
}

export function changeProgressiveLessonPack(state, packPath) {
  return createProgressiveLessonState(state.targetLang, packPath, state);
}

function replayCurrentStep(pack, state) {
  const cue = getCurrentSpeechCue(pack, state);
  if (!cue) return null;
  return { speak: cue };
}

function answerVocab(state, pack, selected) {
  if (state.feedback) return null;
  const item = pack.vocabulary[state.vocabIndex];
  const expected = getDisplayText(item.translations[state.targetLang], state.targetLang);
  const prompt = getDisplayText(item.translations.en, "en");
  const correct = selected === expected;
  const answerKey = item.conceptId || String(state.vocabIndex);
  const isFirstAttempt = !state.answered.vocab[answerKey];
  state.feedback = { correct, selected };
  if (isFirstAttempt) {
    state.answered.vocab[answerKey] = { correct, selected };
  }
  if (correct && isFirstAttempt) {
    state.score.vocabCorrect += 1;
  } else if (!correct && isFirstAttempt) {
    state.mistakes.push({
      phase: "Vocabulary",
      conceptId: item.conceptId,
      prompt,
      expected,
      selected,
    });
  }
  return { speak: { text: expected, lang: state.targetLang } };
}

function advanceVocab(state, pack) {
  state.feedback = null;
  if (isLastVocabItem(pack, state)) {
    state.phase = "builder";
    state.sentenceIndex = 0;
    state.selectedTiles = [];
    resetBuilderTiles(state, pack);
    return;
  }
  state.vocabIndex += 1;
  const item = pack.vocabulary[state.vocabIndex];
  state.vocabOptions = item ? buildVocabOptions(item, pack.vocabulary, state.targetLang) : [];
}

function checkBuilder(state, pack) {
  const sentence = pack.sentenceBuilders[state.sentenceIndex];
  const expectedTiles = sentence.translations[state.targetLang]?.tiles || [];
  const selectedTexts = state.selectedTiles.map((tile) => tile.text);
  const correct = compareTiles(selectedTexts, expectedTiles);
  const prompt = sentence.translations.en?.text || "";
  const expected = sentence.translations[state.targetLang]?.text || expectedTiles.join(" ");
  const answerKey = sentence.sentenceId || String(state.sentenceIndex);
  const isFirstAttempt = !state.answered.builder[answerKey];

  if (correct) {
    state.feedback = { correct: true };
    if (isFirstAttempt) {
      state.answered.builder[answerKey] = { correct: true, selected: selectedTexts.join(" ") };
      state.score.builderCorrect += 1;
    }
    return { speak: { text: expected, lang: state.targetLang } };
  }

  const mismatchIndex = findMismatchIndex(selectedTexts, expectedTiles);
  const hint = mismatchIndex === -1
    ? "You have extra tiles. Try trimming the sentence."
    : `Position ${mismatchIndex + 1} should be "${expectedTiles[mismatchIndex]}".`;
  state.feedback = { correct: false, hint };
  if (isFirstAttempt) {
    state.answered.builder[answerKey] = { correct: false, selected: selectedTexts.join(" ") };
    state.mistakes.push({
      phase: "Sentence builder",
      conceptId: (sentence.concepts || []).join(", "),
      prompt,
      expected,
      selected: selectedTexts.join(" "),
    });
  }
  return null;
}

function advanceBuilder(state, pack) {
  state.feedback = null;
  state.showBuilderHint = false;
  if (isLastBuilderSentence(pack, state)) {
    state.phase = "review";
    return;
  }
  state.sentenceIndex += 1;
  state.selectedTiles = [];
  resetBuilderTiles(state, pack);
}

function advanceListenStep(pack, state) {
  state.showListenGrammar = false;
  if (isLastListenStep(pack, state)) {
    state.phase = "vocab";
    state.vocabIndex = 0;
    state.feedback = null;
    state.showBuilderHint = false;
    const item = pack.vocabulary[state.vocabIndex];
    state.vocabOptions = item ? buildVocabOptions(item, pack.vocabulary, state.targetLang) : [];
    return;
  }

  const chain = pack.phraseProgressionChains[state.chainIndex];
  if (state.stepIndex < chain.steps.length - 1) {
    state.stepIndex += 1;
  } else {
    state.chainIndex += 1;
    state.stepIndex = 0;
  }
}

function jumpProgressivePhase(state, pack, phase) {
  if (!["listen", "vocab", "builder"].includes(phase)) return;
  state.phase = phase;
  state.feedback = null;
  state.showListenGrammar = false;
  state.showBuilderHint = false;

  if (phase === "listen") {
    state.spokenStepKey = "";
    return;
  }

  if (phase === "vocab") {
    state.vocabIndex = clampIndex(state.vocabIndex, pack.vocabulary.length);
    const item = pack.vocabulary[state.vocabIndex];
    state.vocabOptions = item ? buildVocabOptions(item, pack.vocabulary, state.targetLang) : [];
    return;
  }

  state.sentenceIndex = clampIndex(state.sentenceIndex, pack.sentenceBuilders.length);
  state.selectedTiles = [];
  resetBuilderTiles(state, pack);
}

function goBackListen(pack, state) {
  if (isFirstListenStep(state)) return;
  state.showListenGrammar = false;
  state.spokenStepKey = "";

  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    return;
  }

  state.chainIndex -= 1;
  const previousChain = pack.phraseProgressionChains[state.chainIndex];
  state.stepIndex = Math.max((previousChain?.steps?.length || 1) - 1, 0);
}

function goBackVocab(state, pack) {
  state.feedback = null;
  if (state.vocabIndex > 0) {
    state.vocabIndex -= 1;
    const item = pack.vocabulary[state.vocabIndex];
    state.vocabOptions = item ? buildVocabOptions(item, pack.vocabulary, state.targetLang) : [];
    return;
  }

  state.phase = "listen";
  state.showListenGrammar = false;
  state.spokenStepKey = "";
  state.chainIndex = Math.max(pack.phraseProgressionChains.length - 1, 0);
  const chain = pack.phraseProgressionChains[state.chainIndex];
  state.stepIndex = Math.max((chain?.steps?.length || 1) - 1, 0);
}

function goBackBuilder(state, pack) {
  state.feedback = null;
  state.showBuilderHint = false;

  if (state.sentenceIndex > 0) {
    state.sentenceIndex -= 1;
    state.selectedTiles = [];
    resetBuilderTiles(state, pack);
    return;
  }

  state.phase = "vocab";
  state.vocabIndex = Math.max(pack.vocabulary.length - 1, 0);
  const item = pack.vocabulary[state.vocabIndex];
  state.vocabOptions = item ? buildVocabOptions(item, pack.vocabulary, state.targetLang) : [];
}

function moveBuilderTile(state, tileId, from) {
  const sourceKey = from === "bank" ? "bankTiles" : "selectedTiles";
  const targetKey = from === "bank" ? "selectedTiles" : "bankTiles";
  const index = state[sourceKey].findIndex((tile) => tile.id === tileId);
  if (index === -1) return;
  const [tile] = state[sourceKey].splice(index, 1);
  state[targetKey].push(tile);
  state.feedback = null;
}

function resetBuilderTiles(state, pack) {
  const sentence = pack.sentenceBuilders[state.sentenceIndex];
  const tiles = sentence?.translations?.[state.targetLang]?.tiles || [];
  state.bankTiles = shuffleArray(tiles.map((text, index) => ({ id: `${state.sentenceIndex}-${index}-${text}`, text })));
}

function isLastListenStep(pack, state) {
  const chain = pack.phraseProgressionChains[state.chainIndex];
  return state.chainIndex === pack.phraseProgressionChains.length - 1 && state.stepIndex === chain.steps.length - 1;
}

function isFirstListenStep(state) {
  return state.chainIndex === 0 && state.stepIndex === 0;
}

function isLastVocabItem(pack, state) {
  return state.vocabIndex >= pack.vocabulary.length - 1;
}

function isLastBuilderSentence(pack, state) {
  return state.sentenceIndex >= pack.sentenceBuilders.length - 1;
}

function findMismatchIndex(selectedTiles, expectedTiles) {
  const max = Math.max(selectedTiles.length, expectedTiles.length);
  for (let index = 0; index < max; index += 1) {
    if (selectedTiles[index] !== expectedTiles[index]) return index < expectedTiles.length ? index : -1;
  }
  return -1;
}

function clampIndex(index, length) {
  if (!length) return 0;
  return Math.min(Math.max(index, 0), length - 1);
}

function languageName(pack, lang) {
  return pack.languageLabels?.[lang] || TARGET_LANGUAGES.find((item) => item.code === lang)?.label || lang;
}
