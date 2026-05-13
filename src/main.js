import {
  findDataset,
  listDatasets,
  listPassageGroups,
  listPassagePacks,
  listSentenceBuilderPacks,
  loadManifest,
  loadPassagePack,
  loadPassageUnifiedPack,
  loadSentenceBuilderPack,
  loadSentenceBuilderUnifiedPack,
  loadSentencePools,
  loadVocabItems,
  loadSequenceItems,
  loadCategorySortItems,
  loadFillBlankItems,
  loadUnifiedPack,
  filterUnifiedItems,
  registerPackInCache,
  SUBJECTS,
  getDatasetSubject,
  listDatasetsBySubject,
  getDatasetDirections,
  getPassageGroupSubject,
  listPassageGroupsBySubject,
} from "./data.js";
import {
  hydrateManifest,
  listUploadedPacks,
  saveUploadedPack,
  deleteUploadedPack,
  validatePack,
} from "./admin-storage.js";
import {
  createQuizSession,
  getDefaultQuestionModes,
  getQuestionModes,
  gradeQuestion,
  makeBuildState,
  makeSequenceQuestions,
  makeCategorySortQuestions,
  makeFillBlankQuestions,
  resolveQuizModesForUI,
} from "./quiz.js";
import {
  DEFAULT_STATE,
  clearAllSessions,
  clearAllWordProgress,
  countMasteredWords,
  deleteSession,
  getBuilderStats,
  getPassageStats,
  getWordProgress,
  isMasteredProgress,
  markBuilderCorrect,
  markBuilderSkip,
  noteBuilderCardAttempt,
  loadStoredState,
  recordPassageCompletion,
  recordQuizSession,
  recordWordAnswer,
  resetWordProgress,
  saveStoredState,
} from "./storage.js";
import {
  escapeHtml,
  formatDateTime,
  formatPercent,
  humanizeLabel,
  levelMatches,
  normalizeForCompare,
  shuffle,
  speakText,
  stopSpeaking,
} from "./utils.js";

const TABS = [
  { id: "home",    title: "Home"       },
  { id: "vocab",   title: "Vocabulary" },
  { id: "quiz",    title: "Quiz"       },
  { id: "reading", title: "Reading"    },
  { id: "builder", title: "Builder"    },
  { id: "review",  title: "Review"     },
  { id: "admin",   title: "⚙ Admin"   },
];

const YEAR_OPTIONS = ["ALL", "Y7", "Y8", "Y9", "Y10", "Y11"];

const root = document.querySelector("#app");
const persisted = loadStoredState();
const runtime = {
  manifest: null,
  currentQuiz: null,
  builder: null,
  passages: null,
  reviewContext: {
    hardest: [],
    mastered: [],
  },
  // Admin tab upload status: null | { ok: boolean, message: string, entry?: object }
  adminUploadStatus: null,
  // Session detail overlay: null | { sessionId: string }
  sessionDetail: null,
};
let searchRenderTimer = null;

function fallback(value, defaultValue) {
  return value === undefined || value === null ? defaultValue : value;
}

function displayNameOr(value, defaultValue) {
  return value && value.displayName ? value.displayName : defaultValue;
}

function getStudyLanguageLabel(dataset) {
  return fallback(dataset && dataset.sourceLanguageLabel, "German");
}

function getTargetLanguageLabel(dataset) {
  return fallback(dataset && dataset.targetLanguageLabel, "English");
}

function getStudyLanguageCode(dataset) {
  return fallback(dataset && dataset.speechLanguage, fallback(dataset && dataset.sourceLanguageCode, "de-DE"));
}

function getDatasetStageOptions(dataset) {
  return Array.isArray(dataset && dataset.stageOptions) ? dataset.stageOptions.map((stage) => String(stage)) : [];
}

function usesStageSelection(dataset) {
  return getDatasetStageOptions(dataset).length > 0;
}

function getSelectedStages(prefSection, dataset) {
  const stageOptions = getDatasetStageOptions(dataset);
  if (!stageOptions.length) {
    return [];
  }
  const current = Array.isArray(prefSection.stages) ? prefSection.stages.map((stage) => String(stage)) : [];
  const valid = current.filter((stage) => stageOptions.includes(stage));
  return valid.length ? valid : [...stageOptions];
}

function describeScope(dataset, prefSection) {
  if (usesStageSelection(dataset)) {
    const selectedStages = getSelectedStages(prefSection, dataset);
    return `Stages ${selectedStages.join(", ")}`;
  }
  return fallback(prefSection.year, "ALL");
}

function filterWordsForScope(words, dataset, prefSection) {
  if (usesStageSelection(dataset)) {
    const selectedStages = new Set(getSelectedStages(prefSection, dataset));
    return words.filter((word) => selectedStages.has(String(word.stage)));
  }
  return words.filter((word) => levelMatches(word.level, prefSection.year));
}

function applyDatasetDefaults(sectionKey, options = {}) {
  const prefSection = persisted.prefs[sectionKey];
  const dataset = findDataset(runtime.manifest, prefSection.datasetId);
  const stageOptions = getDatasetStageOptions(dataset);

  if ("stages" in prefSection) {
    prefSection.stages = stageOptions.length
      ? (options.resetStages ? [...stageOptions] : getSelectedStages(prefSection, dataset))
      : [];
  }

  if ("year" in prefSection && stageOptions.length) {
    prefSection.year = "ALL";
  }

  if (sectionKey === "quiz") {
    const supportedModes = new Set(getQuestionModes(dataset).map((mode) => mode.id));
    const currentModes = Array.isArray(prefSection.modes)
      ? prefSection.modes.filter((modeId) => supportedModes.has(modeId))
      : [];
    prefSection.modes = options.resetQuizModes || !currentModes.length
      ? getDefaultQuestionModes(dataset)
      : currentModes;
  }
}

init().catch((error) => {
  root.innerHTML = `
    <section class="empty-state">
      <div class="empty-card">
        <p class="eyebrow" style="color:#cc633f;">Learning Web</p>
        <h1>Something went wrong</h1>
        <p>${escapeHtml(error.message)}</p>
      </div>
    </section>
  `;
});

async function init() {
  runtime.manifest = await loadManifest();
  // Inject any previously-uploaded packs into the live manifest before rendering.
  hydrateManifest(runtime.manifest, registerPackInCache);
  ensurePreferenceDefaults();
  bindEvents();
  await renderApp();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
}

function ensurePreferenceDefaults() {
  const builderPacks = listSentenceBuilderPacks(runtime.manifest);
  const builderPackIds = new Set(builderPacks.map((pack) => pack.id));
  if ((!persisted.prefs.builder.packId || !builderPackIds.has(persisted.prefs.builder.packId)) && builderPacks.length) {
    persisted.prefs.builder.packId = builderPacks[0].id;
  }

  const groups = listPassageGroups(runtime.manifest);
  if (!persisted.prefs.passages.groupId && groups.length) {
    persisted.prefs.passages.groupId = groups[0].id;
  }

  const currentGroupPacks = listPassagePacks(runtime.manifest, persisted.prefs.passages.groupId);
  if (!persisted.prefs.passages.packId && currentGroupPacks.length) {
    persisted.prefs.passages.packId = currentGroupPacks[0].id;
  }

  if (!persisted.prefs.review.datasetId) {
    persisted.prefs.review.datasetId = DEFAULT_STATE.prefs.review.datasetId;
  }

  applyDatasetDefaults("vocab");
  applyDatasetDefaults("quiz");

  saveStoredState(persisted);
}

async function renderApp() {
  const content = await renderTabContent();
  root.innerHTML = `
    <section class="app-frame">
      ${renderHero()}
      <div class="nav-row">${renderNav()}</div>
      <section class="content">${content}</section>
    </section>
  `;
}

function renderHero() {
  const totalWordCount =
    fallback(runtime.manifest.core.wordCount, 0) +
    (runtime.manifest.revisionPacks || []).reduce((sum, pack) => sum + fallback(pack.wordCount, 0), 0);
  const masteredCount = Object.values(persisted.progress.words).filter(isMasteredProgress).length;
  const lastSession = persisted.progress.sessions[0];

  return `
    <header class="hero">
      <div class="hero-brand">
        <img
          src="./brand/logo.png"
          alt="FoxChild Idea — Fox Tutor and Girl Tutor"
          class="hero-logo"
        />
      </div>
      <div class="hero-body">
        <div class="hero-top">
          <div class="hero-copy">
            <p class="eyebrow">powered by FoxChild Idea</p>
            <h1>Learning Web</h1>
            <p>
              Your personal study desk — vocabulary drills, reading practice,
              sentence builder and progress tracking, all in one place.
            </p>
          </div>
          <div class="hero-badges">
            <span class="hero-badge">${runtime.manifest.revisionPacks.length} packs</span>
            <span class="hero-badge">${runtime.manifest.passageGroups.length} reading groups</span>
            <span class="hero-badge">${runtime.manifest.sentenceBuilderPacks.length} builder sets</span>
          </div>
        </div>
        <div class="hero-stats">
          <div class="hero-stat">
            <strong>${totalWordCount}</strong>
            <span>vocab items</span>
          </div>
          <div class="hero-stat">
            <strong>${masteredCount}</strong>
            <span>words mastered</span>
          </div>
          <div class="hero-stat">
            <strong>${persisted.progress.sessions.length}</strong>
            <span>quiz sessions</span>
          </div>
          <div class="hero-stat">
            <strong>${lastSession ? `${lastSession.score}/${lastSession.totalQuestions}` : "–"}</strong>
            <span>${lastSession ? `last quiz ${formatDateTime(lastSession.timestamp)}` : "no quiz yet"}</span>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderNav() {
  return `
    <div class="nav-pills">
      ${TABS.map(
        (tab) => `
          <button class="nav-pill ${persisted.activeTab === tab.id ? "is-active" : ""}" data-tab="${tab.id}">
            ${escapeHtml(tab.title)}
          </button>
        `,
      ).join("")}
    </div>
  `;
}

function foxFace(expression = "calm") {
  return `<img src="./brand/fox-tutor/transparent/${expression}.png" class="fox-mascot" alt="Fox Tutor — ${expression}" aria-hidden="true" />`;
}

function renderEmptyStateCard({ eyebrow = "FoxChild Idea", title, body, actionLabel = null, action = null }) {
  return `
    <div class="empty-state-card">
      <div class="empty-state-illustration" aria-hidden="true">
        ${foxFace("calm")}
      </div>
      <p class="eyebrow" style="color:var(--fox-teal);">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
      <p class="tiny">${escapeHtml(body)}</p>
      ${actionLabel && action ? `<button class="button" data-action="${escapeHtml(action)}">${escapeHtml(actionLabel)}</button>` : ""}
    </div>
  `;
}

function renderFeedbackBanner({ tone = "info", title, body, extra = "" }) {
  const foxExpr = tone === "correct" ? "happy" : tone === "wrong" ? "sad" : "thinking";
  return `
    <div class="feedback ${escapeHtml(tone)}">
      <div class="feedback-header">
        <span class="feedback-icon" aria-hidden="true">
          ${foxFace(foxExpr)}
        </span>
        <strong>${escapeHtml(title)}</strong>
      </div>
      <p class="tiny">${escapeHtml(body)}</p>
      ${extra}
    </div>
  `;
}

function renderQuestionBox({ eyebrow = "", modeLabel = "", prompt, subtitle = "", sideContent = "" }) {
  return `
    <div class="question-box">
      <div class="question-box-top">
        <div class="question-box-copy">
          ${eyebrow ? `<p class="eyebrow" style="color:#1566a8;">${escapeHtml(eyebrow)}</p>` : ""}
          ${modeLabel ? `<span class="mode-chip blue">${escapeHtml(modeLabel)}</span>` : ""}
          <div class="question-prompt">${escapeHtml(prompt)}</div>
          ${subtitle ? `<p class="muted tiny">${escapeHtml(subtitle)}</p>` : ""}
        </div>
        ${sideContent}
      </div>
    </div>
  `;
}

function describeQuizMode(question) {
  if (question.kind === "choice") {
    return "Multiple choice";
  }
  if (question.kind === "typed") {
    return "Type your answer";
  }
  return "Build the sentence";
}

function getBuilderAnswerStateClass(builder) {
  if (!builder || !builder.feedback) {
    return "";
  }
  if (builder.feedback.tone === "correct") {
    return "answer-correct";
  }
  if (builder.feedback.tone === "wrong") {
    return "answer-wrong";
  }
  return "";
}

async function renderTabContent() {
  switch (persisted.activeTab) {
    case "vocab":
      return renderVocabTab();
    case "quiz":
      return renderQuizTab();
    case "reading":
      return renderReadingTab();
    case "builder":
      return renderBuilderTab();
    case "review":
      return renderReviewTab();
    case "admin":
      return renderAdminTab();
    case "home":
    default:
      if (runtime.sessionDetail) {
        if (runtime.sessionDetail.view === "all") return renderSessionHistoryAll();
        const detailSession = persisted.progress.sessions.find((s) => s.id === runtime.sessionDetail.sessionId);
        return detailSession ? renderSessionDetail(detailSession) : renderHomeTab();
      }
      return renderHomeTab();
  }
}

async function renderHomeTab() {
  const featuredPacks = runtime.manifest.revisionPacks.slice(0, 4);
  const builderPack = listSentenceBuilderPacks(runtime.manifest)[0];
  const firstGroup = listPassageGroups(runtime.manifest)[0];
  const lastSession = persisted.progress.sessions[0];

  return `
    <div class="section-stack">
      <section class="dashboard-grid">
        <article class="section-card">
          <h2>Quick launch</h2>
          <p class="muted tiny">Jump straight into the study mode you want without opening the old iPad app.</p>
          <div class="quick-grid" style="margin-top:16px;">
            <button class="quick-card" data-tab="quiz">
              <h3>Mixed Quiz</h3>
              <p>Reuse the pack-based vocab and sentence flow with browser-side progress tracking.</p>
            </button>
            <button class="quick-card" data-tab="reading">
              <h3>Reading Practice</h3>
              <p>Listen first, then reveal English and model answers after you type.</p>
            </button>
            <button class="quick-card" data-tab="review">
              <h3>Review Desk</h3>
              <p>See weak words, mastered words, and recent quiz performance in one place.</p>
            </button>
            <button class="quick-card" data-tab="builder">
              <h3>Sentence Builder</h3>
              <p>Tap together full answers with hints and local streak tracking.</p>
            </button>
          </div>
        </article>
        <article class="section-card">
          <h2>Status snapshot</h2>
          <div class="stat-grid" style="margin-top:16px;">
            <div class="metric">
              <strong>${Object.keys(persisted.progress.words).length}</strong>
              <span>words seen so far</span>
            </div>
            <div class="metric">
              <strong>${Object.values(persisted.progress.builderStats).reduce((sum, item) => sum + item.totalCorrect, 0)}</strong>
              <span>builder cards solved</span>
            </div>
            <div class="metric">
              <strong>${Object.values(persisted.progress.passageStats).reduce((sum, item) => sum + item.passagesCompleted, 0)}</strong>
              <span>passages completed</span>
            </div>
            <div class="metric">
              <strong>${lastSession ? formatPercent(lastSession.score / Math.max(lastSession.totalQuestions, 1)) : "0%"}</strong>
              <span>${lastSession ? "latest quiz accuracy" : "quiz accuracy will appear here"}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="section-card lead">
        <h2>Featured revision packs</h2>
        <p class="muted tiny">Pulled from the copied Seed/Packs data and ready to browse or quiz.</p>
        <div class="quick-grid" style="margin-top:16px;">
          ${featuredPacks
            .map(
              (pack) => `
                <article class="quick-card">
                  <h3>${escapeHtml(pack.displayName)}</h3>
                  <p>${escapeHtml(fallback(pack.topicEn, fallback(pack.sectionTitleEn, "Pack-based vocab and revision set.")))}</p>
                  <div class="chip-row" style="margin-top:12px;">
                    <span class="badge blue">${pack.wordCount} words</span>
                    ${pack.grammarFocusEn ? `<span class="badge amber">${escapeHtml(pack.grammarFocusEn)}</span>` : ""}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="two-up">
        <article class="section-card">
          <h2>What this web port includes</h2>
          <div class="meta-list" style="margin-top:16px;">
            <div class="session-item"><span>Vocabulary browser with filters and speech</span><span class="badge green">Live</span></div>
            <div class="session-item"><span>Quiz session with mixed Swift-style question modes</span><span class="badge green">Live</span></div>
            <div class="session-item"><span>Passage listening and answer reveal flow</span><span class="badge green">Live</span></div>
            <div class="session-item"><span>Sentence builder drill with hint/streak logic</span><span class="badge green">Live</span></div>
            <div class="session-item"><span>Maze and story tabs from the iPad app</span><span class="badge coral">Later</span></div>
          </div>
        </article>
        <article class="section-card">
          <h2>Current defaults</h2>
          <div class="meta-list" style="margin-top:16px;">
            <div class="session-item"><span>Quiz pack</span><strong>${escapeHtml(findDataset(runtime.manifest, persisted.prefs.quiz.datasetId).displayName)}</strong></div>
            <div class="session-item"><span>Reading group</span><strong>${escapeHtml(displayNameOr(firstGroup, "None"))}</strong></div>
            <div class="session-item"><span>Builder pack</span><strong>${escapeHtml(displayNameOr(builderPack, "None"))}</strong></div>
            <div class="session-item"><span>Stored review sessions</span><strong>${persisted.progress.sessions.length}</strong></div>
          </div>
        </article>
      </section>
    </div>
  `;
}

async function renderVocabTab() {
  const prefs = persisted.prefs.vocab;
  const dataset = findDataset(runtime.manifest, prefs.datasetId);
  const words = await loadVocabItems(runtime.manifest, dataset.id);
  const scopedWords = filterWordsForScope(words, dataset, prefs);
  const partOfSpeechOptions = [...new Set(scopedWords.map((word) => fallback(word.part_of_speech, fallback(word.pos, "")).trim()).filter(Boolean))].sort();
  const categoryOptions = [...new Set([].concat(...scopedWords.map((word) => word.categories || [])))].sort();
  const filtered = scopedWords
    .filter((word) => !prefs.partOfSpeech || fallback(word.part_of_speech, fallback(word.pos, "")) === prefs.partOfSpeech)
    .filter((word) => !prefs.category || (word.categories || []).includes(prefs.category))
    .filter((word) => {
      const query = prefs.search.trim().toLowerCase();
      if (!query) {
        return true;
      }
      return [word.de, word.en, word.topic].concat(word.tags || [])
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  const visibleWords = filtered.slice(0, 120);
  const mastered = countMasteredWords(persisted, filtered);
  const searchPlaceholder = `Type ${getStudyLanguageLabel(dataset)}, ${getTargetLanguageLabel(dataset)}, topic, or tag and press Enter`;

  return `
    <div class="section-stack">
      <section class="section-card">
        <div class="question-meta">
          <div>
            <h2>Vocabulary browser</h2>
            <p class="muted tiny">Ported from the Swift vocab list with browser-side filters and mastery badges.</p>
          </div>
          <div class="chip-row">
            <span class="count-pill blue">${filtered.length} matching</span>
            <span class="count-pill green">${mastered} mastered</span>
            <span class="count-pill amber">${fallback(dataset.wordCount, words.length)} total in pack</span>
          </div>
        </div>
        <div class="form-grid" style="margin-top:18px;">
          ${renderDatasetSelect("vocab-dataset", prefs.datasetId)}
          ${usesStageSelection(dataset)
            ? renderStageFieldset("vocab", getDatasetStageOptions(dataset), getSelectedStages(prefs, dataset))
            : renderYearSelect("vocab-year", prefs.year)}
          ${renderSelectField("vocab-pos", "Part of speech", [{ value: "", label: "All parts of speech" }, ...partOfSpeechOptions.map((item) => ({ value: item, label: item }))], prefs.partOfSpeech)}
          ${renderSelectField("vocab-category", "Category", [{ value: "", label: "All categories" }, ...categoryOptions.map((item) => ({ value: item, label: humanizeLabel(item) }))], prefs.category)}
          <div class="field" style="grid-column:1/-1;">
            <label for="vocab-search">Search</label>
            <input id="vocab-search" class="input" value="${escapeHtml(prefs.search)}" placeholder="${escapeHtml(searchPlaceholder)}" />
          </div>
        </div>
      </section>

      <section class="vocab-grid">
        ${visibleWords
          .map((word) => {
            const progress = getWordProgress(persisted, word.id);
            const status = isMasteredProgress(progress)
              ? { label: "Mastered", tone: "green" }
              : progress.correct || progress.wrong
                ? { label: "Practising", tone: "amber" }
                : { label: "New", tone: "blue" };
            return `
              <article class="vocab-card">
                <div class="status-bar">
                  <div class="chip-row">
                    <span class="badge ${status.tone}">${status.label}</span>
                    <span class="badge blue">${escapeHtml(word.level)}</span>
                    <span class="badge amber">${escapeHtml(word.topic)}</span>
                  </div>
                  <button class="button ghost" data-action="speak" data-text="${escapeHtml(word.de)}" data-language="${escapeHtml(getStudyLanguageCode(dataset))}">Speak</button>
                </div>
                <div>
                  <h3>${escapeHtml(word.de)}</h3>
                  <p class="translation">${escapeHtml(word.en)}</p>
                </div>
                <div class="meta-row">
                  ${word.gender ? `<span class="badge coral">gender: ${escapeHtml(word.gender)}</span>` : ""}
                  ${word.plural ? `<span class="badge blue">plural: ${escapeHtml(word.plural)}</span>` : ""}
                </div>
                ${word.example_de || word.example_en ? `
                  <div class="divider"></div>
                  <p class="tiny muted">${escapeHtml(fallback(word.example_de, ""))}</p>
                  <p class="tiny muted">${escapeHtml(fallback(word.example_en, ""))}</p>
                ` : ""}
                <div class="meta-row">
                  <span class="tiny muted">correct ${progress.correct} · wrong ${progress.wrong}</span>
                </div>
              </article>
            `;
          })
          .join("")}
      </section>
      ${filtered.length > visibleWords.length ? `<p class="muted tiny">Showing the first ${visibleWords.length} matches. Narrow the filters to zoom in further.</p>` : ""}
    </div>
  `;
}

async function renderQuizTab() {
  // Sanitize prefs: prefs.subject is the source of truth for which subject card
  // is highlighted, but if it ever drifts out of sync with the selected
  // dataset's subject, the dataset wins. Also default fields if missing
  // (older persisted state from before the Subject First refactor).
  const prefs = persisted.prefs.quiz;
  if (!prefs.subject) prefs.subject = "language";
  if (!prefs.direction) prefs.direction = "studyToTarget";
  if (!prefs.answerMode) prefs.answerMode = "mixed";

  let dataset = findDataset(runtime.manifest, prefs.datasetId);
  const datasetSubject = getDatasetSubject(dataset);
  if (datasetSubject !== prefs.subject) {
    // Either the user just clicked a subject and we haven't switched dataset
    // yet (handled in the click handler), or we hit some inconsistency.
    // Trust the dataset and snap subject to match it.
    prefs.subject = datasetSubject;
    saveStoredState(persisted);
  }

  const words = await loadVocabItems(runtime.manifest, dataset.id);
  const filteredWords = filterWordsForScope(words, dataset, prefs);
  const mastered = countMasteredWords(persisted, filteredWords);
  const unifiedPack = await loadUnifiedPack(runtime.manifest, prefs.datasetId);
  let passageUnifiedPack = null;
  if (getDatasetSubject(dataset) === "literature") {
    try {
      passageUnifiedPack = await loadPassageUnifiedPack(runtime.manifest, prefs.datasetId);
    } catch (_error) {
      passageUnifiedPack = null;
    }
  }
  const maxQuestionCount = getQuizMaxQuestionCount({
    dataset,
    prefs,
    filteredWords,
    unifiedPack,
    passageUnifiedPack,
  });
  const questionCountOptions = buildQuestionCountOptions(maxQuestionCount);
  if (questionCountOptions.length) {
    const largestAvailable = Number(questionCountOptions[questionCountOptions.length - 1].value);
    if (prefs.questionCount > largestAvailable) {
      prefs.questionCount = largestAvailable;
      saveStoredState(persisted);
    }
  }

  if (runtime.currentQuiz && runtime.currentQuiz.completed) {
    const last = runtime.currentQuiz;
    return renderQuizSummary(last);
  }

  if (runtime.currentQuiz) {
    return renderQuizSession(runtime.currentQuiz);
  }

  return `
    <div class="section-stack">
      <section class="session-card lead">
        <div class="question-meta">
          <div>
            <h2>Quiz setup</h2>
            <p class="muted tiny">Build a clean quiz from your selected topic.</p>
          </div>
          <div class="chip-row">
            <span class="count-pill blue">${filteredWords.length} words in scope</span>
            <span class="count-pill green">${mastered} mastered here</span>
          </div>
        </div>

        ${renderSubjectCardGrid(prefs.subject)}

        <div class="form-grid" style="margin-top:18px;">
          ${renderDatasetSelectFiltered("quiz-dataset", prefs.datasetId, prefs.subject)}
          ${usesStageSelection(dataset)
            ? renderStageFieldset("quiz", getDatasetStageOptions(dataset), getSelectedStages(prefs, dataset))
            : renderYearSelect("quiz-year", prefs.year)}
          ${renderSelectField(
            "quiz-question-count",
            `Questions${maxQuestionCount ? ` (max ${maxQuestionCount})` : ""}`,
            questionCountOptions.length ? questionCountOptions : [{ value: "0", label: "0" }],
            String(questionCountOptions.length ? prefs.questionCount : 0),
          )}
          <div class="field">
            <label for="quiz-exclude-mastered">Word pool</label>
            <select id="quiz-exclude-mastered" class="select">
              <option value="true" ${prefs.excludeMastered ? "selected" : ""}>Exclude mastered words</option>
              <option value="false" ${!prefs.excludeMastered ? "selected" : ""}>Include all words</option>
            </select>
          </div>
        </div>

        ${prefs.subject === "language" ? renderDirectionToggle(dataset, prefs.direction) : ""}

        ${renderAnswerModePills(prefs.answerMode)}

        <div class="action-row" style="margin-top:18px;">
          <button class="button" data-action="start-quiz" ${maxQuestionCount <= 0 ? "disabled" : ""}>Start quiz</button>
          <button class="button secondary" data-action="open-review">Open review desk</button>
        </div>
        ${maxQuestionCount > 0 ? `<p class="muted tiny" style="margin-top:12px;">This setup currently has up to ${maxQuestionCount} questions available.</p>` : `<p class="muted tiny" style="margin-top:12px;">No quiz questions are available for the current setup.</p>`}
      </section>

      <section class="section-card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
          <h2 style="margin:0;">Recent sessions</h2>
          ${persisted.progress.sessions.length > 6
            ? `<button class="button ghost" style="font-size:0.8rem;padding:4px 10px;" data-action="session-history-all">View all (${persisted.progress.sessions.length})</button>`
            : ""}
        </div>
        <div class="session-list" style="margin-top:12px;">
          ${
            persisted.progress.sessions.length
              ? persisted.progress.sessions
                  .slice(0, 6)
                  .map((session) => {
                    const pct = session.score / Math.max(session.totalQuestions, 1);
                    const badgeClass = pct >= 0.75 ? "green" : pct >= 0.5 ? "amber" : "coral";
                    return `
                      <div class="session-item" style="align-items:center;">
                        <div style="flex:1;min-width:0;">
                          <strong>${escapeHtml(fallback(session.label, "Quiz"))}</strong>
                          <p class="muted tiny" style="margin:2px 0 0;">${escapeHtml(findDataset(runtime.manifest, fallback(session.datasetId, "core")).displayName)} · ${escapeHtml(fallback(session.scopeLabel, fallback(session.year, "ALL")))} · ${formatDateTime(session.timestamp)}</p>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                          <span class="badge ${badgeClass}">${session.score}/${session.totalQuestions}</span>
                          <button class="button ghost" style="padding:3px 10px;font-size:0.78rem;" data-action="session-detail" data-session-id="${escapeHtml(session.id)}">Details</button>
                          <button class="button ghost button-danger" style="padding:3px 8px;font-size:0.78rem;" data-action="session-delete" data-session-id="${escapeHtml(session.id)}" title="Delete this session">✕</button>
                        </div>
                      </div>
                    `;
                  })
                  .join("")
              : renderEmptyStateCard({
                  eyebrow: "Quiz",
                  title: "No sessions yet",
                  body: "Pick a pack and hit Start to build your first run.",
                })
          }
        </div>
      </section>
    </div>
  `;
}

function renderQuizSession(session) {
  const question = session.questions[session.index];
  const progressText = `${session.index + 1} / ${session.questions.length}`;
  const buildState = session.buildState || (question.kind === "build" ? makeBuildState(question) : null);
  session.buildState = buildState;

  const feedback = session.feedback
    ? renderFeedbackBanner({
        tone: session.feedback.correct ? "correct" : "wrong",
        title: session.feedback.correct ? "Correct" : "Not quite",
        body: session.feedback.correct ? `Answer: ${question.answer}` : `Expected: ${question.answer}`,
      })
    : "";

  return `
    <div class="section-stack">
      <section class="question-shell lead">
        ${renderQuestionBox({
          eyebrow: question.modeTitle,
          modeLabel: describeQuizMode(question),
          prompt: question.prompt,
          subtitle: question.subtitle || "",
          sideContent: `
            <div class="chip-row">
              <span class="count-pill blue">${escapeHtml(progressText)}</span>
              <span class="count-pill green">${session.score} correct</span>
              <button class="button ghost" data-action="speak" data-text="${escapeHtml(fallback(question.speechText, question.answer))}" data-language="${escapeHtml(fallback(question.speechLanguage, "de-DE"))}">Speak</button>
            </div>
          `,
        })}
        ${renderQuestionControls(question, buildState, session.awaitingNext)}
        ${feedback}
        <div class="action-row">
          ${session.awaitingNext ? `<button class="button" data-action="quiz-next">${session.index === session.questions.length - 1 ? "Finish" : "Next question"}</button>` : ""}
        </div>
      </section>
    </div>
  `;
}

function renderQuestionControls(question, buildState, awaitingNext) {
  if (question.kind === "choice") {
    return `
      <div class="option-grid">
        ${question.options
          .map((option) => `
            <button
              class="option-button"
              data-action="quiz-choice"
              data-value="${escapeHtml(option)}"
              ${awaitingNext ? "disabled" : ""}
            >
              ${escapeHtml(option)}
            </button>
          `)
          .join("")}
      </div>
    `;
  }

  if (question.kind === "typed") {
    return `
      <div class="field">
        <label for="quiz-typed-answer">Answer</label>
        <textarea id="quiz-typed-answer" class="textarea" placeholder="${escapeHtml(fallback(question.placeholder, "Type your answer"))}" ${awaitingNext ? "disabled" : ""}></textarea>
      </div>
      <div class="action-row">
        <button class="button" data-action="quiz-check-typed" ${awaitingNext ? "disabled" : ""}>Check answer</button>
      </div>
    `;
  }

  if (question.kind === "gap") {
    if (question.options && question.options.length > 0) {
      return `
        <div class="option-grid" style="margin-top:12px;">
          ${question.options
            .map((option) => `
              <button class="option-button" data-action="quiz-gap-choice" data-value="${escapeHtml(option)}" ${awaitingNext ? "disabled" : ""}>
                ${escapeHtml(option)}
              </button>
            `)
            .join("")}
        </div>
      `;
    }
    return `
      <div class="field" style="margin-top:12px;">
        <label for="quiz-gap-typed">Your answer</label>
        <textarea id="quiz-gap-typed" class="textarea" placeholder="Type your answer" ${awaitingNext ? "disabled" : ""}></textarea>
      </div>
      <div class="action-row">
        <button class="button" data-action="quiz-check-gap" ${awaitingNext ? "disabled" : ""}>Check answer</button>
      </div>
    `;
  }

  if (question.kind === "sequence") {
    const userOrder = (buildState && buildState.userOrder) ? buildState.userOrder : question.shuffledOrder;
    const selectedIdx = buildState && buildState.selectedIndex;
    return `
      ${question.instruction ? `<p class="muted tiny" style="margin-bottom:12px;">${escapeHtml(question.instruction)}</p>` : ""}
      <div class="sequence-arena">
        ${userOrder.map((item, index) => {
          const isSelected = selectedIdx === index;
          return `
            <div class="sequence-item ${isSelected ? "is-selected" : ""}" data-action="quiz-seq-select" data-index="${index}" ${awaitingNext ? "disabled" : ""}>
              <span class="sequence-num">${index + 1}</span>
              <span class="sequence-text">${escapeHtml(item)}</span>
              <span class="seq-move-hint muted tiny">${isSelected ? "tap another to swap" : "tap to select"}</span>
            </div>
          `;
        }).join("")}
      </div>
      <div class="action-row" style="margin-top:14px;">
        <button class="button secondary" data-action="quiz-seq-shuffle" ${awaitingNext ? "disabled" : ""}>Shuffle</button>
        <button class="button" data-action="quiz-check-sequence" ${awaitingNext ? "disabled" : ""}>Check order</button>
      </div>
    `;
  }

  if (question.kind === "sort") {
    const placedItems = buildState && buildState.placedItems ? buildState.placedItems : [];
    const unplacedItems = buildState && buildState.unplacedItems ? buildState.unplacedItems : question.items;
    const selectedIdx = buildState && buildState.selectedItemIndex;
    return `
      ${question.instruction ? `<p class="muted tiny" style="margin-bottom:12px;">${escapeHtml(question.instruction)}</p>` : ""}
      <div class="sort-arena">
        <div class="sort-item-pool">
          ${unplacedItems.map((item, uIdx) => {
            const realIdx = question.items.indexOf(item);
            const isSelected = selectedIdx === realIdx;
            return `
              <button class="sort-item ${isSelected ? "is-selected" : ""}"
                data-action="quiz-sort-select-item"
                data-item-index="${realIdx}"
                ${awaitingNext ? "disabled" : ""}>
                ${escapeHtml(typeof item === "string" ? item : item.text)}
              </button>
            `;
          }).join("")}
        </div>
        ${question.categories.map((cat, catIdx) => {
          const catItems = placedItems.filter(p => p.categoryIndex === catIdx);
          return `
            <div class="sort-category-zone ${buildState && buildState.selectedCategoryIndex === catIdx ? "is-selected" : ""}">
              <h4>${escapeHtml(cat)}</h4>
              <div class="sort-placed-list">
                ${catItems.map(p => `
                  <div class="sort-placed-item">
                    <span>${escapeHtml(p.text)}</span>
                    <button class="sort-remove-btn" data-action="quiz-sort-remove" data-placed-idx="${placedItems.indexOf(p)}" ${awaitingNext ? "disabled" : ""}>×</button>
                  </div>
                `).join("")}
              </div>
              <button class="button ghost" style="margin-top:8px;font-size:0.85rem;padding:7px 10px;"
                data-action="quiz-sort-place"
                data-category-index="${catIdx}"
                ${selectedIdx === null || awaitingNext ? "disabled" : ""}>
                Place here
              </button>
            </div>
          `;
        }).join("")}
      </div>
      <div class="action-row" style="margin-top:14px;">
        <button class="button secondary" data-action="quiz-sort-reset" ${awaitingNext ? "disabled" : ""}>Reset</button>
        <button class="button" data-action="quiz-check-sort" ${awaitingNext ? "disabled" : ""}>Check sorting</button>
      </div>
    `;
  }

  return `
    <div class="tile-row">
      <div class="field" style="flex:1 1 320px;">
        <label>Answer bar</label>
        <div class="tile-area">
          <div class="tile-row">
            ${
              buildState.answerTiles.length
                ? buildState.answerTiles
                    .map(
                      (tile) => `
                        <button class="tile answer" data-action="quiz-build-return" data-tile-id="${escapeHtml(tile.id)}" ${awaitingNext ? "disabled" : ""}>
                          ${escapeHtml(tile.text)}
                        </button>
                      `,
                    )
                    .join("")
                : `<span class="muted tiny">Tap tiles into the answer bar.</span>`
            }
          </div>
        </div>
      </div>
      <div class="field" style="flex:1 1 320px;">
        <label>Tile bank</label>
        <div class="tile-area">
          <div class="tile-row">
            ${buildState.bankTiles
              .map(
                (tile) => `
                  <button class="tile" data-action="quiz-build-pick" data-tile-id="${escapeHtml(tile.id)}" ${awaitingNext ? "disabled" : ""}>
                    ${escapeHtml(tile.text)}
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="action-row">
      <button class="button secondary" data-action="quiz-build-clear" ${awaitingNext ? "disabled" : ""}>Clear</button>
      <button class="button secondary" data-action="quiz-build-hint" ${awaitingNext ? "disabled" : ""}>Hint</button>
      <button class="button" data-action="quiz-check-build" ${awaitingNext ? "disabled" : ""}>Check answer</button>
    </div>
  `;
}

function renderQuizSummary(session) {
  const accuracy = session.score / Math.max(session.questions.length, 1);
  const wrongAnswers = session.answers.filter((answer) => !answer.correct);
  const wrongHtml = wrongAnswers.length
    ? wrongAnswers
        .slice(0, 12)
        .map(
          (answer) => `
            <div class="review-item">
              <div class="review-item-main">
                <strong>${escapeHtml(answer.prompt)}</strong>
                <span class="muted tiny">Correct answer: ${escapeHtml(answer.expected)}</span>
              </div>
              ${answer.speechText ? `<button class="button ghost" data-action="speak" data-text="${escapeHtml(answer.speechText)}" data-language="${escapeHtml(fallback(answer.speechLanguage, "de-DE"))}">Speak</button>` : ""}
            </div>
          `,
        )
        .join("")
    : `<p class="muted tiny">No missed answers this time.</p>`;

  return `
    <div class="section-stack">
      <section class="summary-card">
        <p class="eyebrow" style="color:#1566a8;">Session complete</p>
        <h2>${escapeHtml(session.label)}</h2>
        <div class="summary-score">${session.score}/${session.questions.length}</div>
        <div class="chip-row" style="margin:12px 0 18px;">
          <span class="badge ${accuracy >= 0.75 ? "green" : accuracy >= 0.5 ? "amber" : "coral"}">${formatPercent(accuracy)} accuracy</span>
          <span class="badge blue">${escapeHtml(findDataset(runtime.manifest, session.config.datasetId).displayName)}</span>
          <span class="badge amber">${escapeHtml(fallback(session.config.scopeLabel, session.config.year))}</span>
        </div>
        <div class="action-row">
          <button class="button" data-action="restart-quiz">Run again</button>
          <button class="button secondary" data-action="quiz-review-missed" ${session.missedWords && session.missedWords.length ? "" : "disabled"}>Review missed words</button>
          <button class="button ghost" data-action="end-quiz">Back to setup</button>
        </div>
      </section>

      <section class="review-card">
        <h2>Words to revisit</h2>
        <div class="review-list" style="margin-top:16px;">
          ${wrongHtml}
        </div>
      </section>
    </div>
  `;
}

// ─── Session detail view ──────────────────────────────────────────────────────

function renderSessionDetail(session) {
  const pct = session.score / Math.max(session.totalQuestions, 1);
  const badgeClass = pct >= 0.75 ? "green" : pct >= 0.5 ? "amber" : "coral";
  const date = session.timestamp
    ? new Date(session.timestamp).toLocaleString(undefined, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Unknown date";

  let answersHtml;
  if (!Array.isArray(session.answers)) {
    answersHtml = `<p class="muted tiny">No answer detail — this session was recorded before detailed history was enabled. Future sessions will show full breakdowns.</p>`;
  } else {
    const correct = session.answers.filter((a) => a.correct);
    const wrong   = session.answers.filter((a) => !a.correct);

    const wrongHtml = wrong.length
      ? wrong.map((a) => `
          <div class="review-item" style="border-left:3px solid #e55;padding-left:12px;margin-bottom:10px;">
            <div class="review-item-main">
              <strong>${escapeHtml(a.prompt)}</strong>
              <p class="muted tiny" style="margin:3px 0 1px;">Your answer: <em>${escapeHtml(a.userAnswer || "—")}</em></p>
              <p class="muted tiny" style="color:#1a7a3a;">Correct: <strong>${escapeHtml(a.expected)}</strong></p>
            </div>
            ${a.speechText ? `<button class="button ghost" style="margin-top:4px;" data-action="speak" data-text="${escapeHtml(a.speechText)}" data-language="${escapeHtml(a.speechLanguage || "en-GB")}">▶ Speak</button>` : ""}
          </div>
        `).join("")
      : `<p class="muted tiny">Perfect — no mistakes this session. 🎉</p>`;

    const correctHtml = correct.length
      ? correct.map((a) => `
          <div style="display:flex;align-items:baseline;gap:8px;padding:5px 0;border-bottom:1px solid #f0f0f0;">
            <span style="color:#1a7a3a;font-weight:700;flex-shrink:0;">✓</span>
            <span class="tiny">${escapeHtml(a.prompt)}</span>
            <span class="muted tiny" style="margin-left:auto;flex-shrink:0;">${escapeHtml(a.expected)}</span>
          </div>
        `).join("")
      : `<p class="muted tiny">No correct answers recorded.</p>`;

    answersHtml = `
      <section class="section-card">
        <h2 style="color:#c00;">✗ Wrong (${wrong.length})</h2>
        <div style="margin-top:12px;">${wrongHtml}</div>
      </section>
      <section class="section-card">
        <details>
          <summary style="cursor:pointer;font-weight:600;font-size:1rem;list-style:none;display:flex;align-items:center;gap:6px;">
            <span style="color:#1a7a3a;">✓</span> Correct (${correct.length}) <span class="muted tiny" style="margin-left:4px;">— click to expand</span>
          </summary>
          <div style="margin-top:12px;">${correctHtml}</div>
        </details>
      </section>
    `;
  }

  return `
    <div class="section-stack">
      <div style="margin-bottom:4px;">
        <button class="button ghost" style="padding:4px 10px;font-size:0.85rem;" data-action="session-detail-back">← Back</button>
      </div>

      <section class="section-card">
        <p class="eyebrow" style="color:#1566a8;">Session detail</p>
        <h2>${escapeHtml(fallback(session.label, "Quiz"))}</h2>
        <p class="muted tiny" style="margin-top:4px;">${escapeHtml(date)}</p>
        <div style="margin:14px 0 18px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <span style="font-size:2rem;font-weight:700;">${session.score}/${session.totalQuestions}</span>
          <span class="badge ${badgeClass}" style="font-size:0.95rem;">${formatPercent(pct)} accuracy</span>
        </div>
        <div class="action-row">
          <button class="button secondary" data-action="session-requiz" data-session-id="${escapeHtml(session.id)}" ${Array.isArray(session.answers) && session.answers.some((a) => !a.correct) ? "" : "disabled"}>Re-quiz wrong answers</button>
          <button class="button ghost button-danger" data-action="session-delete" data-session-id="${escapeHtml(session.id)}">🗑 Delete session</button>
        </div>
      </section>

      ${answersHtml}
    </div>
  `;
}

function renderSessionHistoryAll() {
  const sessions = persisted.progress.sessions;

  const rows = sessions.length
    ? sessions.map((session) => {
        const pct = session.score / Math.max(session.totalQuestions, 1);
        const badgeClass = pct >= 0.75 ? "green" : pct >= 0.5 ? "amber" : "coral";
        const date = session.timestamp
          ? new Date(session.timestamp).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
          : "—";
        return `
          <div class="session-item" style="align-items:center;">
            <div style="flex:1;min-width:0;">
              <strong>${escapeHtml(fallback(session.label, "Quiz"))}</strong>
              <p class="muted tiny" style="margin:2px 0 0;">${escapeHtml(findDataset(runtime.manifest, fallback(session.datasetId, "core")).displayName)} · ${escapeHtml(date)}</p>
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
              <span class="badge ${badgeClass}">${session.score}/${session.totalQuestions}</span>
              <button class="button ghost" style="padding:3px 10px;font-size:0.78rem;" data-action="session-detail" data-session-id="${escapeHtml(session.id)}" data-from-all="true">Details</button>
              <button class="button ghost button-danger" style="padding:3px 8px;font-size:0.78rem;" data-action="session-delete" data-session-id="${escapeHtml(session.id)}" title="Delete">✕</button>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="muted tiny">No sessions recorded yet.</p>`;

  return `
    <div class="section-stack">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
        <button class="button ghost" style="padding:4px 10px;font-size:0.85rem;" data-action="session-detail-back">← Back</button>
        ${sessions.length ? `<button class="button ghost button-danger" style="font-size:0.8rem;" data-action="session-clear-all">Clear all sessions</button>` : ""}
      </div>
      <section class="section-card">
        <h2>All sessions (${sessions.length})</h2>
        <div class="session-list" style="margin-top:12px;">${rows}</div>
      </section>
    </div>
  `;
}

async function renderBuilderTab() {
  const packs = listSentenceBuilderPacks(runtime.manifest);
  const prefs = persisted.prefs.builder;
  const packId = prefs.packId || (packs[0] ? packs[0].id : "");
  if (!packId) {
    return renderUnavailable("No sentence builder packs were found.");
  }
  if (!runtime.builder || runtime.builder.packId !== packId || runtime.builder.filter !== prefs.filter) {
    await resetBuilderRuntime(packId);
  }
  const builder = runtime.builder;
  const stats = getBuilderStats(persisted, packId);
  if (!builder.currentCard) {
    return renderUnavailable("The selected builder pack does not contain any cards for the current filter.");
  }

  return `
    <div class="section-stack">
      <section class="builder-shell lead">
        <div class="question-meta">
          <div>
            <h2>Sentence builder</h2>
            <p class="muted tiny">Tap tiles into the answer bar, then check or hint exactly like the app flow.</p>
          </div>
          <div class="micro-stats">
            <span class="count-pill blue">attempted ${stats.totalAttempted}</span>
            <span class="count-pill green">correct ${stats.totalCorrect}</span>
            <span class="count-pill amber">streak ${stats.streak}</span>
          </div>
        </div>
        <div class="form-grid" style="margin-top:18px;">
          ${renderSelectField("builder-pack", "Pack", packs.map((pack) => ({
            value: pack.id,
            label: `${pack.displayName}${pack.cardCount ? ` (${pack.cardCount})` : ""}`,
          })), packId)}
          ${renderSelectField("builder-filter", "Filter", [
            { value: "all", label: "All" },
            { value: "key_date", label: "Key Dates" },
            { value: "key_term", label: "Key Terms" },
            { value: "example_sentence", label: "Examples" },
          ], prefs.filter)}
        </div>
      </section>

      <section class="builder-shell">
        ${renderQuestionBox({
          eyebrow: humanizeLabel(builder.currentCard.type),
          modeLabel: "Sentence builder",
          prompt: builder.currentCard.prompt,
          sideContent: `<span class="badge blue">${escapeHtml(builder.currentCard.level)}</span>`,
        })}
        ${
          builder.feedback
            ? renderFeedbackBanner({
                tone: builder.feedback.tone,
                title: builder.feedback.title,
                body: builder.feedback.body,
              })
            : ""
        }
        <div class="tile-row">
          <div class="field" style="flex:1 1 320px;">
            <label>Answer bar</label>
            <div class="tile-area ${getBuilderAnswerStateClass(builder)}">
              <div class="tile-row">
                ${builder.answerTiles.length
                  ? builder.answerTiles
                      .map((tile) => `<button class="tile answer" data-action="builder-return" data-tile-id="${escapeHtml(tile.id)}">${escapeHtml(tile.text)}</button>`)
                      .join("")
                  : `<span class="muted tiny">Build the full answer here.</span>`}
              </div>
            </div>
          </div>
          <div class="field" style="flex:1 1 320px;">
            <label>Tile bank</label>
            <div class="tile-area">
              <div class="tile-row">
                ${builder.bankTiles
                  .map((tile) => `<button class="tile" data-action="builder-pick" data-tile-id="${escapeHtml(tile.id)}">${escapeHtml(tile.text)}</button>`)
                  .join("")}
              </div>
            </div>
          </div>
        </div>
        <div class="action-row">
          <button class="button secondary" data-action="builder-clear">Clear</button>
          <button class="button secondary" data-action="builder-hint">Hint</button>
          <button class="button" data-action="builder-check">Check</button>
          <button class="button ghost" data-action="builder-next">Next</button>
        </div>
      </section>
    </div>
  `;
}

function isPassageMultipleChoice(question) {
  return Array.isArray(question && question.options) && question.options.length > 1;
}

function getPassageCorrectAnswer(question) {
  const options = Array.isArray(question && question.options) ? question.options : [];
  const index = Number.isInteger(question && question.correct_option_index) ? question.correct_option_index : -1;
  if (index >= 0 && index < options.length) {
    return options[index];
  }
  return fallback(question && question.correct_answer, fallback(question && question.model_answer_en, ""));
}

function shufflePassageQuestion(question) {
  if (!isPassageMultipleChoice(question)) {
    return { ...question };
  }

  const correctAnswer = getPassageCorrectAnswer(question);
  const options = shuffle(question.options);
  let correctOptionIndex = options.findIndex((option) => option === correctAnswer);
  if (correctOptionIndex === -1) {
    correctOptionIndex = options.findIndex((option) => normalizeForCompare(option) === normalizeForCompare(correctAnswer));
  }

  return {
    ...question,
    options,
    correct_option_index: correctOptionIndex,
    correct_answer: correctAnswer,
  };
}

function preparePassageForSession(passage) {
  return {
    ...passage,
    questions: Array.isArray(passage && passage.questions) ? passage.questions.map((question) => shufflePassageQuestion(question)) : [],
  };
}

function renderPassageQuestionInput(question, passages) {
  const selectedAnswer = fallback(passages.answers[question.id], "");
  if (!isPassageMultipleChoice(question)) {
    return `<textarea class="textarea" data-question-id="${escapeHtml(question.id)}" placeholder="Type your answer in English">${escapeHtml(selectedAnswer)}</textarea>`;
  }

  return `
    <div class="option-grid" style="margin-top:12px;">
      ${question.options
        .map((option, index) => {
          const selected = normalizeForCompare(selectedAnswer) === normalizeForCompare(option);
          const correct = passages.revealed && normalizeForCompare(option) === normalizeForCompare(getPassageCorrectAnswer(question));
          const wrong = passages.revealed && selected && !correct;
          const classes = ["option-button"];
          if (selected) {
            classes.push("is-selected");
          }
          if (correct) {
            classes.push("is-correct");
          }
          if (wrong) {
            classes.push("is-wrong");
          }
          return `
            <button
              class="${classes.join(" ")}"
              data-action="passage-choice"
              data-question-id="${escapeHtml(question.id)}"
              data-option-index="${index}"
              ${passages.revealed ? "disabled" : ""}
            >
              ${escapeHtml(option)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderPassageQuestionReveal(question, passages) {
  const correctAnswer = getPassageCorrectAnswer(question);
  const selectedAnswer = fallback(passages.answers[question.id], "");
  const hasAnswer = Boolean(normalizeForCompare(selectedAnswer));
  const correct = hasAnswer && normalizeForCompare(selectedAnswer) === normalizeForCompare(correctAnswer);
  const tone = hasAnswer ? (correct ? "correct" : "wrong") : "info";

  return renderFeedbackBanner({
    tone,
    title: isPassageMultipleChoice(question) ? (correct ? "Correct" : "Answer review") : "Model answer",
    body: question.model_answer_en,
    extra: `
      ${
        isPassageMultipleChoice(question)
          ? `
            ${hasAnswer ? `<p class="tiny">Your choice: ${escapeHtml(selectedAnswer)}</p>` : `<p class="tiny">No choice selected.</p>`}
            <p class="tiny">Correct answer: ${escapeHtml(correctAnswer)}</p>
          `
          : ""
      }
      ${Array.isArray(question.accepted_keywords) && question.accepted_keywords.length ? `<p class="tiny muted">Keywords: ${escapeHtml(question.accepted_keywords.join(", "))}</p>` : ""}
    `,
  });
}

async function renderReadingTab() {
  const prefs = persisted.prefs.passages;
  const groups = listPassageGroups(runtime.manifest);
  if (!groups.length) {
    return renderUnavailable("No reading passage packs were found.");
  }

  // Bootstrap subject pref from current groupId if not yet set.
  if (!prefs.subject) {
    const currentGroup = groups.find((g) => g.id === prefs.groupId);
    prefs.subject = currentGroup ? getPassageGroupSubject(currentGroup) : "language";
  }

  // If the stored groupId belongs to a different subject, snap to first group
  // for the current subject (happens when subject card is clicked).
  const storedGroupSubject = getPassageGroupSubject(groups.find((g) => g.id === prefs.groupId));
  if (storedGroupSubject !== prefs.subject) {
    const groupsForSubject = listPassageGroupsBySubject(runtime.manifest, prefs.subject);
    if (groupsForSubject.length) {
      prefs.groupId = groupsForSubject[0].id;
      const newPacks = listPassagePacks(runtime.manifest, prefs.groupId);
      prefs.packId = newPacks[0] ? newPacks[0].id : "";
      runtime.passages = null;
    }
  }

  const packs = listPassagePacks(runtime.manifest, prefs.groupId);
  if (!packs.length) {
    return renderUnavailable("No reading packs found for the selected book.");
  }
  const groupsForSubject = listPassageGroupsBySubject(runtime.manifest, prefs.subject);

  if (!runtime.passages || runtime.passages.groupId !== prefs.groupId || runtime.passages.packId !== prefs.packId) {
    await resetPassageRuntime(prefs.groupId, prefs.packId);
  }

  const passages = runtime.passages;
  const stats = getPassageStats(persisted, prefs.packId);
  const playableCount = getPlayablePassages().length;
  const setupMessage = playableCount > 0 ? "" : "No passages match the current category and difficulty filters.";
  const shouldShowCompletedCount = playableCount > 0;
  const shouldShowGroupSelect = groupsForSubject.length > 1;
  const shouldShowPackSelect = packs.length > 1;
  const setField = shouldShowPackSelect
    ? renderSelectField("passage-pack", "Set", packs.map((pack) => ({ value: pack.id, label: pack.displayName })), prefs.packId)
    : "";

  if (!passages.started) {
    return `
      <div class="section-stack">
        <section class="passage-shell lead">
          <div class="question-meta">
            <div>
              <h2>Reading practice</h2>
              <p class="muted tiny">Listen first, answer in English or choose the best option, then reveal the translation and model responses.</p>
            </div>
            ${shouldShowCompletedCount ? `<span class="count-pill blue">${stats.passagesCompleted} completed</span>` : ""}
          </div>

          ${renderPassageSubjectCardGrid(prefs.subject)}

          <div class="form-grid" style="margin-top:18px;">
            ${shouldShowGroupSelect ? renderPassageGroupSelectFiltered(prefs.groupId, prefs.subject) : ""}
            ${setField}
            ${renderSelectField("passage-category", "Category", [{ value: "all", label: "All categories" }, ...passages.categoryOptions.map((item) => ({ value: item, label: humanizeLabel(item) }))], prefs.category)}
            ${renderSelectField("passage-difficulty", "Difficulty", [
              { value: "all", label: "All questions" },
              { value: "easy", label: "Easy only" },
              { value: "medium", label: "Medium only" },
              { value: "hard", label: "Hard only" },
            ], prefs.difficulty)}
          </div>
          <div class="toggle-row" style="margin-top:18px;">
            <label class="mode-check">
              <input type="checkbox" id="passage-show-german" ${prefs.showGerman ? "checked" : ""} />
              <span><strong>Show source text</strong><br /><span class="muted tiny">Hide it by default if you want a listening-first flow.</span></span>
            </label>
            <label class="mode-check">
              <input type="checkbox" id="passage-voice" ${prefs.voiceEnabled ? "checked" : ""} />
              <span><strong>Autoplay voice</strong><br /><span class="muted tiny">Use browser speech synthesis for the source passage.</span></span>
            </label>
          </div>
          <div class="action-row" style="margin-top:18px;">
            <button class="button" data-action="reading-start">Start reading practice</button>
          </div>
          ${setupMessage ? `<p class="muted tiny" style="margin-top:12px;">${escapeHtml(setupMessage)}</p>` : ""}
        </section>
      </div>
    `;
  }

  const current = passages.current;
  const visibleQuestions = getVisibleQuestions(current, prefs.difficulty);
  const speechSupported = "speechSynthesis" in window;

  return `
    <div class="section-stack">
      <section class="passage-shell lead">
        ${renderQuestionBox({
          eyebrow: `${current.chapter} · ${current.section}`,
          modeLabel: "Reading practice",
          prompt: current.title_de,
          subtitle: `${current.title_en} · ${current.level} · ${current.topic}`,
          sideContent: `
            <div class="chip-row">
              <span class="count-pill blue">${passages.completedThisSession} completed this session</span>
              <button class="button ghost" data-action="play-passage">Play source text</button>
              ${speechSupported ? `<button class="button ghost" data-action="stop-passage">Stop audio</button>` : ""}
            </div>
          `,
        })}
        ${prefs.showGerman ? `<blockquote style="margin-top:18px;">${escapeHtml(current.passage_de)}</blockquote>` : `<p class="muted tiny" style="margin-top:18px;">Source text hidden. Listen first, then reveal when you need it.</p>`}
      </section>

      <section class="passage-shell">
        <h2>Questions</h2>
        <div class="section-stack" style="margin-top:16px;">
          ${visibleQuestions
            .map(
              (question, index) => `
                <article class="section-card">
                  <div class="chip-row" style="margin-bottom:10px;">
                    ${question.type ? `<span class="badge blue">${escapeHtml(question.type)}</span>` : ""}
                    ${question.difficulty ? `<span class="badge amber">${escapeHtml(question.difficulty)}</span>` : ""}
                  </div>
                  <div class="passage-question-copy">
                    <div class="passage-question-label">Question ${index + 1}</div>
                    <div class="passage-question-prompt">${escapeHtml(fallback(question.question_en, fallback(question.question, "Question prompt missing")))}</div>
                  </div>
                  ${renderPassageQuestionInput(question, passages)}
                  ${passages.revealed ? renderPassageQuestionReveal(question, passages) : ""}
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      ${
        passages.revealed
          ? `
            <section class="passage-shell">
              <h2>Translation / reveal</h2>
              <blockquote style="margin-top:16px;">${escapeHtml(current.passage_en)}</blockquote>
            </section>
          `
          : ""
      }

      <section class="passage-shell">
        <div class="action-row">
          ${!passages.revealed ? `<button class="button" data-action="reading-reveal">Reveal translation + model answers</button>` : `<button class="button" data-action="reading-next">Next passage</button>`}
          <button class="button ghost" data-action="reading-reset">Back to setup</button>
        </div>
      </section>
    </div>
  `;
}

async function renderReviewTab() {
  const prefs = persisted.prefs.review;
  const dataset = findDataset(runtime.manifest, prefs.datasetId);
  const words = await loadVocabItems(runtime.manifest, dataset.id);
  const reviewedWords = words.filter((word) => {
    const progress = getWordProgress(persisted, word.id);
    return progress.correct || progress.wrong;
  });

  const hardest = [...reviewedWords]
    .sort((left, right) => {
      const a = getWordProgress(persisted, left.id);
      const b = getWordProgress(persisted, right.id);
      return (b.wrong - b.correct) - (a.wrong - a.correct) || b.wrong - a.wrong;
    })
    .slice(0, 12);
  const mastered = reviewedWords.filter((word) => isMasteredProgress(getWordProgress(persisted, word.id))).slice(0, 12);
  runtime.reviewContext = { hardest, mastered };

  return `
    <div class="section-stack">
      <section class="review-card lead">
        <div class="question-meta">
          <div>
            <h2>Review desk</h2>
            <p class="muted tiny">See which words need more reps and launch focused review quizzes from here.</p>
          </div>
          <div class="chip-row">
            <span class="count-pill blue">${reviewedWords.length} reviewed words</span>
            <span class="count-pill green">${mastered.length} mastered in view</span>
          </div>
        </div>
        <div class="form-grid" style="margin-top:18px;">
          ${renderDatasetSelect("review-dataset", prefs.datasetId)}
        </div>
        <div class="review-actions" style="margin-top:18px;">
          <button class="button" data-action="review-hardest" ${hardest.length ? "" : "disabled"}>Quiz hardest words</button>
          <button class="button secondary" data-action="review-mastered" ${mastered.length ? "" : "disabled"}>Review mastered words</button>
        </div>
      </section>

      <section class="review-grid">
        <article class="review-card">
          <h3>Needs review</h3>
          <div class="review-list" style="margin-top:16px;">
            ${hardest.length
              ? hardest.map((word) => renderReviewWordCard(word, dataset)).join("")
              : renderEmptyStateCard({
                  eyebrow: "Review",
                  title: "No hard words yet",
                  body: "Take a quiz first to populate your review list.",
                })}
          </div>
        </article>
        <article class="review-card">
          <h3>Mastered</h3>
          <div class="review-list" style="margin-top:16px;">
            ${mastered.length
              ? mastered.map((word) => renderReviewWordCard(word, dataset)).join("")
              : renderEmptyStateCard({
                  eyebrow: "Review",
                  title: "No mastered words yet",
                  body: "Your strongest words will appear here after a few sessions.",
                })}
          </div>
        </article>
      </section>
    </div>
  `;
}

function renderReviewWordCard(word, dataset) {
  const progress = getWordProgress(persisted, word.id);
  return `
    <div class="review-item">
      <div class="review-item-main">
        <strong>${escapeHtml(word.de)}</strong>
        <span class="muted tiny">${escapeHtml(word.en)} · correct ${progress.correct} · wrong ${progress.wrong}</span>
      </div>
      <button class="button ghost" data-action="speak" data-text="${escapeHtml(word.de)}" data-language="${escapeHtml(getStudyLanguageCode(dataset))}">Speak</button>
    </div>
  `;
}

function renderUnavailable(message) {
  return `
    <section class="empty-state">
      <div class="empty-card">
        ${renderEmptyStateCard({
          eyebrow: "Learning Web",
          title: "Not available yet",
          body: message,
        })}
      </div>
    </section>
  `;
}

function countPassageMcqQuestions(unifiedPack) {
  if (!unifiedPack || !Array.isArray(unifiedPack.items)) {
    return 0;
  }
  let total = 0;
  for (const item of unifiedPack.items) {
    if (item.type !== "passage") {
      continue;
    }
    const questions = Array.isArray(item.data && item.data.questions) ? item.data.questions : [];
    for (const question of questions) {
      const options = Array.isArray(question.options) ? question.options.filter(Boolean) : [];
      const correctAnswer = question.correctAnswer
        || question.correct_answer
        || question.modelAnswer
        || question.model_answer_en
        || (Number.isInteger(question.correctOptionIndex) ? options[question.correctOptionIndex] : "")
        || (Number.isInteger(question.correct_option_index) ? options[question.correct_option_index] : "");
      if (question.question && options.length >= 2 && correctAnswer) {
        total += 1;
      }
    }
  }
  return total;
}

function getQuizMaxQuestionCount({ dataset, prefs, filteredWords, unifiedPack, passageUnifiedPack }) {
  const modes = resolveQuizModesForUI({
    subject: getDatasetSubject(dataset),
    direction: prefs.direction,
    answerMode: prefs.answerMode,
  });

  return modes.reduce((total, modeId) => {
    switch (modeId) {
      case "englishWordChooseGerman":
      case "germanWordChooseEnglish":
      case "englishWordTypeGerman":
      case "germanWordTypeEnglish":
        return total + filteredWords.length;
      case "englishSentenceBuildGerman":
      case "germanSentenceBuildEnglish":
      case "englishSentenceTypeGerman":
        return total + filterUnifiedItems(unifiedPack, "sentence").length;
      case "sequenceOrder":
        return total + filterUnifiedItems(unifiedPack, "sequence").length;
      case "categorySort":
        return total + filterUnifiedItems(unifiedPack, "categorySort").length;
      case "fillBlank":
        return total + filterUnifiedItems(unifiedPack, "fillBlank").length;
      case "passageQuestionChooseAnswer":
        return total + countPassageMcqQuestions(passageUnifiedPack);
      default:
        return total;
    }
  }, 0);
}

function buildQuestionCountOptions(maxQuestionCount) {
  const defaults = [12, 18, 24, 30];
  const limited = defaults.filter((value) => value <= maxQuestionCount);
  if (maxQuestionCount > 0 && !limited.includes(maxQuestionCount)) {
    limited.push(maxQuestionCount);
  }
  const options = [...new Set(limited)].sort((a, b) => a - b);
  return options.map((value) => ({ value: String(value), label: String(value) }));
}

function renderDatasetSelect(id, currentValue) {
  return renderSelectField(
    id,
    "Dataset",
    listDatasets(runtime.manifest).map((dataset) => ({
      value: dataset.id,
      label: `${dataset.displayName}${dataset.wordCount ? ` (${dataset.wordCount})` : ""}`,
    })),
    currentValue,
  );
}

// ─── Subject First render helpers ───────────────────────────────────────

const SUBJECT_LABELS = {
  language:   { label: "Language",   icon: "🌐" },
  history:    { label: "History",    icon: "📜" },
  geography:  { label: "Geography",  icon: "🌍" },
  science:    { label: "Science",    icon: "🔬" },
  literature: { label: "Literature", icon: "📖" },
};

function renderSubjectCardGrid(activeSubject) {
  const cards = SUBJECTS.map((subject) => {
    const meta = SUBJECT_LABELS[subject];
    const datasets = listDatasetsBySubject(runtime.manifest, subject);
    const isActive = subject === activeSubject;
    const isEmpty = datasets.length === 0;
    const classes = ["subject-card"];
    if (isActive) classes.push("is-active");
    if (isEmpty) classes.push("is-empty");
    const button = isEmpty ? "" : `data-action="select-subject" data-value="${escapeHtml(subject)}"`;
    return `
      <button type="button" class="${classes.join(" ")}" ${button} ${isEmpty ? "disabled" : ""}>
        <span class="subject-icon" aria-hidden="true">${meta.icon}</span>
        <span class="subject-label">${escapeHtml(meta.label)}</span>
        ${isEmpty
          ? `<span class="subject-meta">Coming soon</span>`
          : `<span class="subject-meta">${datasets.length} pack${datasets.length === 1 ? "" : "s"}</span>`}
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you learning?</div>
      <div class="subject-card-grid">${cards}</div>
    </div>
  `;
}

function renderPassageSubjectCardGrid(activeSubject) {
  const cards = SUBJECTS.map((subject) => {
    const meta = SUBJECT_LABELS[subject];
    const groups = listPassageGroupsBySubject(runtime.manifest, subject);
    const isActive = subject === activeSubject;
    const isEmpty = groups.length === 0;
    const classes = ["subject-card"];
    if (isActive) classes.push("is-active");
    if (isEmpty) classes.push("is-empty");
    const button = isEmpty ? "" : `data-action="select-passage-subject" data-value="${escapeHtml(subject)}"`;
    return `
      <button type="button" class="${classes.join(" ")}" ${button} ${isEmpty ? "disabled" : ""}>
        <span class="subject-icon" aria-hidden="true">${meta.icon}</span>
        <span class="subject-label">${escapeHtml(meta.label)}</span>
        ${isEmpty
          ? `<span class="subject-meta">No packs yet</span>`
          : `<span class="subject-meta">${groups.length} book${groups.length === 1 ? "" : "s"}</span>`}
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you studying?</div>
      <div class="subject-card-grid">${cards}</div>
    </div>
  `;
}

function renderPassageGroupSelectFiltered(currentValue, subject) {
  const groups = listPassageGroupsBySubject(runtime.manifest, subject);
  if (!groups.length) {
    return `
      <div class="field">
        <label>Book / Group</label>
        <p class="muted tiny" style="margin-top:6px;">No reading packs yet for this subject.</p>
      </div>
    `;
  }
  return renderSelectField(
    "passage-group",
    "Book / Group",
    groups.map((group) => ({ value: group.id, label: group.displayName })),
    currentValue,
  );
}

function renderDatasetSelectFiltered(id, currentValue, subject) {
  const datasets = listDatasetsBySubject(runtime.manifest, subject);
  if (!datasets.length) {
    return `
      <div class="field">
        <label>Dataset</label>
        <p class="muted tiny" style="margin-top:6px;">No datasets yet for this subject.</p>
      </div>
    `;
  }
  return renderSelectField(
    id,
    "Dataset",
    datasets.map((dataset) => ({
      value: dataset.id,
      label: `${dataset.displayName}${dataset.wordCount ? ` (${dataset.wordCount})` : ""}`,
    })),
    currentValue,
  );
}

function renderDirectionToggle(dataset, currentDirection) {
  const directions = getDatasetDirections(dataset);
  if (!directions.length) return "";
  const buttons = directions.map((dir) => {
    const isActive = dir.id === currentDirection;
    return `
      <button type="button"
              class="pill-button ${isActive ? "is-active" : ""}"
              data-action="select-direction"
              data-value="${escapeHtml(dir.id)}">
        ${escapeHtml(dir.label)}
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">Direction</div>
      <div class="pill-row">${buttons}</div>
    </div>
  `;
}

const ANSWER_MODE_LABELS = [
  { id: "mcq",   label: "Multiple Choice", help: "Pick from options" },
  { id: "typed", label: "Type Answer",     help: "Type the answer" },
  { id: "mixed", label: "Mixed Mode",      help: "A bit of both" },
];

function renderAnswerModePills(currentMode) {
  const buttons = ANSWER_MODE_LABELS.map((mode) => {
    const isActive = mode.id === currentMode;
    return `
      <button type="button"
              class="pill-button mode-pill ${isActive ? "is-active" : ""}"
              data-action="select-answer-mode"
              data-value="${escapeHtml(mode.id)}">
        <strong>${escapeHtml(mode.label)}</strong>
        <span class="muted tiny">${escapeHtml(mode.help)}</span>
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">How to answer?</div>
      <div class="pill-row mode-pill-row">${buttons}</div>
    </div>
  `;
}

function renderYearSelect(id, currentValue) {
  return renderSelectField(
    id,
    "Year",
    YEAR_OPTIONS.map((year) => ({ value: year, label: year })),
    currentValue,
  );
}

function renderStageFieldset(sectionKey, stageOptions, selectedStages) {
  return `
    <div class="field stage-field" style="grid-column:1/-1;">
      <div class="fieldset-title">Stages</div>
      <div class="stage-check-list">
        ${stageOptions
          .map(
            (stage) => `
              <label class="mode-check stage-check">
                <input
                  type="checkbox"
                  name="${escapeHtml(sectionKey)}-stage"
                  data-stage="${escapeHtml(stage)}"
                  ${selectedStages.includes(String(stage)) ? "checked" : ""}
                />
                <span><strong>Stage ${escapeHtml(stage)}</strong></span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderSelectField(id, label, options, currentValue) {
  return `
    <div class="field">
      <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
      <select id="${escapeHtml(id)}" class="select">
        ${options
          .map(
            (option) => `
              <option value="${escapeHtml(option.value)}" ${String(option.value) === String(currentValue) ? "selected" : ""}>
                ${escapeHtml(option.label)}
              </option>
            `,
          )
          .join("")}
      </select>
    </div>
  `;
}

// ─── Admin tab ────────────────────────────────────────────────────────────────

const ITEM_TYPE_LABELS = {
  vocab:           "Vocab",
  sentence:        "Sentences",
  sequence:        "Sequences",
  categorySort:    "Sort",
  fillBlank:       "Fill-blank",
  sentenceBuilder: "Builder cards",
  passage:         "Passages",
};

const SECTION_LABELS = {
  revisionPacks:        "Quiz / Vocab",
  passageGroups:        "Reading",
  sentenceBuilderPacks: "Sentence Builder",
};

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function renderAdminTab() {
  const packs = listUploadedPacks();
  const status = runtime.adminUploadStatus;

  // Compute rough storage used
  const totalBytes = packs.reduce((sum, p) => sum + (p.sizeBytes || 0), 0);

  const statusHtml = status
    ? `
      <div class="admin-status ${status.ok ? "admin-status-ok" : "admin-status-error"}">
        <span class="admin-status-icon" aria-hidden="true">${status.ok ? "✓" : "✗"}</span>
        <div>
          <strong>${status.ok ? "Pack uploaded successfully" : "Upload failed"}</strong>
          <p class="tiny">${escapeHtml(status.message)}</p>
        </div>
      </div>
    `
    : "";

  const packListHtml = packs.length === 0
    ? `<p class="muted tiny" style="margin-top:8px;">No packs uploaded yet.</p>`
    : packs.map((entry) => {
        const typeChips = Object.entries(entry.typeCounts || {})
          .filter(([t]) => ITEM_TYPE_LABELS[t])
          .map(([t, count]) =>
            `<span class="chip blue">${ITEM_TYPE_LABELS[t]}: ${count}</span>`,
          )
          .join(" ");
        const sectionChips = (entry.sections || [])
          .map((s) => `<span class="chip">${SECTION_LABELS[s] || s}</span>`)
          .join(" ");
        const addedDate = entry.addedAt
          ? new Date(entry.addedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
          : "Unknown date";

        return `
          <div class="admin-pack-card">
            <div class="admin-pack-header">
              <div>
                <div class="admin-pack-name">${escapeHtml(entry.displayName)}</div>
                <div class="admin-pack-id muted tiny">${escapeHtml(entry.id)}</div>
              </div>
              <button
                class="button button-ghost button-sm button-danger"
                data-action="admin-delete-pack"
                data-pack-id="${escapeHtml(entry.id)}"
                title="Delete this uploaded pack"
              >Delete</button>
            </div>
            <div class="admin-pack-chips" style="margin-top:10px;">
              ${typeChips}
            </div>
            <div class="admin-pack-chips" style="margin-top:6px;">
              ${sectionChips}
            </div>
            <div class="admin-pack-meta muted tiny" style="margin-top:8px;">
              ${entry.subject ? `Subject: <strong>${escapeHtml(entry.subject)}</strong> &middot; ` : ""}
              ${entry.itemCount} items &middot; ${formatBytes(entry.sizeBytes)} &middot; Added ${addedDate}
            </div>
          </div>
        `;
      }).join("");

  // ── Progress management data ──────────────────────────────────────────────
  const wordEntries = Object.entries(persisted.progress.words)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.wrong - b.correct) - (a.wrong - a.correct))
    .slice(0, 20);

  const wordTableHtml = wordEntries.length
    ? `
      <div style="overflow-x:auto;margin-top:12px;">
        <table style="width:100%;border-collapse:collapse;font-size:0.82rem;">
          <thead>
            <tr style="border-bottom:2px solid #e0e0e0;text-align:left;">
              <th style="padding:6px 8px;">Word / ID</th>
              <th style="padding:6px 8px;text-align:center;">✓ Right</th>
              <th style="padding:6px 8px;text-align:center;">✗ Wrong</th>
              <th style="padding:6px 8px;text-align:center;">Streak</th>
              <th style="padding:6px 8px;text-align:center;">Mastered</th>
              <th style="padding:6px 8px;"></th>
            </tr>
          </thead>
          <tbody>
            ${wordEntries.map((w) => {
              const mastered = w.correct >= 3 && w.streak >= 2;
              return `
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:5px 8px;" class="muted tiny">${escapeHtml(w.id)}</td>
                  <td style="padding:5px 8px;text-align:center;color:#1a7a3a;">${w.correct}</td>
                  <td style="padding:5px 8px;text-align:center;color:#c00;">${w.wrong}</td>
                  <td style="padding:5px 8px;text-align:center;">${w.streak}</td>
                  <td style="padding:5px 8px;text-align:center;">${mastered ? "✓" : "—"}</td>
                  <td style="padding:5px 8px;text-align:right;">
                    <button class="button ghost button-danger" style="font-size:0.75rem;padding:2px 8px;" data-action="admin-reset-word" data-word-id="${escapeHtml(w.id)}" title="Reset progress for this word">Reset</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `
    : `<p class="muted tiny" style="margin-top:8px;">No word progress recorded yet.</p>`;

  return `
    <div class="section-stack">

      <section class="section-card">
        <h2>Progress Management</h2>
        <p class="muted tiny">Clear stored quiz history or reset word mastery. This affects only this browser — nothing is sent anywhere.</p>
        <div class="action-row" style="margin-top:14px;flex-wrap:wrap;gap:10px;">
          <button class="button secondary" data-action="admin-clear-sessions" ${persisted.progress.sessions.length === 0 ? "disabled" : ""}>
            Clear all sessions (${persisted.progress.sessions.length})
          </button>
          <button class="button secondary" data-action="admin-clear-words" ${wordEntries.length === 0 ? "disabled" : ""}>
            Reset all word progress (${Object.keys(persisted.progress.words).length} words)
          </button>
        </div>

        <h3 style="margin-top:20px;font-size:0.95rem;">Most struggled words (top 20)</h3>
        ${wordTableHtml}
      </section>

      <section class="section-card">
        <h2>Pack Admin</h2>
        <p class="muted tiny">
          Upload a unified pack JSON file to add it directly to the app — no server required.
          The pack will appear in all compatible game modes (Quiz, Vocab, Reading, Builder)
          immediately and will persist across page reloads via browser storage.
        </p>

        <div class="admin-drop-zone" id="admin-drop-zone">
          <div class="admin-drop-icon" aria-hidden="true">📂</div>
          <p class="admin-drop-label">Drop a <strong>pack_unified.json</strong> file here, or click to browse</p>
          <p class="muted tiny">Accepts any unified pack JSON with an <code>items</code> array</p>
          <input
            type="file"
            id="admin-file-upload"
            accept=".json,application/json"
            style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;"
          />
        </div>

        ${statusHtml}
      </section>

      <section class="section-card">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <h2 style="margin:0;">Uploaded Packs <span class="chip">${packs.length}</span></h2>
          ${packs.length > 0 ? `<span class="muted tiny">${formatBytes(totalBytes)} used in browser storage</span>` : ""}
        </div>
        <div class="admin-pack-list" style="margin-top:16px;">
          ${packListHtml}
        </div>
      </section>

      <section class="section-card">
        <h2>Pack JSON format</h2>
        <p class="muted tiny">
          Your JSON file needs an <code>items</code> array. Each item needs a <code>type</code> field.
          The pack is automatically routed to the right game modes based on the item types present.
        </p>
        <div class="admin-format-grid">
          ${Object.entries(SECTION_LABELS).map(([section, label]) => {
            const typesForSection = {
              revisionPacks:        ["vocab", "sentence", "sequence", "categorySort", "fillBlank"],
              passageGroups:        ["passage"],
              sentenceBuilderPacks: ["sentenceBuilder"],
            }[section] || [];
            return `
              <div class="admin-format-card">
                <div class="admin-format-label">${escapeHtml(label)}</div>
                <div class="admin-pack-chips" style="margin-top:8px;">
                  ${typesForSection.map((t) => `<span class="chip">${ITEM_TYPE_LABELS[t]}</span>`).join(" ")}
                </div>
              </div>
            `;
          }).join("")}
        </div>
        <pre class="admin-schema-preview"><code>{
  "packId": "my_pack_id",          <span class="muted">// or "id"</span>
  "title": "My Custom Pack",
  "subject": "history",            <span class="muted">// language|history|geography|science|literature</span>
  "sourceLanguageCode": "de-DE",   <span class="muted">// optional</span>
  "targetLanguageCode": "en-GB",   <span class="muted">// optional</span>
  "items": [
    {
      "id": "item_001",
      "type": "vocab",             <span class="muted">// see types above</span>
      "level": "Y8",
      "topics": ["animals"],
      "data": { "sourceWord": "der Hund", "targetWord": "the dog" }
    }
  ]
}</code></pre>
      </section>
    </div>
  `;
}

// ─── Admin file upload handler ────────────────────────────────────────────────

async function handleAdminFileUpload(file) {
  if (!file) return;
  runtime.adminUploadStatus = null;

  const text = await file.text().catch(() => null);
  if (!text) {
    runtime.adminUploadStatus = { ok: false, message: "Could not read file." };
    await renderApp();
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    runtime.adminUploadStatus = { ok: false, message: `Invalid JSON: ${e.message}` };
    await renderApp();
    return;
  }

  // Quick pre-validation before saving
  const validation = validatePack(parsed);
  if (!validation.ok) {
    runtime.adminUploadStatus = { ok: false, message: validation.error };
    await renderApp();
    return;
  }

  const result = saveUploadedPack(parsed, file.name);
  if (!result.ok) {
    runtime.adminUploadStatus = { ok: false, message: result.error };
    await renderApp();
    return;
  }

  // Inject new pack into live manifest + cache so game modes see it immediately.
  hydrateManifest(runtime.manifest, registerPackInCache);
  ensurePreferenceDefaults();

  const { entry } = result;
  const typesSummary = Object.entries(entry.typeCounts || {})
    .filter(([t]) => ITEM_TYPE_LABELS[t])
    .map(([t, n]) => `${n} ${ITEM_TYPE_LABELS[t]}`)
    .join(", ");
  const sectionsSummary = (entry.sections || [])
    .map((s) => SECTION_LABELS[s] || s)
    .join(", ");

  runtime.adminUploadStatus = {
    ok: true,
    message:
      `"${entry.displayName}" loaded with ${typesSummary}. ` +
      `Available in: ${sectionsSummary}.`,
    entry,
  };

  await renderApp();
}

async function handleClick(event) {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    stopSpeaking();
    persisted.activeTab = tabButton.dataset.tab;
    saveStoredState(persisted);
    runtime.currentQuiz = runtime.currentQuiz && runtime.currentQuiz.completed ? null : runtime.currentQuiz;
    await renderApp();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) {
    return;
  }

  const { action } = actionButton.dataset;

  if (action === "speak") {
    speakText(actionButton.dataset.text, actionButton.dataset.language);
    return;
  }

  switch (action) {
    // ── Session history actions ────────────────────────────────────────────
    case "session-detail": {
      const fromAll = actionButton.dataset.fromAll === "true";
      runtime.sessionDetail = { sessionId: actionButton.dataset.sessionId, view: "detail", fromAll };
      persisted.activeTab = "home";
      saveStoredState(persisted);
      await renderApp();
      window.scrollTo(0, 0);
      return;
    }
    case "session-detail-back": {
      // If we came from "all sessions" sub-view go back to it, otherwise back to home
      const wasAll = runtime.sessionDetail && runtime.sessionDetail.view === "detail" && runtime.sessionDetail.fromAll;
      runtime.sessionDetail = wasAll ? { view: "all" } : null;
      await renderApp();
      window.scrollTo(0, 0);
      return;
    }
    case "session-history-all": {
      runtime.sessionDetail = { view: "all" };
      persisted.activeTab = "home";
      saveStoredState(persisted);
      await renderApp();
      window.scrollTo(0, 0);
      return;
    }
    case "session-delete": {
      const sid = actionButton.dataset.sessionId;
      if (!sid) return;
      const s = persisted.progress.sessions.find((x) => x.id === sid);
      const label = s ? fallback(s.label, "this session") : "this session";
      if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
      deleteSession(persisted, sid);
      saveStoredState(persisted);
      // If we were in the detail view for this session, go back
      if (runtime.sessionDetail && runtime.sessionDetail.sessionId === sid) {
        runtime.sessionDetail = null;
      }
      await renderApp();
      return;
    }
    case "session-clear-all": {
      if (!window.confirm(`Delete all ${persisted.progress.sessions.length} sessions? This cannot be undone.`)) return;
      clearAllSessions(persisted);
      saveStoredState(persisted);
      runtime.sessionDetail = null;
      await renderApp();
      return;
    }
    case "session-requiz": {
      const sid = actionButton.dataset.sessionId;
      const s = persisted.progress.sessions.find((x) => x.id === sid);
      if (!s || !Array.isArray(s.answers)) return;
      const wrongAnswers = s.answers.filter((a) => !a.correct);
      if (!wrongAnswers.length) return;
      // Collect the wordIds from wrong answers; fall back gracefully if none were recorded
      const missedWordIds = new Set(wrongAnswers.map((a) => a.wordId).filter(Boolean));
      let customWords = null;
      if (missedWordIds.size > 0) {
        // Look up real vocab items from the session's dataset so the quiz engine
        // gets properly shaped records (de, en, id, etc.)
        const sessionDataset = findDataset(runtime.manifest, fallback(s.datasetId, "core"));
        const allVocab = await loadVocabItems(runtime.manifest, sessionDataset.id);
        const matched = allVocab.filter((w) => missedWordIds.has(w.id));
        if (matched.length) customWords = matched;
      }
      runtime.sessionDetail = null;
      await startQuiz(customWords, `Re-quiz: ${fallback(s.label, "missed words")}`);
      return;
    }
    // ── Admin: progress management ────────────────────────────────────────
    case "admin-clear-sessions": {
      if (!window.confirm(`Delete all ${persisted.progress.sessions.length} quiz sessions? This cannot be undone.`)) return;
      clearAllSessions(persisted);
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "admin-clear-words": {
      const count = Object.keys(persisted.progress.words).length;
      if (!window.confirm(`Reset progress for all ${count} word(s)? Streaks, correct counts, and mastery will be cleared.`)) return;
      clearAllWordProgress(persisted);
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "admin-reset-word": {
      const wordId = actionButton.dataset.wordId;
      if (!wordId) return;
      resetWordProgress(persisted, wordId);
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "admin-delete-pack": {
      const packId = actionButton.dataset.packId;
      if (packId && window.confirm(`Delete uploaded pack "${packId}"? This cannot be undone.`)) {
        deleteUploadedPack(packId);
        // Rebuild manifest without the deleted pack
        runtime.manifest = await loadManifest();
        hydrateManifest(runtime.manifest, registerPackInCache);
        runtime.adminUploadStatus = null;
        await renderApp();
      }
      return;
    }
    case "open-review":
      persisted.activeTab = "review";
      saveStoredState(persisted);
      await renderApp();
      return;
    case "start-quiz":
      await startQuiz();
      return;
    case "select-subject": {
      // Switch to a new subject and pick its first dataset automatically.
      const nextSubject = actionButton.dataset.value;
      const datasets = listDatasetsBySubject(runtime.manifest, nextSubject);
      if (!datasets.length) return; // disabled card was clicked somehow
      persisted.prefs.quiz.subject = nextSubject;
      persisted.prefs.quiz.datasetId = datasets[0].id;
      applyDatasetDefaults("quiz", { resetStages: true, resetQuizModes: true });
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-passage-subject": {
      const nextSubject = actionButton.dataset.value;
      const groupsForSubject = listPassageGroupsBySubject(runtime.manifest, nextSubject);
      if (!groupsForSubject.length) return;
      persisted.prefs.passages.subject = nextSubject;
      persisted.prefs.passages.groupId = groupsForSubject[0].id;
      const firstPacks = listPassagePacks(runtime.manifest, groupsForSubject[0].id);
      persisted.prefs.passages.packId = firstPacks[0] ? firstPacks[0].id : "";
      persisted.prefs.passages.category = "all";
      persisted.prefs.passages.difficulty = "all";
      runtime.passages = null;
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-direction":
      persisted.prefs.quiz.direction = actionButton.dataset.value;
      saveStoredState(persisted);
      await renderApp();
      return;
    case "select-answer-mode":
      persisted.prefs.quiz.answerMode = actionButton.dataset.value;
      saveStoredState(persisted);
      await renderApp();
      return;
    case "quiz-choice":
      await answerQuizQuestion(actionButton.dataset.value);
      return;
    case "quiz-check-typed": {
      const input = document.querySelector("#quiz-typed-answer");
      await answerQuizQuestion(input ? input.value : "");
      return;
    }
    case "quiz-build-pick":
      moveQuizTile(actionButton.dataset.tileId, "bank");
      await renderApp();
      return;
    case "quiz-build-return":
      moveQuizTile(actionButton.dataset.tileId, "answer");
      await renderApp();
      return;
    case "quiz-build-clear":
      clearQuizTiles();
      await renderApp();
      return;
    case "quiz-build-hint":
      useQuizHint();
      await renderApp();
      return;
    case "quiz-check-build": {
      const response = runtime.currentQuiz.buildState.answerTiles.map((tile) => tile.text).join(" ");
      await answerQuizQuestion(response);
      return;
    }
    case "quiz-next":
      nextQuizQuestion();
      await renderApp();
      return;
    case "restart-quiz":
      await startQuiz(runtime.currentQuiz ? runtime.currentQuiz.sourceWords || null : null, runtime.currentQuiz ? runtime.currentQuiz.label : null);
      return;
    case "end-quiz":
      runtime.currentQuiz = null;
      await renderApp();
      return;
    case "quiz-review-missed":
      await startQuiz(runtime.currentQuiz ? runtime.currentQuiz.missedWords || [] : [], "Missed words review");
      return;
    case "builder-pick":
      moveBuilderTile(actionButton.dataset.tileId, "bank");
      await renderApp();
      return;
    case "builder-return":
      moveBuilderTile(actionButton.dataset.tileId, "answer");
      await renderApp();
      return;
    case "builder-clear":
      runtime.builder.bankTiles.push(...runtime.builder.answerTiles);
      runtime.builder.answerTiles = [];
      runtime.builder.feedback = null;
      await renderApp();
      return;
    case "builder-hint":
      useBuilderHint();
      await renderApp();
      return;
    case "builder-check":
      checkBuilderAnswer();
      await renderApp();
      return;
    case "builder-next":
      advanceBuilderCard(true);
      await renderApp();
      return;
    case "passage-choice": {
      if (!runtime.passages || runtime.passages.revealed || !runtime.passages.current) {
        return;
      }
      const question = runtime.passages.current.questions.find((item) => item.id === actionButton.dataset.questionId);
      const optionIndex = Number(actionButton.dataset.optionIndex);
      if (!question || !Array.isArray(question.options) || !Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= question.options.length) {
        return;
      }
      runtime.passages.answers[question.id] = question.options[optionIndex];
      await renderApp();
      return;
    }
    case "reading-start":
      startReadingSession();
      await renderApp();
      return;
    case "play-passage":
      playCurrentPassage();
      return;
    case "stop-passage":
      stopSpeaking();
      return;
    case "reading-reveal":
      revealCurrentPassage();
      await renderApp();
      return;
    case "reading-next":
      stopSpeaking();
      advancePassage();
      await renderApp();
      return;
    case "reading-reset":
      stopSpeaking();
      runtime.passages.started = false;
      await renderApp();
      return;
    case "review-hardest":
      await startQuiz(runtime.reviewContext.hardest, "Hardest words review");
      return;
    case "review-mastered":
      await startQuiz(runtime.reviewContext.mastered, "Mastered words refresh");
      return;

    // --- New geography game type handlers ---
    case "quiz-seq-select": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const idx = Number(actionButton.dataset.index);
      const bs = session.buildState;
      if (bs.selectedIndex === null) {
        bs.selectedIndex = idx;
      } else if (bs.selectedIndex === idx) {
        bs.selectedIndex = null;
      } else {
        // swap
        const a = bs.selectedIndex, b = idx;
        [bs.userOrder[a], bs.userOrder[b]] = [bs.userOrder[b], bs.userOrder[a]];
        bs.selectedIndex = null;
      }
      await renderApp();
      return;
    }
    case "quiz-seq-shuffle": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      session.buildState.userOrder = shuffle([...session.questions[session.index].shuffledOrder]);
      session.buildState.selectedIndex = null;
      await renderApp();
      return;
    }
    case "quiz-check-sequence": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const question = session.questions[session.index];
      const userOrder = session.buildState.userOrder;
      const correct = normalizeForCompare(userOrder.join(" ")) === normalizeForCompare(question.correctOrder.join(" "));
      await answerQuizQuestion(userOrder.join(" || "), { isSequence: true, correctOrder: question.correctOrder });
      return;
    }
    case "quiz-sort-select-item": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const itemIndex = Number(actionButton.dataset.itemIndex);
      session.buildState.selectedItemIndex = itemIndex;
      session.buildState.selectedCategoryIndex = null;
      await renderApp();
      return;
    }
    case "quiz-sort-place": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const catIdx = Number(actionButton.dataset.categoryIndex);
      const itemIndex = session.buildState.selectedItemIndex;
      if (itemIndex === null) return;
      const question = session.questions[session.index];
      const item = question.items[itemIndex];
      // Remove from unplaced
      session.buildState.unplacedItems = session.buildState.unplacedItems.filter((_, i) => {
        const realIdx = question.items.indexOf(item);
        return realIdx !== itemIndex;
      });
      // Add to placed
      session.buildState.placedItems.push({
        text: typeof item === "string" ? item : item.text,
        categoryIndex: catIdx,
        category: question.categories[catIdx],
      });
      session.buildState.selectedItemIndex = null;
      await renderApp();
      return;
    }
    case "quiz-sort-remove": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const placedIdx = Number(actionButton.dataset.placedIdx);
      const removed = session.buildState.placedItems.splice(placedIdx, 1)[0];
      session.buildState.unplacedItems.push(
        question.items.find(i => (typeof i === "string" ? i : i.text) === removed.text) || removed.text,
      );
      await renderApp();
      return;
    }
    case "quiz-sort-reset": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const question = session.questions[session.index];
      session.buildState = {
        selectedItemIndex: null,
        placedItems: [],
        unplacedItems: [...question.items],
      };
      await renderApp();
      return;
    }
    case "quiz-check-sort": {
      const session = runtime.currentQuiz;
      if (!session || session.awaitingNext) return;
      const question = session.questions[session.index];
      const placed = session.buildState.placedItems;
      const correctItems = question.items.filter(i => typeof i === "object" && "text" in i);
      const allCorrect = placed.every(p => {
        const realItem = correctItems.find(i => i.text === p.text);
        return realItem && realItem.category === p.category;
      }) && placed.length === correctItems.length;
      await answerQuizQuestion(
        placed.map(p => `${p.text}|${p.category}`).join(" || "),
        { isSort: true },
      );
      return;
    }
    case "quiz-gap-choice":
      await answerQuizQuestion(actionButton.dataset.value);
      return;
    case "quiz-check-gap": {
      const input = document.querySelector("#quiz-gap-typed");
      await answerQuizQuestion(input ? input.value : "");
      return;
    }

    default:
      return;
  }
}

function updateStageSelection(sectionKey, input) {
  const prefSection = persisted.prefs[sectionKey];
  const dataset = findDataset(runtime.manifest, prefSection.datasetId);
  const stageOptions = getDatasetStageOptions(dataset);
  if (!stageOptions.length) {
    return;
  }

  const nextStages = new Set(getSelectedStages(prefSection, dataset));
  const stageValue = String(input.dataset.stage);
  if (input.checked) {
    nextStages.add(stageValue);
  } else if (nextStages.size > 1) {
    nextStages.delete(stageValue);
  } else {
    input.checked = true;
  }
  prefSection.stages = stageOptions.filter((stage) => nextStages.has(stage));
}

async function handleChange(event) {
  // File upload is handled separately (async, does its own renderApp call).
  if (event.target.id === "admin-file-upload") {
    await handleAdminFileUpload(event.target.files && event.target.files[0]);
    return;
  }

  const { id, value } = event.target;
  switch (id) {
    case "vocab-dataset":
      persisted.prefs.vocab.datasetId = value;
      persisted.prefs.vocab.partOfSpeech = "";
      persisted.prefs.vocab.category = "";
      applyDatasetDefaults("vocab", { resetStages: true });
      break;
    case "vocab-year":
      persisted.prefs.vocab.year = value;
      break;
    case "vocab-pos":
      persisted.prefs.vocab.partOfSpeech = value;
      break;
    case "vocab-category":
      persisted.prefs.vocab.category = value;
      break;
    case "quiz-dataset": {
      persisted.prefs.quiz.datasetId = value;
      // Subject First: keep prefs.subject in lockstep with the dataset.
      const newDataset = findDataset(runtime.manifest, value);
      persisted.prefs.quiz.subject = getDatasetSubject(newDataset);
      applyDatasetDefaults("quiz", { resetStages: true, resetQuizModes: true });
      break;
    }
    case "quiz-year":
      persisted.prefs.quiz.year = value;
      break;
    case "quiz-question-count":
      persisted.prefs.quiz.questionCount = Number(value);
      break;
    case "quiz-exclude-mastered":
      persisted.prefs.quiz.excludeMastered = value === "true";
      break;
    case "builder-pack":
      persisted.prefs.builder.packId = value;
      runtime.builder = null;
      break;
    case "builder-filter":
      persisted.prefs.builder.filter = value;
      runtime.builder = null;
      break;
    case "passage-group": {
      persisted.prefs.passages.groupId = value;
      const groups = listPassageGroups(runtime.manifest);
      const selectedGroup = groups.find((g) => g.id === value);
      if (selectedGroup) persisted.prefs.passages.subject = getPassageGroupSubject(selectedGroup);
      const packs = listPassagePacks(runtime.manifest, value);
      persisted.prefs.passages.packId = packs[0] ? packs[0].id : "";
      persisted.prefs.passages.category = "all";
      persisted.prefs.passages.difficulty = "all";
      runtime.passages = null;
      break;
    }
    case "passage-pack":
      persisted.prefs.passages.packId = value;
      persisted.prefs.passages.category = "all";
      persisted.prefs.passages.difficulty = "all";
      runtime.passages = null;
      break;
    case "passage-category":
      persisted.prefs.passages.category = value;
      runtime.passages.started = false;
      runtime.passages.message = "";
      break;
    case "passage-difficulty":
      persisted.prefs.passages.difficulty = value;
      runtime.passages.started = false;
      runtime.passages.message = "";
      break;
    case "review-dataset":
      persisted.prefs.review.datasetId = value;
      break;
    case "passage-show-german":
      persisted.prefs.passages.showGerman = event.target.checked;
      break;
    case "passage-voice":
      persisted.prefs.passages.voiceEnabled = event.target.checked;
      break;
    default:
      if (event.target.name === "quiz-mode") {
        const modeId = event.target.dataset.modeId;
        const nextModes = new Set(persisted.prefs.quiz.modes);
        if (event.target.checked) {
          nextModes.add(modeId);
        } else if (nextModes.size > 1) {
          nextModes.delete(modeId);
        }
        persisted.prefs.quiz.modes = [...nextModes];
      } else if (event.target.name === "vocab-stage") {
        updateStageSelection("vocab", event.target);
      } else if (event.target.name === "quiz-stage") {
        updateStageSelection("quiz", event.target);
      }
      break;
  }
  saveStoredState(persisted);
  await renderApp();
}

async function handleInput(event) {
  if (event.target.id === "vocab-search") {
    persisted.prefs.vocab.search = event.target.value;
    saveStoredState(persisted);
    if (searchRenderTimer) {
      window.clearTimeout(searchRenderTimer);
    }
    searchRenderTimer = window.setTimeout(() => {
      renderApp();
    }, 120);
  }
  if (event.target.dataset.questionId && runtime.passages) {
    runtime.passages.answers[event.target.dataset.questionId] = event.target.value;
  }
}

async function startQuiz(customWords = null, label = null) {
  if (customWords && !customWords.length) {
    return;
  }
  const prefs = persisted.prefs.quiz;
  const dataset = findDataset(runtime.manifest, prefs.datasetId);
  const allWords = await loadVocabItems(runtime.manifest, dataset.id);
  const words = filterWordsForScope(allWords, dataset, prefs);
  const sentencePools = await loadSentencePools(runtime.manifest, prefs.datasetId);
  const sourceWords = customWords && customWords.length ? customWords : words;

  // Load old-format files (fallback when unified pack is unavailable)
  const sequenceItems = await loadSequenceItems(runtime.manifest, prefs.datasetId);
  const categorySortItems = await loadCategorySortItems(runtime.manifest, prefs.datasetId);
  const fillBlankItems = await loadFillBlankItems(runtime.manifest, prefs.datasetId);

  // Try to load unified pack (preferred path)
  const unifiedPack = await loadUnifiedPack(runtime.manifest, prefs.datasetId);
  let passageUnifiedPack = null;
  if (getDatasetSubject(dataset) === "literature") {
    try {
      passageUnifiedPack = await loadPassageUnifiedPack(runtime.manifest, prefs.datasetId);
    } catch (_error) {
      passageUnifiedPack = null;
    }
  }
  const maxQuestionCount = getQuizMaxQuestionCount({
    dataset,
    prefs,
    filteredWords: words,
    unifiedPack,
    passageUnifiedPack,
  });
  const boundedQuestionCount = maxQuestionCount > 0 ? Math.min(prefs.questionCount, maxQuestionCount) : prefs.questionCount;

  // Subject First adapter: translate the high-level UI selections into the
  // legacy mode-ID array the question engine expects. This replaces the old
  // checkbox-driven `prefs.modes` for the running session, while still
  // persisting prefs.modes as a safety net.
  const resolvedModes = resolveQuizModesForUI({
    subject: getDatasetSubject(dataset),
    direction: prefs.direction,
    answerMode: prefs.answerMode,
  });

  const session = createQuizSession({
    words,
    sentencePools,
    config: { ...prefs, modes: resolvedModes, questionCount: boundedQuestionCount },
    persistedState: persisted,
    customWords,
    label,
    dataset,
    sequenceItems,
    categorySortItems,
    fillBlankItems,
    unifiedPack,
    passageUnifiedPack,
  });
  session.config = { ...prefs };
  session.config.datasetId = prefs.datasetId;
  session.config.scopeLabel = describeScope(dataset, prefs);
  session.config.stages = getSelectedStages(prefs, dataset);
  session.sourceWords = sourceWords;
  session.missedWords = [];
  const firstQ = session.questions[0];
  if (firstQ) {
    if (firstQ.kind === "build") {
      session.buildState = makeBuildState(firstQ);
    } else if (firstQ.kind === "sequence") {
      session.buildState = {
        selectedIndex: null,
        userOrder: [...firstQ.shuffledOrder],
      };
    } else if (firstQ.kind === "sort") {
      session.buildState = {
        selectedItemIndex: null,
        placedItems: [],
        unplacedItems: [...firstQ.items],
      };
    } else if (firstQ.kind === "match") {
      session.buildState = {
        selectedTerm: null,
        selectedDef: null,
        matchedPairs: [],
      };
    }
  }
  runtime.currentQuiz = session;
  persisted.activeTab = "quiz";
  saveStoredState(persisted);
  await renderApp();
}

async function answerQuizQuestion(response, extra = null) {
  const session = runtime.currentQuiz;
  if (!session || session.awaitingNext) {
    return;
  }
  const question = session.questions[session.index];
  const result = gradeQuestion(question, response, extra);
  session.awaitingNext = true;
  session.feedback = result;
  session.answers.push({
    questionId: question.id,
    prompt: question.prompt,
    expected: question.answer,
    userAnswer: response,
    correct: result.correct,
    wordId: question.wordId,
    speechText: question.speechText,
    speechLanguage: question.speechLanguage,
  });
  if (result.correct) {
    session.score += 1;
  }
  if (question.wordId) {
    recordWordAnswer(persisted, question.wordId, result.correct);
    if (!result.correct) {
      const sourceWords = session.sourceWords || [];
      const matched = sourceWords.find((word) => word.id === question.wordId);
      if (matched && !session.missedWords.some((word) => word.id === matched.id)) {
        session.missedWords.push(matched);
      }
    }
  }
  saveStoredState(persisted);
  await renderApp();
}

function nextQuizQuestion() {
  const session = runtime.currentQuiz;
  session.awaitingNext = false;
  session.feedback = null;
  session.index += 1;
  session.buildState = null;
  if (session.index >= session.questions.length) {
    session.completed = true;
    recordQuizSession(persisted, {
      id: session.id,
      label: session.label,
      datasetId: session.config.datasetId,
      year: session.config.year,
      scopeLabel: session.config.scopeLabel,
      score: session.score,
      totalQuestions: session.questions.length,
      timestamp: new Date().toISOString(),
      answers: session.answers,
    });
    saveStoredState(persisted);
    return;
  }
  if (session.questions[session.index].kind === "build") {
    session.buildState = makeBuildState(session.questions[session.index]);
  } else if (session.questions[session.index].kind === "sequence") {
    const q = session.questions[session.index];
    session.buildState = { selectedIndex: null, userOrder: shuffle([...q.shuffledOrder]) };
  } else if (session.questions[session.index].kind === "sort") {
    const q = session.questions[session.index];
    session.buildState = { selectedItemIndex: null, placedItems: [], unplacedItems: [...q.items], selectedCategoryIndex: null };
  } else if (session.questions[session.index].kind === "match") {
    session.buildState = { selectedTerm: null, selectedDef: null, matchedPairs: [] };
  }
}

function moveQuizTile(tileId, from) {
  const buildState = runtime.currentQuiz.buildState;
  if (!buildState) {
    return;
  }
  if (from === "bank") {
    const index = buildState.bankTiles.findIndex((tile) => tile.id === tileId);
    if (index >= 0) {
      buildState.answerTiles.push(buildState.bankTiles.splice(index, 1)[0]);
    }
  } else {
    const index = buildState.answerTiles.findIndex((tile) => tile.id === tileId);
    if (index >= 0) {
      buildState.bankTiles.push(buildState.answerTiles.splice(index, 1)[0]);
    }
  }
}

function clearQuizTiles() {
  const buildState = runtime.currentQuiz.buildState;
  buildState.bankTiles.push(...buildState.answerTiles);
  buildState.answerTiles = [];
}

function useQuizHint() {
  const session = runtime.currentQuiz;
  const buildState = session.buildState;
  const question = session.questions[session.index];
  const expectedWords = normalizeForCompare(question.answer).split(" ");
  const currentLength = buildState.answerTiles.length;
  const nextWord = expectedWords[currentLength];
  const tile = buildState.bankTiles.find((candidate) => normalizeForCompare(candidate.text) === nextWord);
  if (!tile) {
    return;
  }
  moveQuizTile(tile.id, "bank");
}

async function resetBuilderRuntime(packId) {
  // Try unified pack first
  let cards = null;
  try {
    const unified = await loadSentenceBuilderUnifiedPack(runtime.manifest, packId);
    if (unified && Array.isArray(unified.items)) {
      cards = unified.items
        .filter((item) => item.type === "sentenceBuilder")
        .map((item) => ({
          id: item.id,
          type: item.data?.cardType || item.tags?.[0] || "unknown",
          prompt: item.data?.prompt || "",
          answer: item.data?.answer || "",
          tiles: item.data?.tiles || [],
          level: item.level || "",
        }));
    }
  } catch (_) {
    cards = null;
  }

  // Fall back to old JSONL loader
  if (!cards) {
    cards = await loadSentenceBuilderPack(runtime.manifest, packId);
  }

  const filter = persisted.prefs.builder.filter;
  const filteredCards = cards.filter((card) => filter === "all" || card.type === filter);
  const deck = shuffle(filteredCards.length ? filteredCards : cards);
  const currentCard = deck.shift();
  runtime.builder = {
    packId,
    filter,
    allCards: cards,
    deck,
    currentCard,
    answerTiles: [],
    bankTiles: currentCard ? shuffle(currentCard.tiles).map((text, index) => ({ id: `${currentCard.id}-${index}`, text })) : [],
    feedback: null,
    resolved: false,
  };
}

function moveBuilderTile(tileId, from) {
  if (!runtime.builder) {
    return;
  }
  const source = from === "bank" ? runtime.builder.bankTiles : runtime.builder.answerTiles;
  const target = from === "bank" ? runtime.builder.answerTiles : runtime.builder.bankTiles;
  const index = source.findIndex((tile) => tile.id === tileId);
  if (index >= 0) {
    target.push(source.splice(index, 1)[0]);
    runtime.builder.feedback = null;
  }
}

function useBuilderHint() {
  const builder = runtime.builder;
  if (!builder || !builder.currentCard) {
    return;
  }
  const nextText = builder.currentCard.tiles[builder.answerTiles.length];
  const tile = builder.bankTiles.find((item) => item.text === nextText);
  if (!tile) {
    return;
  }
  moveBuilderTile(tile.id, "bank");
  builder.feedback = {
    tone: "info",
    title: "Hint used",
    body: "The next tile has been placed into the answer bar.",
  };
}

function checkBuilderAnswer() {
  const builder = runtime.builder;
  if (!builder || !builder.currentCard || builder.resolved) {
    return;
  }
  const response = builder.answerTiles.map((tile) => tile.text).join(" ");
  const correct = normalizeForCompare(response) === normalizeForCompare(builder.currentCard.answer);
  noteBuilderCardAttempt(persisted, builder.packId, builder.currentCard.id);
  if (correct) {
    markBuilderCorrect(persisted, builder.packId);
    builder.feedback = {
      tone: "correct",
      title: "Correct",
      body: builder.currentCard.answer,
    };
    builder.resolved = true;
  } else {
    builder.feedback = {
      tone: "wrong",
      title: "Try again",
      body: `Expected: ${builder.currentCard.answer}`,
    };
  }
  saveStoredState(persisted);
}

function advanceBuilderCard(countSkip) {
  const builder = runtime.builder;
  if (!builder) {
    return;
  }
  if (countSkip && !builder.resolved) {
    noteBuilderCardAttempt(persisted, builder.packId, builder.currentCard.id);
    markBuilderSkip(persisted, builder.packId);
  }
  if (!builder.deck.length) {
    const filter = builder.filter;
    const refreshed = builder.allCards.filter((card) => filter === "all" || card.type === filter);
    builder.deck = shuffle(refreshed.length ? refreshed : builder.allCards);
  }
  builder.currentCard = builder.deck.shift();
  builder.answerTiles = [];
  builder.bankTiles = builder.currentCard
    ? shuffle(builder.currentCard.tiles).map((text, index) => ({ id: `${builder.currentCard.id}-${index}`, text }))
    : [];
  builder.feedback = null;
  builder.resolved = false;
  saveStoredState(persisted);
}

async function resetPassageRuntime(groupId, packId) {
  // Try unified pack first (consolidated across all sub-packs in the group)
  let allPassages = null;
  try {
    const unified = await loadPassageUnifiedPack(runtime.manifest, groupId);
    if (unified && Array.isArray(unified.items)) {
      allPassages = unified.items
        .filter((item) => item.type === "passage")
        .map((item) => {
          // Normalise unified passage shape back to the flat passage shape expected
          // by preparePassageForSession and the reading tab
          const d = item.data || {};
          return {
            id: item.id,
            topic: Array.isArray(item.topics) ? item.topics[0] : (item.topics || ""),
            level: item.level || "",
            passage_de: d.sourcePassage || "",
            passage_en: d.targetPassage || "",
            speech_language: d.speechLanguage || "de-DE",
            chapter: d.chapter || "",
            section: d.section || "",
            title_de: d.sourceTitle || d.title_de || "",
            title_en: d.targetTitle || d.title_en || "",
            questions: (d.questions || []).map((q) => ({
              id: q.id,
              type: q.questionType || "open",
              question: q.question || q.question_en || "",
              difficulty: q.difficulty || "medium",
              options: q.options || [],
              correct_option_index: q.correctOptionIndex,
              model_answer_en: q.modelAnswer || "",
              accepted_keywords: q.acceptedKeywords || [],
            })),
          };
        });
    }
  } catch (_) {
    allPassages = null;
  }

  // Fall back to old pack-per-file loading
  if (!allPassages) {
    allPassages = await loadPassagePack(runtime.manifest, groupId, packId);
  }

  const categoryOptions = [...new Set(allPassages.map((passage) => passage.topic).filter(Boolean))].sort();
  runtime.passages = {
    groupId,
    packId,
    allPassages,
    categoryOptions,
    current: null,
    answers: {},
    deck: [],
    started: false,
    revealed: false,
    completedThisSession: 0,
    message: "",
  };
}

function getVisibleQuestions(passage, difficulty) {
  return passage.questions.filter((question) => {
    if (difficulty === "all") {
      return true;
    }
    return fallback(question.difficulty, "").toLowerCase() === difficulty;
  });
}

function getPlayablePassages() {
  const prefs = persisted.prefs.passages;
  return runtime.passages.allPassages.filter((passage) => {
    if (prefs.category !== "all" && passage.topic !== prefs.category) {
      return false;
    }
    return getVisibleQuestions(passage, prefs.difficulty).length > 0;
  });
}

function startReadingSession() {
  stopSpeaking();
  const playable = shuffle(getPlayablePassages()).map((passage) => preparePassageForSession(passage));
  if (!playable.length) {
    runtime.passages.message = "No passages match the current category and difficulty filters.";
    runtime.passages.started = false;
    runtime.passages.current = null;
    return;
  }
  runtime.passages.message = "";
  runtime.passages.deck = playable;
  runtime.passages.started = true;
  runtime.passages.completedThisSession = 0;
  advancePassage();
  if (persisted.prefs.passages.voiceEnabled) {
    playCurrentPassage();
  }
}

function playCurrentPassage() {
  const current = runtime.passages ? runtime.passages.current : null;
  if (!current) {
    return;
  }
  speakText(current.passage_de, fallback(current.speech_language, "de-DE"));
}

function revealCurrentPassage() {
  if (!runtime.passages.current || runtime.passages.revealed) {
    return;
  }
  runtime.passages.revealed = true;
  runtime.passages.completedThisSession += 1;
  recordPassageCompletion(persisted, runtime.passages.packId);
  saveStoredState(persisted);
}

function advancePassage() {
  if (!runtime.passages.deck.length) {
    runtime.passages.deck = shuffle(getPlayablePassages()).map((passage) => preparePassageForSession(passage));
  }
  runtime.passages.current = runtime.passages.deck.shift();
  runtime.passages.answers = {};
  runtime.passages.revealed = false;
}
