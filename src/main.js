import {
  findDataset,
  listDatasets,
  listPassageGroups,
  listPassagePacks,
  listSentenceBuilderPacks,
  listSentenceBuilderPacksBySubject,
  listSentenceBuilderPacksBySubjectAndCurriculum,
  getBuilderPackSubject,
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
  CURRICULUMS,
  CURRICULUM_LABELS,
  getDatasetSubject,
  getDatasetCurriculum,
  listDatasetsBySubject,
  listDatasetsBySubjectAndCurriculum,
  getDatasetDirections,
  getPassageGroupSubject,
  listPassageGroupsBySubject,
  listPassageGroupsBySubjectAndCurriculum,
} from "./data.js";
import {
  hydrateManifest,
  listUploadedPacks,
  saveUploadedPack,
  deleteUploadedPack,
  validatePack,
} from "./admin-storage.js";
import { validatePackSchema } from "./admin-validate.js";
import { unzip } from "fflate";
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
  isWordMastered,
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
  exportProgress,
  getDashboardSummary,
  getPackageProgress,
  getRecentActivity,
  getRecommendedPractice,
  getStruggledItems,
  importProgress,
  makeAttemptEvent,
  recordAttempt,
} from "./progress.js";
import {
  escapeHtml,
  formatDateTime,
  formatPercent,
  humanizeLabel,
  levelMatches,
  normalizeForCompare,
  shuffle,
  getVoicesForLanguage,
  speakText,
  stopSpeaking,
} from "./utils.js";
import {
  crosswordEntriesFromWords,
  generateCrossword,
  normalizeCrosswordAnswer,
} from "./crossword.js";
import {
  loadMarkdownFile,
  renderMarkdown,
  extractTOC,
  highlightMatches,
  datasetHasStudyBook,
  getStudyBookFiles,
} from "./study-book.js";
import {
  loadProgressiveLessonCatalog,
  loadProgressiveLessonPack,
  createProgressiveLessonState,
  runProgressiveLessonAction,
  buildVocabOptions,
  getCurrentSpeechCue,
  renderProgressiveTab as renderProgressiveTabHTML,
} from "./progressive-language-lesson.js";

const TABS = [
  { id: "home",        title: "Home"       },
  { id: "vocab",       title: "Vocabulary" },
  { id: "quiz",        title: "Quiz"       },
  { id: "crossword",   title: "Crossword"  },
  { id: "reading",     title: "Reading"    },
  { id: "builder",     title: "Builder"    },
  { id: "progressive", title: "Language ✨" },
  { id: "review",      title: "Review"     },
  { id: "about",       title: "About"      },
  { id: "admin",       title: "Progress"   },
  { id: "selfUpload", title: "My Packs" },
];

const YEAR_OPTIONS = ["ALL", "Y7", "Y8", "Y9", "Y10", "Y11"];

const root = document.querySelector("#app");
const persisted = loadStoredState();
const runtime = {
  manifest: null,
  currentQuiz: null,
  crossword: null,
  crosswordError: "",
  builder: null,
  passages: null,
  progressiveLesson: null,
  progressiveLessonCatalog: null,
  progressiveLessonPack: null,
  progressiveLessonError: "",
  reviewContext: {
    hardest: [],
    mastered: [],
  },
  // Progressive Language — catalog + active pack + lesson state (runtime only, never persisted)
  progressiveLesson: {
    catalog: null,   // loaded from data/ProgressiveLanguagePacks/manifest.json
    pack:    null,   // loaded pack JSON
    state:   null,   // lesson state object from createProgressiveLessonState
  },
  // Admin tab upload status: null | { ok: boolean, message: string, entry?: object }
  adminUploadStatus: null,
  // Session detail overlay: null | { sessionId: string }
  sessionDetail: null,
  // Study Book drawer — ephemeral session UI state, never persisted to localStorage
  studyBook: {
    open: false,
    datasetId: null,     // which pack's notes are loaded
    activeFile: null,    // path of currently displayed .md file
    markdown: null,      // raw markdown string
    html: null,          // sanitized rendered HTML
    toc: [],             // [{ level, text, anchor }]
    currentAnchor: null, // id of the TOC entry currently in view
    scrollTop: 0,        // content scroll position remembered across re-renders
    searchQuery: "",
    searchMatches: 0,
    searchMatchIndex: 0, // which match is currently scrolled into view (0-based)
    pendingAnchor: null, // anchor to jump to immediately after open
  },
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
  return fallback(dataset && dataset.speechLanguage, fallback(dataset && dataset.sourceLanguageCode, "en-GB"));
}

// Returns the Speak button label. Latin has no TTS voice on any OS/browser,
/**
 * Render a TTS voice picker <select> for the given BCP-47 language code.
 * Returns "" when speechSynthesis is unavailable or no voices are found.
 */
function renderVoiceSelector(langCode, currentVoiceName) {
  if (!("speechSynthesis" in window)) return "";
  const voices = getVoicesForLanguage(langCode);
  if (!voices.length) return "";
  const options = [
    `<option value="">Browser default</option>`,
    ...voices.map((v) => {
      const icon = v.localService ? "📱" : "☁️";
      const selected = currentVoiceName === v.name ? " selected" : "";
      return `<option value="${escapeHtml(v.name)}"${selected}>${icon} ${escapeHtml(v.name)}</option>`;
    }),
  ].join("");
  return `
    <div class="form-grid" style="margin-top:10px;">
      <label class="form-field">
        <span class="form-field-label">Voice (${voices.length} available for ${escapeHtml(langCode)})</span>
        <select id="passage-voice-select">${options}</select>
      </label>
    </div>`;
}

// so the browser falls back to English — warn the user with "(EN only)".
function speakLabel(languageCode) {
  const code = String(languageCode || "").toLowerCase();
  return code === "la" || code.startsWith("la-") ? "Speak (EN only)" : "Speak";
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
  // Year filtering (Y7 / Y8 / Y9 / ALL) is only meaningful for language packs.
  // Non-language packs (history, geography, science, etc.) tag items with
  // curriculum-level strings like "KS3" or "KS3 / Year 7", which would never
  // match a Y-year filter and would silently produce 0 words.
  if (getDatasetSubject(dataset) !== "language") return words;
  return words.filter((word) => levelMatches(word.level, prefSection.year));
}

// Returns the fillBlank items from unifiedPack filtered to the currently selected
// stages (mirrors the unifiedItems stage filter in createQuizSession).
// For packs without stage selection the full item list is returned.
function filterFillBlankByStage(unifiedPack, prefSection, dataset) {
  const all = filterUnifiedItems(unifiedPack, "fillBlank");
  if (!usesStageSelection(dataset)) return all;
  const selectedStages = new Set(getSelectedStages(prefSection, dataset).map(String));
  if (!selectedStages.size) return all;
  return all.filter((item) => {
    const stageStr = String(item.level || "").replace(/^Stage\s+/i, "").trim();
    return !stageStr || isNaN(Number(stageStr)) || selectedStages.has(stageStr);
  });
}

function applyDatasetDefaults(sectionKey, options = {}) {
  const prefSection = persisted.prefs[sectionKey];

  // Reset stale datasetId when the stored pack no longer exists in the manifest.
  if (prefSection.datasetId && prefSection.datasetId !== "core") {
    const knownIds = new Set(listDatasets(runtime.manifest).map((d) => d.id));
    if (!knownIds.has(prefSection.datasetId)) {
      prefSection.datasetId = "core";
    }
  }

  const dataset = findDataset(runtime.manifest, prefSection.datasetId);
  const stageOptions = getDatasetStageOptions(dataset);

  if ("stages" in prefSection) {
    prefSection.stages = stageOptions.length
      ? (options.resetStages ? [...stageOptions] : getSelectedStages(prefSection, dataset))
      : [];
  }

  if ("year" in prefSection) {
    if (stageOptions.length) {
      prefSection.year = "ALL";
    } else {
      const yearOptions = Array.isArray(dataset && dataset.yearOptions) ? dataset.yearOptions : YEAR_OPTIONS;
      if (!yearOptions.includes(prefSection.year)) {
        prefSection.year = "ALL";
      }
    }
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

// ── Study Book ─────────────────────────────────────────────────────────────
// The drawer is mounted in #study-book-root (a sibling of #app in index.html)
// so that renderApp() full-rerenders never destroy it.

const sbRoot = document.getElementById("study-book-root");

/**
 * Re-renders the Study Book drawer into sbRoot.
 * Restores scroll position and attaches all event listeners after each render.
 */
function renderStudyBookDrawer() {
  const savedScroll = runtime.studyBook.scrollTop;
  sbRoot.innerHTML = buildStudyBookHTML();
  attachStudyBookListeners();
  const contentEl = document.getElementById("sb-content-area");
  if (!contentEl) return;
  if (runtime.studyBook.searchQuery.length >= 2) {
    // Jump to the current match instead of restoring old scroll position
    scrollToSearchMatch(runtime.studyBook.searchMatchIndex);
  } else if (savedScroll) {
    contentEl.scrollTop = savedScroll;
  }
}

/**
 * Builds the full drawer HTML string from runtime.studyBook state.
 * Called by renderStudyBookDrawer(); never writes to the DOM directly.
 */
function buildStudyBookHTML() {
  const sb = runtime.studyBook;
  if (!sb.open) {
    return `<aside class="study-book-drawer" data-open="false" aria-hidden="true"></aside><div class="sb-scrim"></div>`;
  }

  let displayHtml = sb.html || "";
  let matchCount = 0;
  if (sb.searchQuery.length >= 2) {
    const result = highlightMatches(displayHtml, sb.searchQuery);
    displayHtml = result.html;
    matchCount = result.count;
    sb.searchMatches = matchCount;
    // Clamp index in case a new shorter query has fewer matches
    if (sb.searchMatchIndex >= matchCount) sb.searchMatchIndex = 0;
  } else {
    sb.searchMatches = 0;
    sb.searchMatchIndex = 0;
  }

  return `
    <aside class="study-book-drawer" data-open="true" role="complementary" aria-label="Study Book">
      <div class="sb-header">
        <span class="sb-title">&#128218; Study Book</span>
        <div class="sb-header-actions">
          ${renderSBFileTabs(sb)}
          <button class="sb-split-btn" data-sb-action="toggle-split" title="Toggle split view" aria-label="Toggle split view">&#9707;</button>
          <button class="sb-close" data-sb-action="close" aria-label="Close Study Book">&#x2715;</button>
        </div>
      </div>
      <div class="sb-search-bar">
        <input
          type="search"
          class="sb-search-input"
          placeholder="Search notes…"
          aria-label="Search study notes"
          value="${escapeHtml(sb.searchQuery)}"
          autocomplete="off"
        />
        ${matchCount > 0 ? `
          <span class="sb-search-count">${sb.searchMatchIndex + 1} / ${matchCount}</span>
          <button class="sb-search-nav" data-sb-action="search-prev" aria-label="Previous match" title="Previous match">&#8593;</button>
          <button class="sb-search-nav" data-sb-action="search-next" aria-label="Next match" title="Next match">&#8595;</button>
        ` : (sb.searchQuery.length >= 2 ? `<span class="sb-search-count sb-search-none">no matches</span>` : "")}
      </div>
      <div class="sb-inner">
        ${sb.toc.length ? `
          <nav class="sb-toc" aria-label="Table of contents">
            <p class="sb-toc-title">Contents</p>
            ${renderSBTOC(sb.toc, sb.currentAnchor)}
          </nav>` : ""}
        <div class="sb-content" id="sb-content-area" tabindex="0">
          ${displayHtml || `<p class="muted" style="padding:20px;">No content loaded.</p>`}
        </div>
      </div>
      <div class="sb-resize-handle" aria-hidden="true"></div>
    </aside>
    <div class="sb-scrim" data-sb-action="close" aria-hidden="true"></div>
  `;
}

/** Renders the TOC list HTML. */
function renderSBTOC(toc, currentAnchor) {
  const items = toc.map(({ level, text, anchor }) => `
    <li class="sb-toc-h${level}${anchor === currentAnchor ? " sb-toc-active" : ""}">
      <a href="#${escapeHtml(anchor)}" data-sb-action="toc-jump" data-anchor="${escapeHtml(anchor)}">${escapeHtml(text)}</a>
    </li>`).join("");
  return `<ul class="sb-toc-list">${items}</ul>`;
}

/** Renders file-tab buttons when a dataset has multiple .md files. */
function renderSBFileTabs(sb) {
  if (!sb.datasetId || !runtime.manifest) return "";
  const dataset = findDataset(runtime.manifest, sb.datasetId);
  const files = getStudyBookFiles(dataset);
  if (files.length <= 1) return "";
  return `<div class="sb-file-tabs">${
    files.map(f => `
      <button class="sb-file-tab${f.path === sb.activeFile ? " active" : ""}"
              data-sb-action="switch-file"
              data-sb-path="${escapeHtml(f.path)}">${escapeHtml(f.title)}</button>
    `).join("")
  }</div>`;
}

/**
 * Attaches all Study Book event listeners after each drawer render.
 * Old listeners are automatically GC'd because the old DOM nodes are replaced.
 */
function attachStudyBookListeners() {
  if (!sbRoot) return;

  // Delegate all data-sb-action clicks inside the drawer root
  sbRoot.addEventListener("click", handleStudyBookClick);

  const contentEl = document.getElementById("sb-content-area");
  if (!contentEl) return;

  // Remember scroll position
  contentEl.addEventListener("scroll", () => {
    runtime.studyBook.scrollTop = contentEl.scrollTop;
  }, { passive: true });

  // Track active heading via IntersectionObserver
  const headings = contentEl.querySelectorAll("h1[id], h2[id], h3[id]");
  if (headings.length) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting);
        if (!visible.length) return;
        const anchor = visible[0].target.id;
        if (anchor === runtime.studyBook.currentAnchor) return;
        runtime.studyBook.currentAnchor = anchor;
        // Partial-update only the TOC list to avoid losing scroll
        const tocEl = sbRoot.querySelector(".sb-toc-list");
        if (tocEl) tocEl.outerHTML = renderSBTOC(runtime.studyBook.toc, anchor);
      },
      { root: contentEl, rootMargin: "-10% 0px -60% 0px" }
    );
    headings.forEach(h => io.observe(h));
  }

  // Live search — reset match index on every new query, then re-render+jump
  const searchEl = sbRoot.querySelector(".sb-search-input");
  if (searchEl) {
    searchEl.addEventListener("input", (e) => {
      runtime.studyBook.searchQuery = e.target.value;
      runtime.studyBook.searchMatchIndex = 0;
      renderStudyBookDrawer();
      const newInput = sbRoot.querySelector(".sb-search-input");
      if (newInput) {
        newInput.focus();
        const len = newInput.value.length;
        newInput.setSelectionRange(len, len);
      }
    });
  }

  // Resize handle (desktop drag)
  const handle = sbRoot.querySelector(".sb-resize-handle");
  const drawer = sbRoot.querySelector(".study-book-drawer");
  if (handle && drawer) {
    let startX, startWidth;
    handle.addEventListener("mousedown", (e) => {
      startX = e.clientX;
      startWidth = parseInt(getComputedStyle(drawer).width, 10);
      const onDrag = (ev) => {
        const delta = startX - ev.clientX;
        const newW = Math.max(280, Math.min(760, startWidth + delta));
        drawer.style.width = newW + "px";
        if (document.body.classList.contains("sb-split-mode")) {
          document.getElementById("app").style.marginRight = newW + "px";
        }
      };
      const stopDrag = () => {
        document.removeEventListener("mousemove", onDrag);
        document.removeEventListener("mouseup", stopDrag);
      };
      document.addEventListener("mousemove", onDrag);
      document.addEventListener("mouseup", stopDrag);
    });
  }
}

/** Handles all data-sb-action clicks delegated from sbRoot. */
function handleStudyBookClick(e) {
  const el = e.target.closest("[data-sb-action]");
  if (!el) return;
  const sbAction = el.dataset.sbAction;

  if (sbAction === "close") {
    runtime.studyBook.open = false;
    renderStudyBookDrawer();
    document.body.classList.remove("sb-split-mode");
    document.getElementById("app").style.marginRight = "";
    return;
  }

  if (sbAction === "toggle-split") {
    const wasSplit = document.body.classList.toggle("sb-split-mode");
    const drawer = sbRoot.querySelector(".study-book-drawer");
    if (wasSplit && drawer) {
      document.getElementById("app").style.marginRight = getComputedStyle(drawer).width;
    } else {
      document.getElementById("app").style.marginRight = "";
    }
    return;
  }

  if (sbAction === "toc-jump") {
    e.preventDefault();
    const anchor = el.dataset.anchor;
    runtime.studyBook.currentAnchor = anchor;
    scrollToStudyBookAnchor(anchor);
    return;
  }

  if (sbAction === "switch-file") {
    openStudyBook(runtime.studyBook.datasetId, { mdPath: el.dataset.sbPath });
    return;
  }

  if (sbAction === "search-next") {
    const total = runtime.studyBook.searchMatches;
    if (!total) return;
    runtime.studyBook.searchMatchIndex = (runtime.studyBook.searchMatchIndex + 1) % total;
    scrollToSearchMatch(runtime.studyBook.searchMatchIndex);
    updateSearchCounter();
    return;
  }

  if (sbAction === "search-prev") {
    const total = runtime.studyBook.searchMatches;
    if (!total) return;
    runtime.studyBook.searchMatchIndex = (runtime.studyBook.searchMatchIndex - 1 + total) % total;
    scrollToSearchMatch(runtime.studyBook.searchMatchIndex);
    updateSearchCounter();
    return;
  }
}

/**
 * Scrolls the content area so that the nth <mark class="sb-highlight"> is visible
 * and adds a brief ring around it so the user can see which one is active.
 */
function scrollToSearchMatch(index) {
  const contentEl = document.getElementById("sb-content-area");
  if (!contentEl) return;
  const marks = contentEl.querySelectorAll("mark.sb-highlight");
  if (!marks.length) return;
  const target = marks[Math.min(index, marks.length - 1)];
  // Remove active class from all, set on current
  marks.forEach(m => m.classList.remove("sb-highlight-active"));
  target.classList.add("sb-highlight-active");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

/** Updates the "X / N" counter in the search bar without a full re-render. */
function updateSearchCounter() {
  const counter = sbRoot.querySelector(".sb-search-count");
  if (counter) {
    counter.textContent = `${runtime.studyBook.searchMatchIndex + 1} / ${runtime.studyBook.searchMatches}`;
  }
}

/**
 * Scrolls the Study Book content area to the given heading anchor and
 * briefly flashes it so the user knows where they landed.
 */
function scrollToStudyBookAnchor(anchor) {
  const contentEl = document.getElementById("sb-content-area");
  if (!contentEl) return;
  const target = contentEl.querySelector(`#${CSS.escape(anchor)}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  target.classList.add("sb-anchor-flash");
  target.addEventListener("animationend", () => target.classList.remove("sb-anchor-flash"), { once: true });
}

/**
 * Opens the Study Book for a given dataset, optionally jumping to a heading.
 * This is the single public entry point called from all tabs and quiz questions.
 *
 * @param {string} datasetId  - pack id from the manifest
 * @param {object} [opts]
 * @param {string} [opts.anchor]  - heading anchor to jump to after open
 * @param {string} [opts.mdPath]  - specific .md file path to load (defaults to contentMdPath)
 */
async function openStudyBook(datasetId, { anchor = null, mdPath = null } = {}) {
  const dataset = findDataset(runtime.manifest, datasetId);
  if (!dataset) return;

  const files = getStudyBookFiles(dataset);
  if (!files.length) return;

  const targetPath = mdPath || files[0].path;
  const sb = runtime.studyBook;

  // Only re-load if switching dataset or file
  if (sb.datasetId !== datasetId || sb.activeFile !== targetPath || !sb.html) {
    let raw = "";
    try {
      raw = await loadMarkdownFile(targetPath);
    } catch (err) {
      console.warn(err);
      raw = `# Notes unavailable\n\nCould not load \`${targetPath}\`.`;
    }
    const toc = extractTOC(raw);
    const html = renderMarkdown(raw);
    Object.assign(sb, {
      datasetId,
      activeFile: targetPath,
      markdown: raw,
      html,
      toc,
      scrollTop: 0,
      searchQuery: "",
      searchMatches: 0,
      currentAnchor: toc[0]?.anchor ?? null,
    });
  }

  sb.open = true;
  sb.pendingAnchor = anchor;
  if (anchor) sb.currentAnchor = anchor;

  renderStudyBookDrawer();

  // Focus the close button for accessibility
  requestAnimationFrame(() => {
    sbRoot.querySelector(".sb-close")?.focus();
    if (anchor) scrollToStudyBookAnchor(anchor);
  });
}

/**
 * Returns a Study Book trigger button HTML string for use in any tab.
 * Renders nothing if the dataset has no markdown files registered.
 *
 * @param {object} dataset  - manifest dataset entry
 * @param {object} [opts]
 * @param {string} [opts.anchor]  - jump directly to this heading anchor on open
 * @param {string} [opts.mdPath]  - specific .md file to load on open
 * @param {string} [opts.label]   - override button label text
 * @param {string} [opts.cls]     - extra CSS class(es) on the button
 */
/**
 * Returns the dataset currently selected in the active tab, or null if the
 * active tab has no single-pack concept (home, about, admin, crossword, etc.).
 */
function getActiveTabDataset() {
  const tab = persisted.activeTab;
  let id = null;
  if (tab === "vocab")    id = persisted.prefs.vocab.datasetId;
  else if (tab === "quiz")     id = persisted.prefs.quiz.datasetId;
  else if (tab === "passages") id = persisted.prefs.passages.packId;
  else if (tab === "review")   id = persisted.prefs.review.datasetId;
  return id ? findDataset(runtime.manifest, id) : null;
}

/**
 * If the Study Book drawer is open and the active tab has switched to a
 * different pack, reload (or close) the drawer automatically.
 */
async function syncStudyBookToCurrentDataset() {
  const sb = runtime.studyBook;
  if (!sb.open) return;
  const dataset = getActiveTabDataset();
  if (!dataset || dataset.id === sb.datasetId) return;
  if (datasetHasStudyBook(dataset)) {
    await openStudyBook(dataset.id);
  } else {
    sb.open = false;
    renderStudyBookDrawer();
    document.body.classList.remove("sb-split-mode");
    document.getElementById("app").style.marginRight = "";
  }
}

function renderStudyBookButton(dataset, { anchor = "", mdPath = "", label = "Study Book", cls = "" } = {}) {
  if (!datasetHasStudyBook(dataset)) return "";
  return `
    <button class="button ghost sb-trigger${cls ? " " + cls : ""}"
            data-action="open-study-book"
            data-dataset-id="${escapeHtml(dataset.id)}"
            data-sb-anchor="${escapeHtml(anchor)}"
            data-sb-path="${escapeHtml(mdPath)}"
            aria-label="Open Study Book">
      &#128218; ${escapeHtml(label)}
    </button>`;
}

// ── End Study Book ──────────────────────────────────────────────────────────

async function init() {
  runtime.manifest = await loadManifest();
  // Inject any previously-uploaded packs into the live manifest before rendering.
  hydrateManifest(runtime.manifest, registerPackInCache);
  ensurePreferenceDefaults();
  bindEvents();
  renderStudyBookDrawer(); // mount the (initially closed) drawer
  await renderApp();
}

function bindEvents() {
  document.addEventListener("click", handleClick);
  document.addEventListener("change", handleChange);
  document.addEventListener("input", handleInput);
  document.addEventListener("keydown", handleKeyDown);
  // Chrome loads TTS voices asynchronously. Re-render once when they arrive
  // so the voice selector shows the correct options.
  if ("speechSynthesis" in window) {
    let voicesLoaded = false;
    window.speechSynthesis.addEventListener("voiceschanged", () => {
      if (!voicesLoaded) {
        voicesLoaded = true;
        renderApp();
      }
    });
  }
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
  applyDatasetDefaults("crossword");

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
  if (persisted.activeTab === "crossword" && runtime.crossword?.game) {
    // Double rAF: first frame commits the new DOM, second frame has full layout.
    requestAnimationFrame(() => requestAnimationFrame(scaleCrosswordToFit));
  }
  if (persisted.activeTab === "progressive") {
    scheduleProgressiveSpeech();
  }
}

let _cwResizeHandler = null;

function scaleCrosswordToFit() {
  const wrap  = document.querySelector(".crossword-board-wrap");
  const board = document.querySelector(".crossword-board");
  if (!wrap || !board) return;

  // scrollWidth / offsetHeight are layout (unscaled) values — no need to reset
  // the transform first; doing so briefly expands the board and can cause a
  // scroll jump even with overflow:hidden.
  const padH      = 32;                       // 16px padding × 2
  const available = wrap.clientWidth - padH;
  const natural   = board.scrollWidth;

  if (natural > available && available > 0) {
    const scale = available / natural;
    board.style.transformOrigin = "top left";
    board.style.transform       = `scale(${scale})`;
    // Collapse wrap to scaled size — transform doesn't affect layout flow
    wrap.style.height   = `${Math.ceil(board.offsetHeight * scale) + padH}px`;
    wrap.style.overflow = "hidden";
  } else {
    board.style.transform       = "";
    board.style.transformOrigin = "";
    wrap.style.height           = "";
    wrap.style.overflow         = "";
  }

  // Keep re-scaling on viewport resize — register once, replace on each render
  if (_cwResizeHandler) window.removeEventListener("resize", _cwResizeHandler);
  _cwResizeHandler = () => scaleCrosswordToFit();
  window.addEventListener("resize", _cwResizeHandler);
}

function renderHero() {
  const totalWordCount =
    fallback(runtime.manifest.core.wordCount, 0) +
    (runtime.manifest.packs || []).filter((p) => (p.capabilities || []).includes("revision")).reduce((sum, pack) => sum + fallback(pack.wordCount, 0), 0);
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
        <a
          class="hero-fb-btn"
          href="https://www.facebook.com/profile.php?id=61589170294693"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit FoxChildIdea on Facebook"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
          </svg>
        </a>
      </div>
      <div class="hero-body">
        <div class="hero-top">
          <div class="hero-copy">
            <p class="eyebrow">powered by FoxChild Idea</p>
            <h1><span class="hero-title-brand">FoxChild</span><span class="hero-title-accent">@Learn</span></h1>
            <p>
              Your cozy space for learning, practising, and growing —
              powered by curiosity and AI. ❤️
            </p>
          </div>
          <div class="hero-right">
            <div class="hero-badges">
              <span class="hero-badge">${(runtime.manifest.packs || []).filter((p) => (p.capabilities || []).includes("revision")).length} packs</span>
              <span class="hero-badge">${(runtime.manifest.packs || []).filter((p) => (p.capabilities || []).includes("passages")).length} reading groups</span>
              <span class="hero-badge">${runtime.manifest.sentenceBuilderPacks.length} builder sets</span>
            </div>
            <div class="hero-build-card">
              <div class="hero-build-text">
                <p class="hero-build-title">✨ Create your own study pack</p>
                <p class="hero-build-body">Use ChatGPT or any AI chat to generate your own content.</p>
              </div>
              <span class="hero-build-soon">Coming soon</span>
            </div>
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

function renderQuestionBox({ eyebrow = "", modeLabel = "", prompt, subtitle = "", meta = [], sideContent = "" }) {
  const metaChips = meta
    .filter(Boolean)
    .map(({ label, style = "blue" }) => `<span class="badge ${escapeHtml(style)}">${escapeHtml(label)}</span>`)
    .join("");
  return `
    <div class="question-box">
      <div class="question-box-top">
        <div class="question-box-copy">
          ${eyebrow ? `<p class="eyebrow" style="color:#1566a8;">${escapeHtml(eyebrow)}</p>` : ""}
          ${modeLabel ? `<span class="mode-chip blue">${escapeHtml(modeLabel)}</span>` : ""}
          <div class="question-prompt">${escapeHtml(prompt)}</div>
          ${subtitle ? `<p class="muted tiny">${escapeHtml(subtitle)}</p>` : ""}
          ${metaChips ? `<div class="badge-row" style="margin-top:6px;gap:6px;">${metaChips}</div>` : ""}
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

// ── Progressive Language wrapper ───────────────────────────────────────────
async function renderProgressiveTabWrapper() {
  const pl = runtime.progressiveLesson;

  if (!pl.catalog) {
    try {
      pl.catalog = await loadProgressiveLessonCatalog();
      pl.state   = createProgressiveLessonState(pl.catalog);
    } catch (err) {
      return `<div class="section-card"><p style="color:var(--color-error);">Failed to load catalog: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  if (!pl.pack && pl.state?.packPath) {
    try {
      pl.pack = await loadProgressiveLessonPack(pl.state.packPath);
      pl.state.vocabOptions = buildVocabOptions(pl.pack, 0, pl.state.targetLang);
    } catch (err) {
      return `<div class="section-card"><p style="color:var(--color-error);">Failed to load pack: ${escapeHtml(err.message)}</p></div>`;
    }
  }

  return renderProgressiveTabHTML(pl.state, pl.catalog, pl.pack);
}

// ── Progressive Language: auto-speak after render ──────────────────────────
function scheduleProgressiveSpeech() {
  const { state, pack } = runtime.progressiveLesson;
  if (!state || !pack || state.phase !== "listen") return;
  const cue = getCurrentSpeechCue(state, pack);
  if (!cue || cue.key === state.spokenStepKey) return;
  state.spokenStepKey = cue.key;
  setTimeout(() => speakText(cue.text, cue.lang), 350);
}

async function renderTabContent() {
  switch (persisted.activeTab) {
    case "vocab":
      return renderVocabTab();
    case "quiz":
      return renderQuizTab();
    case "crossword":
      return renderCrosswordTab();
    case "reading":
      return renderReadingTab();
    case "builder":
      return renderBuilderTab();
    case "progressive":
      return renderProgressiveTabWrapper();
    case "review":
      return renderReviewTab();
    case "about":
      return renderAboutTab();
    case "admin":
      return renderAdminTab();
    case "selfUpload":
      return renderSelfUploadTab();
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
  const featuredPacks = (runtime.manifest.packs || []).filter((p) => (p.capabilities || []).includes("revision")).slice(0, 4);
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
            <button class="quick-card" data-tab="progressive">
              <h3>Progressive Language</h3>
              <p>Listen, choose vocabulary, then build short multilingual sentences.</p>
            </button>
          </div>
        </article>
        <div class="dashboard-right">
          <article class="section-card fb-card">
            <h2>Let's grow together! 💛</h2>
            <p>Follow the FoxChildIdea journey on Facebook and share your thoughts, feedback, or ideas.</p>
            <a
              class="fb-btn"
              href="https://www.facebook.com/profile.php?id=61589170294693"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg class="fb-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.887v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
              </svg>
              Visit our Facebook page
              <svg class="fb-external" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M6 1.5H2.5A1 1 0 0 0 1.5 2.5v11A1 1 0 0 0 2.5 14.5h11A1 1 0 0 0 14.5 13.5V10M9 1.5h5.5m0 0v5.5m0-5.5L7 10"/>
              </svg>
            </a>
          </article>
          <article class="section-card status-compact">
            <h2>Status snapshot</h2>
            <div class="status-compact-grid">
              <div class="metric-mini">
                <strong>${Object.keys(persisted.progress.words).length}</strong>
                <span>words seen</span>
              </div>
              <div class="metric-mini">
                <strong>${Object.values(persisted.progress.builderStats).reduce((sum, item) => sum + item.totalCorrect, 0)}</strong>
                <span>cards solved</span>
              </div>
              <div class="metric-mini">
                <strong>${Object.values(persisted.progress.passageStats).reduce((sum, item) => sum + item.passagesCompleted, 0)}</strong>
                <span>passages done</span>
              </div>
              <div class="metric-mini">
                <strong>${lastSession ? formatPercent(lastSession.score / Math.max(lastSession.totalQuestions, 1)) : "0%"}</strong>
                <span>${lastSession ? "last accuracy" : "no quiz yet"}</span>
              </div>
            </div>
          </article>
        </div>
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
          <h2>Review Desk rule</h2>
          <div class="meta-list" style="margin-top:16px;">
            <div class="session-item"><span>Each word tracks correct answers, wrong answers, current streak, and last seen time</span><span class="badge blue">Progress</span></div>
            <div class="session-item"><span>A correct answer adds 1 correct and increases the streak</span><span class="badge green">Correct</span></div>
            <div class="session-item"><span>A wrong answer adds 1 wrong and resets the streak to 0</span><span class="badge coral">Wrong</span></div>
            <div class="session-item"><span>Mastered means at least 3 correct answers and a current streak of at least 2</span><span class="badge green">Mastered</span></div>
            <div class="session-item"><span>Needs review shows the top 12 reviewed words by wrong-minus-correct score, then wrong count</span><span class="badge amber">Ranked</span></div>
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

async function renderProgressiveLanguageTab() {
  try {
    runtime.progressiveLessonCatalog = await loadProgressiveLessonCatalog();
    runtime.progressiveLesson = ensureProgressiveLessonStateForCatalog(runtime.progressiveLesson, runtime.progressiveLessonCatalog);
    runtime.progressiveLessonPack = await loadProgressiveLessonPack(runtime.progressiveLesson.packPath);
    runtime.progressiveLessonError = "";
    return renderProgressiveLanguageLesson(runtime.progressiveLessonPack, runtime.progressiveLesson, runtime.progressiveLessonCatalog);
  } catch (error) {
    runtime.progressiveLessonError = error.message;
    return renderEmptyStateCard({
      eyebrow: "Progressive Language",
      title: "Lesson pack unavailable",
      body: `Could not load the progressive language lesson pack. ${error.message}`,
    });
  }
}

function scheduleProgressiveLessonSpeech() {
  const pack = runtime.progressiveLessonPack;
  const state = runtime.progressiveLesson;
  if (!pack || !state) return;
  const cue = getCurrentSpeechCue(pack, state);
  if (!cue || cue.key === state.spokenStepKey) return;
  markCurrentStepSpoken(state, cue);
  requestAnimationFrame(() => {
    speakProgressiveText(cue.text, cue.lang);
  });
}

async function renderAboutTab() {
  return `
    <div class="section-stack about-page">
      <section class="section-card lead about-intro">
        <div class="about-layout">
          <div class="about-copy">
            <p class="eyebrow" style="color:var(--fox-teal);">Learning Web</p>
            <h2>About This Project</h2>
            <p>This project started from a very simple personal idea:</p>
            <p class="about-question">Can AI help parents and students turn their own study materials into interactive revision exercises automatically?</p>
            <p>When helping my child revise subjects like Geography, German, and History, I noticed that most revision is still very passive — reading notes repeatedly, memorising vocabulary lists, or manually creating questions.</p>
            <p>At the same time, modern AI models are already very good at understanding educational content.</p>
            <p>So I started building an experimental local-first learning platform called Learning Web.</p>
            <p>The goal is not to replace teachers or schools.</p>
            <p>The goal is to make revision more interactive, more personalised, and easier for families to create themselves.</p>
          </div>
          <figure class="about-visual">
            <a href="./brand/learning-web-overview.png" target="_blank" rel="noreferrer">
              <img src="./brand/learning-web-overview.png" alt="Learning Web project overview showing local study materials transformed into interactive revision activities" />
            </a>
          </figure>
        </div>
      </section>

      <section class="section-card about-prose">
        <h2>Why This Project Matters</h2>
        <p>Many AI education projects focus on cloud platforms, enterprise systems, or futuristic AI marketing concepts.</p>
        <p>This project focuses on something smaller but practical:</p>
        <p class="about-callout">Helping ordinary families create their own interactive revision content using AI on their local machine.</p>
        <p>The long-term vision is to allow anyone — even without programming experience — to generate personalised learning activities from their own materials with minimal effort.</p>
        <p>The project is still experimental and evolving, but it already demonstrates how AI can assist in transforming raw educational content into reusable learning experiences.</p>
      </section>
    </div>
  `;
}

async function renderVocabTab() {
  const prefs = persisted.prefs.vocab;
  if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedRevisionPacks().length) {
    prefs.subject = "";
    saveStoredState(persisted);
  }
  // Hard-validate datasetId — reset if it no longer exists (e.g. deleted upload).
  {
    const knownIds = new Set(listDatasets(runtime.manifest).map((d) => d.id));
    if (prefs.datasetId && !knownIds.has(prefs.datasetId)) {
      prefs.subject = "";
      prefs.datasetId = "";
      saveStoredState(persisted);
    }
  }
  if (!prefs.subject) prefs.subject = "language";
  if (!prefs.curriculum) prefs.curriculum = "all";
  const dataset = findDataset(runtime.manifest, prefs.datasetId);
  const subject = getDatasetSubject(dataset);
  const isLanguage = subject === "language";
  const isLiterature = subject === "literature";

  const words = await loadVocabItems(runtime.manifest, dataset.id);
  const scopedWords = filterWordsForScope(words, dataset, prefs);

  // ── Filter options — vary by subject ──────────────────────────────────────
  // Language: Part of speech + Category (topics)
  // Literature: Type filter from cat:* tags (e.g. Theme, Character, Technique)
  // Geography / History / Science: Search only — pack already IS the topic
  const partOfSpeechOptions = isLanguage
    ? [...new Set(scopedWords.map((w) => fallback(w.part_of_speech, fallback(w.pos, "")).trim()).filter(Boolean))].sort()
    : [];

  // Language categories: checkboxes only for packs without stage selection (German).
  // Latin uses stage checkboxes instead; Geography/History/Science show neither.
  const usesCategoryCheckboxes = isLanguage && !usesStageSelection(dataset);
  const categoryOptions = usesCategoryCheckboxes
    ? [...new Set([].concat(...scopedWords.map((w) => w.categories || [])))].filter(Boolean).sort()
    : [];
  const selectedCategories = usesCategoryCheckboxes
    ? getSelectedCategories(prefs, categoryOptions)
    : [];

  // Literature "Type" options: extracted from cat:* tags, displayed without prefix
  const literatureTypeOptions = isLiterature
    ? [...new Set([].concat(...scopedWords.map((w) => (w.tags || []).filter((t) => t.startsWith("cat:")))))]
        .sort()
        .map((t) => ({ value: t, label: humanizeLabel(t.replace(/^cat:/, "")) }))
    : [];

  // ── Apply filters ─────────────────────────────────────────────────────────
  const filtered = scopedWords
    .filter((word) => !isLanguage || !prefs.partOfSpeech || fallback(word.part_of_speech, fallback(word.pos, "")) === prefs.partOfSpeech)
    .filter((word) => {
      if (isLiterature) return !prefs.category || (word.tags || []).includes(prefs.category);
      if (usesCategoryCheckboxes) {
        const cats = word.categories || [];
        return !cats.length || cats.some((c) => selectedCategories.includes(c));
      }
      return true; // geography / history / science — no category filter
    })
    .filter((word) => {
      const query = prefs.search.trim().toLowerCase();
      if (!query) return true;
      return [word.de, word.en, word.topic].concat(word.tags || [])
        .join(" ")
        .toLowerCase()
        .includes(query);
    });

  const visibleWords = filtered.slice(0, 120);
  const mastered = countMasteredWords(persisted, filtered);

  const searchPlaceholder = isLanguage
    ? `Type ${getStudyLanguageLabel(dataset)}, ${getTargetLanguageLabel(dataset)}, topic, or tag and press Enter`
    : `Type term, definition, or tag and press Enter`;

  // ── Render filter controls ────────────────────────────────────────────────
  const posField = isLanguage
    ? renderSelectField("vocab-pos", "Part of speech", [{ value: "", label: "All parts of speech" }, ...partOfSpeechOptions.map((item) => ({ value: item, label: POS_LABELS[item] || humanizeLabel(item) }))], prefs.partOfSpeech)
    : "";

  const categoryField = usesCategoryCheckboxes && categoryOptions.length
    ? renderCategoryFieldset("vocab", categoryOptions, selectedCategories)
    : isLiterature && literatureTypeOptions.length
      ? renderSelectField("vocab-category", "Type", [{ value: "", label: "All types" }, ...literatureTypeOptions], prefs.category)
      : "";

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
            ${renderStudyBookButton(dataset)}
          </div>
        </div>
        ${renderSubjectCardGrid(prefs.subject, "select-vocab-subject")}
        ${prefs.subject === MY_PACKS_SUBJECT ? "" : renderCurriculumPills(prefs.curriculum, "select-vocab-curriculum")}

        <div class="form-grid" style="margin-top:18px;">
          ${renderDatasetSelectFiltered("vocab-dataset", prefs.datasetId, prefs.subject, prefs.curriculum)}
          ${usesStageSelection(dataset)
            ? renderStageFieldset("vocab", getDatasetStageOptions(dataset), getSelectedStages(prefs, dataset))
            : isLanguage
              ? renderYearSelect("vocab-year", prefs.year, dataset)
              : ""}
          ${posField}
          ${categoryField}
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
            // For Literature: find the first cat:* tag to show as a type badge
            const typeTag = isLiterature
              ? (word.tags || []).find((t) => t.startsWith("cat:"))
              : null;
            const typeBadge = typeTag
              ? `<span class="badge blue">${escapeHtml(humanizeLabel(typeTag.replace(/^cat:/, "")))}</span>`
              : "";

            return `
              <article class="vocab-card">
                <div class="status-bar">
                  <div class="chip-row">
                    <span class="badge ${status.tone}">${status.label}</span>
                    ${word.level ? `<span class="badge blue">${escapeHtml(word.level)}</span>` : ""}
                    ${isLanguage && word.topic ? `<span class="badge amber">${escapeHtml(word.topic)}</span>` : ""}
                    ${typeBadge}
                  </div>
                  <button class="button ghost" data-action="speak" data-text="${escapeHtml(word.de)}" data-language="${escapeHtml(getStudyLanguageCode(dataset))}">${escapeHtml(speakLabel(getStudyLanguageCode(dataset)))}</button>
                </div>
                <div>
                  <h3>${escapeHtml(word.de)}</h3>
                  <p class="translation">${escapeHtml(word.en)}</p>
                </div>
                <div class="meta-row">
                  ${word.gender ? `<span class="badge coral">gender: ${escapeHtml(word.gender)}</span>` : ""}
                  ${word.plural ? `<span class="badge blue">plural: ${escapeHtml(word.plural)}</span>` : ""}
                </div>
                ${word.exampleDe || word.exampleEn ? `
                  <div class="divider"></div>
                  ${word.exampleDe ? `<p class="tiny muted">${escapeHtml(word.exampleDe)}</p>` : ""}
                  ${word.exampleEn ? `<p class="tiny muted">${escapeHtml(word.exampleEn)}</p>` : ""}
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
  if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedRevisionPacks().length) {
    prefs.subject = "";
    saveStoredState(persisted);
  }
  // Hard-validate datasetId — if it no longer exists in the manifest (e.g. a
  // deleted upload), reset to default so the tab never renders a broken state.
  {
    const knownIds = new Set(listDatasets(runtime.manifest).map((d) => d.id));
    if (prefs.datasetId && !knownIds.has(prefs.datasetId)) {
      prefs.subject = "";
      prefs.datasetId = "";
      saveStoredState(persisted);
    }
  }
  if (!prefs.subject) prefs.subject = "language";
  if (!prefs.direction) prefs.direction = "studyToTarget";
  if (!prefs.answerMode) prefs.answerMode = "mixed";

  let dataset = findDataset(runtime.manifest, prefs.datasetId);
  const datasetSubject = getDatasetSubject(dataset);
  if (prefs.subject !== MY_PACKS_SUBJECT && datasetSubject !== prefs.subject) {
    // Either the user just clicked a subject and we haven't switched dataset
    // yet (handled in the click handler), or we hit some inconsistency.
    // Trust the dataset and snap subject to match it.
    // Exception: MY_PACKS_SUBJECT is a UI-only sentinel — never overwrite it.
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
            <span class="count-pill blue">${filteredWords.length || filterFillBlankByStage(unifiedPack, prefs, dataset).length} ${filteredWords.length ? "words" : "questions"} in scope</span>
            <span class="count-pill green">${mastered} mastered here</span>
          </div>
        </div>

        ${renderSubjectCardGrid(prefs.subject)}
        ${prefs.subject === MY_PACKS_SUBJECT ? "" : renderCurriculumPills(prefs.curriculum || "all")}

        <div class="form-grid" style="margin-top:18px;">
          ${renderDatasetSelectFiltered("quiz-dataset", prefs.datasetId, prefs.subject, prefs.curriculum || "all")}
          ${usesStageSelection(dataset)
            ? renderStageFieldset("quiz", getDatasetStageOptions(dataset), getSelectedStages(prefs, dataset))
            : getDatasetSubject(dataset) === "language"
              ? renderYearSelect("quiz-year", prefs.year, dataset)
              : ""}
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
          ${renderStudyBookButton(dataset)}
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

async function renderCrosswordTab() {
  const prefs = persisted.prefs.crossword;
  if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedRevisionPacks().length) {
    prefs.subject = "";
    saveStoredState(persisted);
  }
  if (!prefs.subject) prefs.subject = "language";
  if (!prefs.curriculum) prefs.curriculum = "all";
  if (!prefs.datasetId) prefs.datasetId = "core";
  if (!prefs.wordCount) prefs.wordCount = 10;

  let dataset = findDataset(runtime.manifest, prefs.datasetId);
  if (!isCrosswordDataset(dataset)) {
    const fallbackDatasets = listCrosswordDatasetsBySubjectAndCurriculum(prefs.subject, prefs.curriculum);
    if (fallbackDatasets.length) {
      prefs.datasetId = fallbackDatasets[0].id;
      dataset = fallbackDatasets[0];
      applyDatasetDefaults("crossword", { resetStages: true });
      saveStoredState(persisted);
    }
  }

  const datasetSubject = getDatasetSubject(dataset);
  if (prefs.subject !== MY_PACKS_SUBJECT && datasetSubject !== prefs.subject) {
    prefs.subject = datasetSubject;
    saveStoredState(persisted);
  }

  if (runtime.crossword) {
    return renderCrosswordGame(runtime.crossword);
  }

  const words = await loadVocabItems(runtime.manifest, dataset.id);
  const filteredWords = filterWordsForScope(words, dataset, prefs);
  const entries = crosswordEntriesFromWords(filteredWords);
  const mastered = countMasteredWords(persisted, filteredWords);
  const wordCountOptions = buildCrosswordWordCountOptions(entries.length);
  if (wordCountOptions.length) {
    const largestAvailable = Number(wordCountOptions[wordCountOptions.length - 1].value);
    if (prefs.wordCount > largestAvailable) {
      prefs.wordCount = largestAvailable;
      saveStoredState(persisted);
    }
  }

  return `
    <div class="section-stack">
      <section class="session-card lead">
        <div class="question-meta">
          <div>
            <h2>Crossword setup</h2>
            <p class="muted tiny">Pick a vocabulary pack and build a fresh crossword in the browser.</p>
          </div>
          <div class="chip-row">
            <span class="count-pill blue">${entries.length} crossword words</span>
            <span class="count-pill green">${mastered} mastered here</span>
          </div>
        </div>

        ${renderCrosswordSubjectCardGrid(prefs.subject)}
        ${renderCurriculumPills(prefs.curriculum || "all", "select-crossword-curriculum")}

        <div class="form-grid" style="margin-top:18px;">
          ${renderCrosswordDatasetSelect(prefs.datasetId, prefs.subject, prefs.curriculum || "all")}
          ${usesStageSelection(dataset)
            ? renderStageFieldset("crossword", getDatasetStageOptions(dataset), getSelectedStages(prefs, dataset))
            : getDatasetSubject(dataset) === "language"
              ? renderYearSelect("crossword-year", prefs.year, dataset)
              : ""}
          ${renderSelectField(
            "crossword-word-count",
            "Words",
            wordCountOptions.length ? wordCountOptions : [{ value: "0", label: "0" }],
            String(wordCountOptions.length ? prefs.wordCount : 0),
          )}
          <div class="field">
            <label for="crossword-exclude-mastered">Word pool</label>
            <select id="crossword-exclude-mastered" class="select">
              <option value="true" ${prefs.excludeMastered ? "selected" : ""}>Exclude mastered words</option>
              <option value="false" ${!prefs.excludeMastered ? "selected" : ""}>Include all words</option>
            </select>
          </div>
        </div>

        <div class="action-row" style="margin-top:18px;">
          <button class="button" data-action="start-crossword" ${entries.length < 5 ? "disabled" : ""}>Start game</button>
          <button class="button secondary" data-action="open-review">Open review desk</button>
        </div>
        ${runtime.crosswordError ? `<p class="muted tiny" style="margin-top:12px;color:#cc633f;font-weight:700;">${escapeHtml(runtime.crosswordError)}</p>` : ""}
        ${entries.length >= 5
          ? `<p class="muted tiny" style="margin-top:12px;">This setup can generate from ${entries.length} crossword-friendly answers. Random sets are retried automatically if the first layout is weak.</p>`
          : `<p class="muted tiny" style="margin-top:12px;">No crossword can be built from the current setup yet. Try another pack or include more words.</p>`}
      </section>
    </div>
  `;
}

function renderCrosswordGame(state) {
  const { game, dataset, poolSize, letters = {}, checked, revealed, message } = state;
  const across = game.placedEntries
    .filter((entry) => entry.direction === "across")
    .sort((a, b) => a.number - b.number);
  const down = game.placedEntries
    .filter((entry) => entry.direction === "down")
    .sort((a, b) => a.number - b.number);

  const messageClass = message && message.tone === "good" ? "is-good" : message && message.tone === "bad" ? "is-bad" : "";

  return `
    <div class="section-stack">
      <section class="session-card lead">
        <div class="crossword-header">
          <div>
            <h2>Crossword</h2>
            <p class="muted tiny">${escapeHtml(dataset.displayName)}</p>
            <div class="chip-row" style="margin-top:10px;">
              <span class="count-pill blue">${game.placedEntries.length} placed</span>
              <span class="count-pill amber">${poolSize} word pool</span>
              <span class="count-pill green">${game.grid.length}×${game.grid[0] ? game.grid[0].length : 0} grid</span>
            </div>
          </div>
          <div class="action-row crossword-actions">
            <button class="button" data-action="crossword-check">Check answers</button>
            <button class="button secondary" data-action="crossword-reveal">Reveal</button>
            <button class="button ghost" data-action="crossword-new">New game</button>
            <button class="button ghost" data-action="crossword-options">Options</button>
          </div>
        </div>
      </section>

      <section class="crossword-layout">
        ${renderCrosswordBoard(game, letters, checked || revealed)}
        <aside class="section-card crossword-clues">
          <div class="crossword-message ${messageClass}">${message ? escapeHtml(message.text) : ""}</div>
          ${renderCrosswordClues("Across", across, revealed)}
          ${renderCrosswordClues("Down", down, revealed)}
        </aside>
      </section>
    </div>
  `;
}

function renderCrosswordBoard(game, letters, showResults) {
  const numbers = new Map(game.placedEntries.map((entry) => [`${entry.row}:${entry.col}`, entry.number]));
  const cols = game.grid[0] ? game.grid[0].length : 0;
  return `
    <div class="section-card crossword-board-wrap">
      <div class="crossword-board" style="grid-template-columns:repeat(${cols}, minmax(30px, 42px));">
        ${game.grid.map((row, rowIndex) => row.map((answer, colIndex) => {
          const key = `${rowIndex}:${colIndex}`;
          const value = letters[key] || "";
          const isCorrect = value.toUpperCase() === answer;
          const classes = ["crossword-cell"];
          if (!answer) classes.push("is-block");
          if (answer && showResults && isCorrect) classes.push("is-correct");
          if (answer && showResults && value && !isCorrect) classes.push("is-wrong");
          return `
            <div class="${classes.join(" ")}">
              ${answer && numbers.has(key) ? `<span class="crossword-number">${numbers.get(key)}</span>` : ""}
              ${answer ? `
                <input
                  class="crossword-input"
                  aria-label="Crossword row ${rowIndex + 1}, column ${colIndex + 1}"
                  autocomplete="off"
                  inputmode="text"
                  maxlength="1"
                  value="${escapeHtml(value)}"
                  data-crossword-cell="${escapeHtml(key)}"
                  data-row="${rowIndex}"
                  data-col="${colIndex}"
                />
              ` : ""}
            </div>
          `;
        }).join("")).join("")}
      </div>
    </div>
  `;
}

function renderCrosswordClues(title, entries, revealed) {
  return `
    <section class="crossword-clue-section">
      <h3>${escapeHtml(title)}</h3>
      ${entries.length ? `
        <ol class="crossword-clue-list">
          ${entries.map((entry) => `
            <li value="${entry.number}">
              ${escapeHtml(entry.clue)}
              <span class="crossword-answer-meta">
                (${entry.answer.length} letters${revealed ? `, ${escapeHtml(entry.displayAnswer)}` : ""})
              </span>
            </li>
          `).join("")}
        </ol>
      ` : `<p class="muted tiny">No ${escapeHtml(title.toLowerCase())} clues this time.</p>`}
    </section>
  `;
}

// ─── Stimulus rendering ───────────────────────────────────────────────────────
//
// A stimulus block is optional context attached to any question item —
// a diagram, source extract, or data table that the student reads before
// answering. Rendered above the question prompt.
//
// Supported stimulus.type values (Phase 1):
//   asciiDiagram  — monospaced text diagram (map, grid, OS symbols, etc.)
//   mapExtract    — alias for asciiDiagram
//   sourceExtract — quoted primary/secondary source text
//   table         — simple 2-D table with optional header row
//   dataTable     — alias for table (e.g. climate data, traffic survey)

function renderStimulus(stimulus) {
  if (!stimulus || typeof stimulus !== "object") return "";

  const title = stimulus.title
    ? `<p class="stimulus-title">${escapeHtml(stimulus.title)}</p>`
    : "";

  const type = String(stimulus.type || "").toLowerCase();

  // ── ASCII / map diagram ──────────────────────────────────────────────────
  if (type === "asciidiagram" || type === "mapextract") {
    const key = Array.isArray(stimulus.key) && stimulus.key.length
      ? `<ul class="stimulus-key">${stimulus.key.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>`
      : "";
    return `
      <div class="stimulus-block stimulus-diagram">
        ${title}
        <pre class="diagram-block">${escapeHtml(stimulus.content || "")}</pre>
        ${key}
      </div>`;
  }

  // ── Source extract / quote ───────────────────────────────────────────────
  if (type === "sourceextract" || type === "source_extract") {
    return `
      <div class="stimulus-block stimulus-extract">
        ${title}
        <blockquote class="source-extract-block">${escapeHtml(stimulus.content || "")}</blockquote>
      </div>`;
  }

  // ── Table / data table ───────────────────────────────────────────────────
  if (type === "table" || type === "datatable" || type === "data_table") {
    const headers = Array.isArray(stimulus.headers) ? stimulus.headers : [];
    const rows = Array.isArray(stimulus.rows)
      ? stimulus.rows
      : Array.isArray(stimulus.content)
        ? stimulus.content
        : [];
    const headerHtml = headers.length
      ? `<thead><tr>${headers.map((h) => `<th>${escapeHtml(String(h))}</th>`).join("")}</tr></thead>`
      : "";
    const bodyHtml = rows
      .map((row) => {
        const cells = Array.isArray(row) ? row : [row];
        return `<tr>${cells.map((c) => `<td>${escapeHtml(String(c ?? ""))}</td>`).join("")}</tr>`;
      })
      .join("");
    return `
      <div class="stimulus-block stimulus-table">
        ${title}
        <div class="data-table-wrap"><table class="data-table-block">${headerHtml}<tbody>${bodyHtml}</tbody></table></div>
      </div>`;
  }

  // ── Fallback: plain text ─────────────────────────────────────────────────
  if (stimulus.content) {
    return `
      <div class="stimulus-block">
        ${title}
        <p class="muted tiny" style="white-space:pre-wrap;">${escapeHtml(String(stimulus.content))}</p>
      </div>`;
  }

  return "";
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
        ${question.stimulus ? renderStimulus(question.stimulus) : ""}
        ${(() => {
          const posRaw   = question.pos || "";
          const posLabel = posRaw ? (POS_LABELS[posRaw] || humanizeLabel(posRaw)) : "";
          const questionMeta = [
            posLabel          ? { label: posLabel,        style: "blue"  } : null,
            question.topic    ? { label: question.topic,  style: "amber" } : null,
          ].filter(Boolean);
          return renderQuestionBox({
            eyebrow:   question.modeTitle,
            modeLabel: describeQuizMode(question),
            prompt:    question.prompt,
            subtitle:  question.subtitle || "",
            meta:      questionMeta,
            sideContent: `
              <div class="chip-row">
                <span class="count-pill blue">${escapeHtml(progressText)}</span>
                <span class="count-pill green">${session.score} correct</span>
                <button class="button ghost" data-action="speak" data-text="${escapeHtml(fallback(question.speechText, question.answer))}" data-language="${escapeHtml(fallback(question.speechLanguage, "en-GB"))}">${escapeHtml(speakLabel(fallback(question.speechLanguage, "en-GB")))}</button>
                ${renderStudyBookButton(
                  findDataset(runtime.manifest, persisted.prefs.quiz.datasetId),
                  {
                    anchor: question.sourceRef?.anchor || "",
                    mdPath: question.sourceRef?.mdFile  || "",
                    label: question.sourceRef ? `Jump to "${question.sourceRef.heading}"` : "Study Book",
                    cls: "sb-trigger-sm",
                  }
                )}
              </div>
            `,
          });
        })()}
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
              ${answer.speechText ? `<button class="button ghost" data-action="speak" data-text="${escapeHtml(answer.speechText)}" data-language="${escapeHtml(fallback(answer.speechLanguage, "en-GB"))}">${escapeHtml(speakLabel(fallback(answer.speechLanguage, "en-GB")))}</button>` : ""}
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
            ${a.speechText ? `<button class="button ghost" style="margin-top:4px;" data-action="speak" data-text="${escapeHtml(a.speechText)}" data-language="${escapeHtml(a.speechLanguage || "en-GB")}">▶ ${escapeHtml(speakLabel(a.speechLanguage || "en-GB"))}</button>` : ""}
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
  const prefs = persisted.prefs.builder;
  if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedBuilderPacks().length) {
    prefs.subject = "";
    saveStoredState(persisted);
  }
  if (!prefs.subject) prefs.subject = "history";
  if (!prefs.curriculum) prefs.curriculum = "all";
  // Determine which packs are available for the current subject+curriculum
  const subjectPacks = listSentenceBuilderPacksBySubjectAndCurriculum(
    runtime.manifest, prefs.subject, prefs.curriculum,
  );
  const allPacks = listSentenceBuilderPacks(runtime.manifest);
  const packs = subjectPacks.length ? subjectPacks : allPacks;
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
            ${renderStudyBookButton(findDataset(runtime.manifest, persisted.prefs.quiz.datasetId))}
          </div>
        </div>
        ${renderBuilderSubjectCardGrid(prefs.subject)}
        ${prefs.subject === MY_PACKS_SUBJECT ? "" : renderCurriculumPills(prefs.curriculum, "select-builder-curriculum")}

        <div class="form-grid" style="margin-top:18px;">
          ${renderBuilderPackSelectFiltered(packId, prefs.subject, prefs.curriculum)}
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

  // If MY_PACKS_SUBJECT is stored but there are no uploaded passage groups, fall
  // back to a real subject so the tab doesn't render an empty error state.
  if (prefs.subject === MY_PACKS_SUBJECT && !listUploadedPassageGroups().length) {
    prefs.subject = "";
    saveStoredState(persisted);
  }

  // Hard-validate groupId: if it doesn't exist in any passage group (e.g. it was
  // set to a revision-pack ID that was uploaded but is not a passage pack), reset
  // to the first available passage group. This prevents "No reading packs found"
  // caused by a stale or mismatched groupId.
  const knownGroupIds = new Set(groups.map((g) => g.id));
  if (prefs.groupId && !knownGroupIds.has(prefs.groupId)) {
    prefs.subject = "";
    prefs.groupId = groups[0] ? groups[0].id : "";
    const resetPacks = listPassagePacks(runtime.manifest, prefs.groupId);
    prefs.packId = resetPacks[0] ? resetPacks[0].id : "";
    runtime.passages = null;
    saveStoredState(persisted);
  }

  // Bootstrap subject pref from current groupId if not yet set.
  if (!prefs.subject) {
    const currentGroup = groups.find((g) => g.id === prefs.groupId);
    prefs.subject = currentGroup ? getPassageGroupSubject(currentGroup) : "language";
  }

  // If the stored groupId belongs to a different subject, snap to first group
  // for the current subject (happens when subject card is clicked).
  // Exception: MY_PACKS_SUBJECT is a UI-only sentinel — skip snap-back logic.
  const storedGroupSubject = getPassageGroupSubject(groups.find((g) => g.id === prefs.groupId));
  if (prefs.subject !== MY_PACKS_SUBJECT && storedGroupSubject !== prefs.subject) {
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
          ${prefs.subject === MY_PACKS_SUBJECT ? "" : renderCurriculumPills(prefs.curriculum || "all", "select-passage-curriculum")}

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
          ${(() => {
            const currentGroup = listPassageGroups(runtime.manifest).find((g) => g.id === prefs.groupId);
            const packSpeechLang = currentGroup?.speechLanguage || "en-GB";
            return renderVoiceSelector(packSpeechLang, prefs.voiceName || "");
          })()}
          <div class="action-row" style="margin-top:18px;">
            <button class="button" data-action="reading-start">Start reading practice</button>
            ${renderStudyBookButton(findDataset(runtime.manifest, persisted.prefs.quiz.datasetId))}
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
          prompt: current.sourceTitle,
          subtitle: `${current.targetTitle} · ${current.level} · ${current.topic}`,
          sideContent: `
            <div class="chip-row">
              <span class="count-pill blue">${passages.completedThisSession} completed this session</span>
              <button class="button ghost" data-action="play-passage">Play source text</button>
              ${speechSupported ? `<button class="button ghost" data-action="stop-passage">Stop audio</button>` : ""}
            </div>
          `,
        })}
        ${prefs.showGerman ? `<blockquote style="margin-top:18px;">${escapeHtml(current.sourceText)}</blockquote>` : `<p class="muted tiny" style="margin-top:18px;">Source text hidden. Listen first, then reveal when you need it.</p>`}
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
                    <div class="passage-question-prompt">${escapeHtml(question.question || "Question prompt missing")}</div>
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
              <blockquote style="margin-top:16px;">${escapeHtml(current.targetText)}</blockquote>
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
            ${renderStudyBookButton(dataset)}
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
      <button class="button ghost" data-action="speak" data-text="${escapeHtml(word.de)}" data-language="${escapeHtml(getStudyLanguageCode(dataset))}">${escapeHtml(speakLabel(getStudyLanguageCode(dataset)))}</button>
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
  // Stage-filtered fillBlank count is used both for mode-detection and the
  // fillBlank question-count calculation so the question-count dropdown and the
  // "questions in scope" badge stay in sync with the stage checkboxes.
  const filteredFillBlankItems = filterFillBlankByStage(unifiedPack, prefs, dataset);
  const fillBlankCount = filteredFillBlankItems.length;
  const modes = resolveQuizModesForUI({
    subject: getDatasetSubject(dataset),
    direction: prefs.direction,
    answerMode: prefs.answerMode,
    fillBlankCount,
    vocabCount: filteredWords.length,
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
        return total + fillBlankCount; // already stage-filtered above
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

function buildCrosswordWordCountOptions(maxWordCount) {
  const defaults = [8, 10, 12];
  const limited = defaults.filter((value) => value <= maxWordCount);
  if (maxWordCount > 0 && !limited.length) {
    limited.push(maxWordCount);
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
  computing:  { label: "Computing",  icon: "💻" },
  religion:   { label: "Religion",   icon: "🕊️" },
  other:      { label: "Other",      icon: "🗂️" },
};

// Sentinel subject value for user-uploaded packs — not part of the canonical
// SUBJECTS list in data.js; handled specially throughout the UI.
const MY_PACKS_SUBJECT = "my_packs";

function listUploadedRevisionPacks() {
  return (runtime.manifest.revisionPacks || []).filter((p) => p._uploaded);
}
function listUploadedBuilderPacks() {
  return (runtime.manifest.sentenceBuilderPacks || []).filter((p) => p._uploaded);
}
function listUploadedPassageGroups() {
  return (runtime.manifest.passageGroups || []).filter((p) => p._uploaded);
}

function renderMyPacksCard(activeSubject, action, count) {
  const isActive = activeSubject === MY_PACKS_SUBJECT;
  const isEmpty  = count === 0;
  const classes  = ["subject-card", "my-packs-card"];
  if (isActive) classes.push("is-active");
  if (isEmpty)  classes.push("is-empty");
  const btn = isEmpty ? "" : `data-action="${action}" data-value="${MY_PACKS_SUBJECT}"`;
  return `
    <button type="button" class="${classes.join(" ")}" ${btn} ${isEmpty ? "disabled" : ""}>
      <span class="subject-icon" aria-hidden="true">📦</span>
      <span class="subject-text">
        <span class="subject-label">My Packs</span>
        ${isEmpty
          ? `<span class="subject-meta">No uploads</span>`
          : `<span class="subject-meta">${count} pack${count === 1 ? "" : "s"}</span>`}
      </span>
    </button>
  `;
}

// Maps single-letter PoS abbreviations (legacy Latin pack data) to full display labels.
// New packs should store full words directly; this is a safety-net fallback.
const POS_LABELS = {
  n: "Noun",
  v: "Verb",
  a: "Adjective",
  d: "Adverb",
  r: "Preposition",
  p: "Pronoun",
  c: "Conjunction",
  i: "Interjection",
};

function isCrosswordDataset(dataset) {
  return Number((dataset && (dataset.wordCount || (dataset.counts && dataset.counts.vocab))) || 0) > 0;
}

function listCrosswordDatasetsBySubjectAndCurriculum(subject, curriculum = "all") {
  return listDatasetsBySubjectAndCurriculum(runtime.manifest, subject, curriculum).filter(isCrosswordDataset);
}

function listCrosswordDatasetsBySubject(subject) {
  return listDatasetsBySubject(runtime.manifest, subject).filter(isCrosswordDataset);
}

function renderSubjectCardGrid(activeSubject, action = "select-subject") {
  const cards = SUBJECTS.map((subject) => {
    const meta = SUBJECT_LABELS[subject];
    const datasets = listDatasetsBySubject(runtime.manifest, subject);
    const isActive = subject === activeSubject;
    const isEmpty = datasets.length === 0;
    const classes = ["subject-card"];
    if (isActive) classes.push("is-active");
    if (isEmpty) classes.push("is-empty");
    const button = isEmpty ? "" : `data-action="${action}" data-value="${escapeHtml(subject)}"`;
    return `
      <button type="button" class="${classes.join(" ")}" ${button} ${isEmpty ? "disabled" : ""}>
        <span class="subject-icon" aria-hidden="true">${meta.icon}</span>
        <span class="subject-text">
          <span class="subject-label">${escapeHtml(meta.label)}</span>
          ${isEmpty
            ? `<span class="subject-meta">Coming soon</span>`
            : `<span class="subject-meta">${datasets.length} pack${datasets.length === 1 ? "" : "s"}</span>`}
        </span>
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you learning?</div>
      <div class="subject-card-grid">${cards}${renderMyPacksCard(activeSubject, action, listUploadedRevisionPacks().length)}</div>
    </div>
  `;
}

function renderCrosswordSubjectCardGrid(activeSubject) {
  const cards = SUBJECTS.map((subject) => {
    const meta = SUBJECT_LABELS[subject];
    const datasets = listCrosswordDatasetsBySubject(subject);
    const isActive = subject === activeSubject;
    const isEmpty = datasets.length === 0;
    const classes = ["subject-card"];
    if (isActive) classes.push("is-active");
    if (isEmpty) classes.push("is-empty");
    const button = isEmpty ? "" : `data-action="select-crossword-subject" data-value="${escapeHtml(subject)}"`;
    return `
      <button type="button" class="${classes.join(" ")}" ${button} ${isEmpty ? "disabled" : ""}>
        <span class="subject-icon" aria-hidden="true">${meta.icon}</span>
        <span class="subject-text">
          <span class="subject-label">${escapeHtml(meta.label)}</span>
          ${isEmpty
            ? `<span class="subject-meta">No vocab packs</span>`
            : `<span class="subject-meta">${datasets.length} pack${datasets.length === 1 ? "" : "s"}</span>`}
        </span>
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you learning?</div>
      <div class="subject-card-grid">${cards}${renderMyPacksCard(activeSubject, "select-crossword-subject", listUploadedRevisionPacks().length)}</div>
    </div>
  `;
}

function renderBuilderSubjectCardGrid(activeSubject) {
  const cards = SUBJECTS.map((subject) => {
    const meta = SUBJECT_LABELS[subject];
    const packs = listSentenceBuilderPacksBySubject(runtime.manifest, subject);
    const isActive = subject === activeSubject;
    const isEmpty = packs.length === 0;
    const classes = ["subject-card"];
    if (isActive) classes.push("is-active");
    if (isEmpty) classes.push("is-empty");
    const button = isEmpty ? "" : `data-action="select-builder-subject" data-value="${escapeHtml(subject)}"`;
    return `
      <button type="button" class="${classes.join(" ")}" ${button} ${isEmpty ? "disabled" : ""}>
        <span class="subject-icon" aria-hidden="true">${meta.icon}</span>
        <span class="subject-text">
          <span class="subject-label">${escapeHtml(meta.label)}</span>
          ${isEmpty
            ? `<span class="subject-meta">No packs yet</span>`
            : `<span class="subject-meta">${packs.length} pack${packs.length === 1 ? "" : "s"}</span>`}
        </span>
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you learning?</div>
      <div class="subject-card-grid">${cards}${renderMyPacksCard(activeSubject, "select-builder-subject", listUploadedBuilderPacks().length)}</div>
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
        <span class="subject-text">
          <span class="subject-label">${escapeHtml(meta.label)}</span>
          ${isEmpty
            ? `<span class="subject-meta">No packs yet</span>`
            : `<span class="subject-meta">${groups.length} book${groups.length === 1 ? "" : "s"}</span>`}
        </span>
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:18px;">
      <div class="fieldset-title">What are you studying?</div>
      <div class="subject-card-grid">${cards}${renderMyPacksCard(activeSubject, "select-passage-subject", listUploadedPassageGroups().length)}</div>
    </div>
  `;
}

function renderPassageGroupSelectFiltered(currentValue, subject) {
  const groups = subject === MY_PACKS_SUBJECT
    ? listUploadedPassageGroups()
    : listPassageGroupsBySubject(runtime.manifest, subject);
  if (!groups.length) {
    return `
      <div class="field">
        <label>Book / Group</label>
        <p class="muted tiny" style="margin-top:6px;">${subject === MY_PACKS_SUBJECT ? "No uploaded reading packs yet." : "No reading packs yet for this subject."}</p>
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

// ─── Curriculum pill row ─────────────────────────────────────────────────────

function renderCurriculumPills(activeCurriculum, action = "select-curriculum") {
  const options = [{ id: "all", label: "All" }, ...CURRICULUMS.map((c) => ({ id: c, label: CURRICULUM_LABELS[c] }))];
  const buttons = options.map((opt) => {
    const isActive = opt.id === (activeCurriculum || "all");
    return `
      <button type="button"
              class="pill-button ${isActive ? "is-active" : ""}"
              data-action="${escapeHtml(action)}"
              data-value="${escapeHtml(opt.id)}">
        ${escapeHtml(opt.label)}
      </button>
    `;
  }).join("");
  return `
    <div class="field" style="margin-top:16px;">
      <div class="fieldset-title">Curriculum</div>
      <div class="pill-row curriculum-pill-row">${buttons}</div>
    </div>
  `;
}

function renderDatasetSelectFiltered(id, currentValue, subject, curriculum = "all") {
  const datasets = subject === MY_PACKS_SUBJECT
    ? listUploadedRevisionPacks()
    : listDatasetsBySubjectAndCurriculum(runtime.manifest, subject, curriculum);
  if (!datasets.length) {
    return `
      <div class="field field-wide">
        <label>Dataset</label>
        <p class="muted tiny" style="margin-top:6px;">${subject === MY_PACKS_SUBJECT ? "No uploaded packs yet. Use the Admin tab to upload a pack." : `No packs for this subject${curriculum !== "all" ? ` / ${CURRICULUM_LABELS[curriculum] || curriculum}` : ""}.`}</p>
      </div>
    `;
  }
  return renderSelectField(
    id,
    "Pack",
    datasets.map((dataset) => ({
      value: dataset.id,
      label: `${dataset.displayName}${dataset.wordCount ? ` (${dataset.wordCount})` : ""}`,
    })),
    currentValue,
    "field-wide",
  );
}

function renderCrosswordDatasetSelect(currentValue, subject, curriculum = "all") {
  const datasets = listCrosswordDatasetsBySubjectAndCurriculum(subject, curriculum);
  if (!datasets.length) {
    return `
      <div class="field field-wide">
        <label>Pack</label>
        <p class="muted tiny" style="margin-top:6px;">No vocabulary packs for this subject${curriculum !== "all" ? ` / ${CURRICULUM_LABELS[curriculum] || curriculum}` : ""}.</p>
      </div>
    `;
  }
  return renderSelectField(
    "crossword-dataset",
    "Pack",
    datasets.map((dataset) => ({
      value: dataset.id,
      label: `${dataset.displayName}${dataset.wordCount ? ` (${dataset.wordCount})` : ""}`,
    })),
    currentValue,
    "field-wide",
  );
}

function renderBuilderPackSelectFiltered(currentValue, subject, curriculum = "all") {
  const packs = subject === MY_PACKS_SUBJECT
    ? listUploadedBuilderPacks()
    : listSentenceBuilderPacksBySubjectAndCurriculum(runtime.manifest, subject, curriculum);
  if (!packs.length) {
    return `
      <div class="field">
        <label>Pack</label>
        <p class="muted tiny" style="margin-top:6px;">${subject === MY_PACKS_SUBJECT ? "No uploaded builder packs yet." : `No builder packs for this subject${curriculum !== "all" ? ` / ${CURRICULUM_LABELS[curriculum] || curriculum}` : ""}.`}</p>
      </div>
    `;
  }
  return renderSelectField(
    "builder-pack",
    "Pack",
    packs.map((pack) => ({
      value: pack.id,
      label: `${pack.displayName}${pack.cardCount ? ` (${pack.cardCount})` : ""}`,
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
    <div class="field" style="margin-top:16px;">
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
    <div class="field" style="margin-top:16px;">
      <div class="fieldset-title">How to answer?</div>
      <div class="pill-row mode-pill-row">${buttons}</div>
    </div>
  `;
}

function renderYearSelect(id, currentValue, dataset) {
  const options = (Array.isArray(dataset && dataset.yearOptions) && dataset.yearOptions.length)
    ? dataset.yearOptions
    : YEAR_OPTIONS;
  return renderSelectField(
    id,
    "Year",
    options.map((year) => ({ value: year, label: year })),
    options.includes(currentValue) ? currentValue : "ALL",
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

function renderCategoryFieldset(sectionKey, categoryOptions, selectedCategories) {
  return `
    <div class="field stage-field" style="grid-column:1/-1;">
      <div class="fieldset-title">Category</div>
      <div class="stage-check-list">
        ${categoryOptions
          .map(
            (cat) => `
              <label class="mode-check stage-check">
                <input
                  type="checkbox"
                  name="${escapeHtml(sectionKey)}-category"
                  data-category="${escapeHtml(cat)}"
                  ${selectedCategories.includes(cat) ? "checked" : ""}
                />
                <span>${escapeHtml(humanizeLabel(cat))}</span>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderSelectField(id, label, options, currentValue, fieldClass = "") {
  return `
    <div class="field ${escapeHtml(fieldClass)}">
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

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || "";
}

function answerList(values) {
  return Array.isArray(values) ? values.filter(Boolean).join(" · ") : "";
}

function progressTone(stateLabel) {
  if (stateLabel === "Mastered") return "green";
  if (stateLabel === "Struggling") return "coral";
  if (stateLabel === "Reviewing") return "amber";
  if (stateLabel === "Learning") return "blue";
  return "";
}

function progressItemFromUnified(item, pack) {
  const data = item.data || {};
  const translations = data.translations || {};
  const srcCode = pack.sourceLanguageCode || "en-GB";
  const tgtCode = pack.targetLanguageCode || "en-GB";
  const src = firstDefined(translations[srcCode], Object.values(translations)[0], data.sourceWord, data.sourceSentence, data.prompt, data.sentence, data.title, item.id);
  const tgt = firstDefined(translations[tgtCode], Object.values(translations).slice(1)[0], data.targetWord, data.targetSentence, data.answer, data.definition, data.modelAnswer);
  return {
    id: item.id,
    packId: pack.id,
    packTitle: pack.displayName || pack.id,
    type: item.type,
    questionText: src,
    expectedAnswer: tgt,
  };
}

function progressItemsFromUnifiedPack(pack, unifiedPack) {
  const items = [];
  for (const item of unifiedPack.items || []) {
    const data = item.data || {};
    if (item.type === "passage") {
      const questions = Array.isArray(data.questions) ? data.questions : [];
      questions.forEach((question, index) => {
        const options = Array.isArray(question.options) ? question.options : [];
        const correctIndex = Number.isInteger(question.correctOptionIndex)
          ? question.correctOptionIndex
          : Number.isInteger(question.correct_option_index)
            ? question.correct_option_index
            : -1;
        items.push({
          id: `${item.id}::${question.id || index}`,
          packId: pack.id,
          packTitle: pack.displayName || pack.id,
          type: "passage",
          questionText: firstDefined(question.question, question.question_en, data.sourceTitle, data.targetTitle, item.id),
          expectedAnswer: firstDefined(question.correctAnswer, question.correct_answer, question.modelAnswer, question.model_answer_en, correctIndex >= 0 ? options[correctIndex] : ""),
        });
      });
      continue;
    }
    const meta = progressItemFromUnified(item, pack);
    if (item.type === "sequence") {
      meta.expectedAnswer = answerList(data.items);
    } else if (item.type === "categorySort") {
      meta.expectedAnswer = answerList(data.categories);
    }
    items.push(meta);
  }
  return items;
}

async function buildProgressCatalog() {
  const packages = [];
  const packItems = {};
  const itemsById = {};
  const datasets = listDatasets(runtime.manifest);

  await Promise.all(datasets.map(async (pack) => {
    let items = [];
    try {
      const unifiedPack = await loadUnifiedPack(runtime.manifest, pack.id);
      items = progressItemsFromUnifiedPack(pack, unifiedPack);
    } catch (_error) {
      items = [];
    }
    const totalItems = items.length || Number(pack.wordCount) || Number(pack.itemCount) || 0;
    packages.push({
      id: pack.id,
      title: pack.displayName || pack.id,
      subject: getDatasetSubject(pack),
      curriculum: getDatasetCurriculum(pack),
      totalItems,
      type: "revision",
    });
    packItems[pack.id] = items;
    items.forEach((item) => {
      itemsById[item.id] = item;
    });
  }));

  for (const pack of listSentenceBuilderPacks(runtime.manifest)) {
    if (packages.some((entry) => entry.id === pack.id)) continue;
    const stats = persisted.progress.builderStats?.[pack.id];
    if (!stats) continue;
    packages.push({
      id: pack.id,
      title: pack.displayName || pack.id,
      subject: getBuilderPackSubject(pack),
      curriculum: getDatasetCurriculum(pack),
      totalItems: pack.itemCount || pack.cardCount || 0,
      type: "sentenceBuilder",
    });
    packItems[pack.id] = [];
  }

  packages.sort((a, b) => a.title.localeCompare(b.title));
  return { packages, packItems, itemsById };
}

function renderSummaryCards(summary) {
  const cards = [
    ["Total items", summary.totalItems],
    ["Attempted items", summary.attemptedItems],
    ["Mastered items", summary.masteredItems],
    ["Struggling items", summary.strugglingItems],
    ["5-day answers", summary.recentQuestions],
    ["Average accuracy", formatPercent(summary.averageAccuracy)],
    ["Study streak", `${summary.studyStreakDays} day${summary.studyStreakDays === 1 ? "" : "s"}`],
  ];
  return `
    <div class="progress-summary-grid">
      ${cards.map(([label, value]) => `
        <div class="progress-stat-card">
          <strong>${escapeHtml(String(value))}</strong>
          <span>${escapeHtml(label)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function renderProgressBar(value) {
  const percent = Math.round(Math.max(0, Math.min(1, value || 0)) * 100);
  return `
    <div class="admin-progress-bar" aria-label="${percent}% progress">
      <span style="width:${percent}%"></span>
    </div>
  `;
}

function renderPackageProgress(packageRows) {
  if (!packageRows.length) {
    return `<p class="muted tiny">No packages are available yet.</p>`;
  }
  return `
    <div class="data-table-wrap progress-table-wrap">
      <table class="data-table-block progress-table">
        <thead>
          <tr>
            <th>Package</th>
            <th>Total</th>
            <th>Attempted</th>
            <th>Learning state</th>
            <th>Accuracy</th>
            <th>Last practised</th>
            <th>Progress</th>
          </tr>
        </thead>
        <tbody>
          ${packageRows.map((pack) => `
            <tr>
              <td>
                <strong>${escapeHtml(pack.title)}</strong>
                <div class="muted tiny">${escapeHtml(humanizeLabel(pack.subject))} · ${escapeHtml(CURRICULUM_LABELS[pack.curriculum] || humanizeLabel(pack.curriculum))}</div>
              </td>
              <td>${pack.totalItems}</td>
              <td>${pack.attemptedItems}</td>
              <td>
                <div class="chip-row progress-chip-row">
                  <span class="badge blue">Learning ${Math.max(0, pack.attemptedItems - pack.masteredItems - pack.strugglingItems)}</span>
                  <span class="badge amber">Reviewing ${Math.max(0, pack.attemptedItems - pack.masteredItems)}</span>
                  <span class="badge green">Mastered ${pack.masteredItems}</span>
                  <span class="badge coral">Struggling ${pack.strugglingItems}</span>
                </div>
              </td>
              <td>${pack.totalAttempts ? formatPercent(pack.averageAccuracy) : "—"}</td>
              <td>${escapeHtml(pack.lastPractisedLabel)}</td>
              <td>
                ${renderProgressBar(pack.progressPercentage)}
                <span class="muted tiny">${formatPercent(pack.progressPercentage)}</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecentActivity(activityRows) {
  const hasActivity = activityRows.some((row) => row.questionsAttempted > 0);
  if (!hasActivity) {
    return `<p class="muted tiny">No recent practice yet. Start a quiz to build your learning history.</p>`;
  }
  return `
    <div class="recent-activity-grid">
      ${activityRows.map((row) => `
        <div class="activity-day-card">
          <div class="activity-day-header">
            <strong>${escapeHtml(new Date(`${row.dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }))}</strong>
            <span class="badge ${row.averageAccuracy >= 0.75 ? "green" : row.averageAccuracy >= 0.5 ? "amber" : row.questionsAttempted ? "coral" : ""}">${row.questionsAttempted ? formatPercent(row.averageAccuracy) : "No practice"}</span>
          </div>
          <div class="activity-day-stats">
            <span>${row.quizSessions} sessions</span>
            <span>${row.questionsAttempted} answered</span>
            <span>${row.correct} right</span>
            <span>${row.wrong} wrong</span>
          </div>
          <p class="muted tiny">${row.packs.length ? escapeHtml(row.packs.slice(0, 3).join(", ")) : "No packs played"}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderStruggledItems(items) {
  if (!items.length) {
    return `<p class="muted tiny" style="margin-top:8px;">No struggled items yet. Once you answer a few questions, the trickiest ones will appear here.</p>`;
  }
  return `
    <div class="data-table-wrap progress-table-wrap">
      <table class="data-table-block progress-table">
        <thead>
          <tr>
            <th>Word / Question</th>
            <th>Answer / Translation</th>
            <th>Pack</th>
            <th>Right</th>
            <th>Wrong</th>
            <th>Accuracy</th>
            <th>Streak</th>
            <th>Mastered</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => {
            const tone = progressTone(item.state);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(item.questionText)}</strong>
                  <div class="muted tiny">ID: ${escapeHtml(item.id)}</div>
                </td>
                <td>${escapeHtml(item.expectedAnswer || "—")}</td>
                <td>${escapeHtml(item.packTitle)}</td>
                <td>${item.correct}</td>
                <td>${item.wrong}</td>
                <td>${formatPercent(item.accuracy)}</td>
                <td>${item.streak}</td>
                <td><span class="badge ${tone}">${escapeHtml(item.state)}</span></td>
                <td>
                  <button class="button ghost button-danger button-sm" data-action="admin-reset-word" data-word-id="${escapeHtml(item.id)}" title="Reset progress for this item">Reset</button>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecommendations(recommendations) {
  if (!recommendations.length) {
    return `<p class="muted tiny">No recommendations yet. Try a quiz and this area will suggest what to revisit next.</p>`;
  }
  return `
    <div class="recommendation-list">
      ${recommendations.map((item) => `
        <div class="recommendation-card">
          <span class="badge ${item.tone}">${escapeHtml(humanizeLabel(item.type))}</span>
          <div>
            <strong>${escapeHtml(item.title)}</strong>
            <p class="muted tiny">${escapeHtml(item.body)}</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

async function renderAdminTab() {
  const progressCatalog = await buildProgressCatalog();
  const summary = getDashboardSummary(persisted, progressCatalog, 5);
  const packageRows = getPackageProgress(persisted, progressCatalog)
    .filter((pack) => pack.totalItems > 0 || pack.totalAttempts > 0)
    .sort((a, b) => b.strugglingItems - a.strugglingItems || b.attemptedItems - a.attemptedItems || a.title.localeCompare(b.title));
  const recentActivity = getRecentActivity(persisted, 5);
  const struggledItems = getStruggledItems(persisted, 20, progressCatalog);
  const recommendations = getRecommendedPractice(persisted, progressCatalog, 6);
  const wordProgressCount = Object.keys(persisted.progress.words || {}).length;
  const attemptEventCount = persisted.progress.attemptEvents?.length || 0;
  const sessionActivityCount = persisted.progress.sessions.length + attemptEventCount;

  return `
    <div class="section-stack">
      <section class="section-card">
        <h2>Progress Management</h2>
        <p class="muted tiny">Clear stored quiz history or reset word mastery. This affects only this browser — nothing is sent anywhere.</p>
        ${renderSummaryCards(summary)}
        <div class="action-row" style="margin-top:14px;flex-wrap:wrap;gap:10px;">
          <button class="button secondary" data-action="admin-export-progress">
            Export Progress JSON
          </button>
          <button class="button secondary" data-action="admin-import-progress">
            Import Progress JSON
          </button>
          <input id="admin-progress-import" type="file" accept=".json,application/json" style="display:none;" />
          <button class="button secondary" data-action="admin-clear-sessions" ${sessionActivityCount === 0 ? "disabled" : ""}>
            Clear All Sessions (${persisted.progress.sessions.length} sessions, ${attemptEventCount} events)
          </button>
          <button class="button secondary" data-action="admin-clear-words" ${wordProgressCount === 0 ? "disabled" : ""}>
            Reset All Word Progress (${wordProgressCount} items)
          </button>
        </div>
      </section>

      <section class="section-card">
        <h2>Recommended Practice</h2>
        ${renderRecommendations(recommendations)}
      </section>

      <section class="section-card">
        <h2>Recent Learning Activity</h2>
        ${renderRecentActivity(recentActivity)}
      </section>

      <section class="section-card">
        <h2>Package Progress</h2>
        ${renderPackageProgress(packageRows)}
      </section>

      <section class="section-card">
        <h3 style="margin-top:20px;font-size:0.95rem;">Most struggled words (top 20)</h3>
        ${renderStruggledItems(struggledItems)}
      </section>
    </div>
  `;
}

function renderSelfUploadTab() {
  const packs = listUploadedPacks();
  const status = runtime.adminUploadStatus;

  // Compute rough storage used
  const totalBytes = packs.reduce((sum, p) => sum + (p.sizeBytes || 0), 0);

  let statusHtml = "";
  if (status) {
    if (status.files) {
      // ZIP batch result
      const successCount = status.files.filter((f) => f.ok).length;
      const failCount    = status.files.length - successCount;
      const cls = failCount === 0 ? "admin-status-ok"
                : successCount === 0 ? "admin-status-error"
                : "admin-status-warn";
      const icon = failCount === 0 ? "✓" : successCount === 0 ? "✗" : "!";
      const summary = failCount === 0
        ? `All ${successCount} packs loaded from ZIP`
        : `${successCount} of ${status.files.length} packs loaded (${failCount} failed)`;

      const fileRows = status.files.map((f) => {
        const warnLine = f.warnings?.length
          ? `<div class="tiny" style="color:var(--amber);margin-top:2px;">⚠ ${escapeHtml(f.warnings[0])}${f.warnings.length > 1 ? ` (+${f.warnings.length - 1} more)` : ""}</div>`
          : "";
        const errLine = !f.ok
          ? `<div class="tiny muted" style="margin-top:2px;">${escapeHtml(f.message)}</div>`
          : "";
        return `
          <div style="display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-top:1px solid rgba(0,0,0,0.06);">
            <span style="flex-shrink:0;font-weight:700;color:${f.ok ? "var(--green)" : "var(--coral)"};">${f.ok ? "✓" : "✗"}</span>
            <div>
              <div class="tiny">${escapeHtml(f.filename)}</div>
              ${errLine}${warnLine}
            </div>
          </div>`;
      }).join("");

      statusHtml = `
        <div class="admin-status ${cls}">
          <span class="admin-status-icon" aria-hidden="true">${icon}</span>
          <div style="flex:1;min-width:0;">
            <strong>${escapeHtml(summary)}</strong>
            <details style="margin-top:8px;">
              <summary class="tiny" style="cursor:pointer;user-select:none;">Show details</summary>
              <div style="margin-top:6px;">${fileRows}</div>
            </details>
          </div>
        </div>`;
    } else {
      // Single file result
      const warningsHtml = status.warnings?.length
        ? `<details style="margin-top:6px;">
            <summary class="tiny" style="cursor:pointer;user-select:none;color:var(--amber);">
              ⚠ ${status.warnings.length} schema warning${status.warnings.length > 1 ? "s" : ""}
            </summary>
            <ul style="margin:4px 0 0;padding-left:16px;">
              ${status.warnings.map((w) => `<li class="tiny muted">${escapeHtml(w)}</li>`).join("")}
            </ul>
          </details>`
        : "";
      statusHtml = `
        <div class="admin-status ${status.ok ? "admin-status-ok" : "admin-status-error"}">
          <span class="admin-status-icon" aria-hidden="true">${status.ok ? "✓" : "✗"}</span>
          <div>
            <strong>${status.ok ? "Pack uploaded successfully" : "Upload failed"}</strong>
            <p class="tiny">${escapeHtml(status.message)}</p>
            ${warningsHtml}
          </div>
        </div>`;
    }
  }

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

  return `
    <div class="section-stack">
      <section class="section-card">
        <h2>Pack Admin</h2>
        <p class="muted tiny">
          Upload a unified pack JSON file to add it directly to the app — no server required.
          The pack will appear in all compatible game modes (Quiz, Vocab, Reading, Builder)
          immediately and will persist across page reloads via browser storage.
        </p>

        <div class="admin-drop-zone" id="admin-drop-zone">
          <div class="admin-drop-icon" aria-hidden="true">📂</div>
          <p class="admin-drop-label">Drop a <strong>pack JSON</strong> or <strong>ZIP of packs</strong> here, or click to browse</p>
          <p class="muted tiny">Accepts <code>.json</code> or <code>.zip</code> — validated against JSON schema on upload</p>
          <input
            type="file"
            id="admin-file-upload"
            accept=".json,.zip,application/json,application/zip"
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

  if (file.name.toLowerCase().endsWith(".zip")) {
    await handleAdminZipUpload(file);
    return;
  }

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

  // Structural gate — must have items with known types
  const validation = validatePack(parsed);
  if (!validation.ok) {
    runtime.adminUploadStatus = { ok: false, message: validation.error };
    await renderApp();
    return;
  }

  // Schema validation — non-blocking, surfaces as warnings
  const schemaResult = validatePackSchema(parsed);
  const warnings = schemaResult.ok ? [] : schemaResult.errors;

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
    warnings,
    entry,
  };

  await renderApp();
}

// ─── Admin ZIP upload handler ─────────────────────────────────────────────────

async function handleAdminZipUpload(file) {
  let buffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    runtime.adminUploadStatus = { ok: false, message: "Could not read ZIP file." };
    await renderApp();
    return;
  }

  const files = await new Promise((resolve) => {
    unzip(new Uint8Array(buffer), (err, unzipped) => {
      if (err) { resolve(null); return; }
      resolve(unzipped);
    });
  });

  if (!files) {
    runtime.adminUploadStatus = { ok: false, message: "Could not extract ZIP file." };
    await renderApp();
    return;
  }

  const jsonEntries = Object.entries(files).filter(([path]) =>
    !path.endsWith("/") &&
    !path.startsWith("__MACOSX/") &&
    path.toLowerCase().endsWith(".json"),
  );

  if (jsonEntries.length === 0) {
    runtime.adminUploadStatus = { ok: false, message: "ZIP contains no .json files." };
    await renderApp();
    return;
  }

  let anySuccess = false;
  const fileResults = [];

  // Parse all JSON files first, then merge files that share the same packId
  // before saving. Without merging, the second file would silently overwrite
  // the first (same localStorage key), losing e.g. the revision pack when a
  // ZIP contains both pack_unified.json and passages.json with identical packIds.
  const parsedFiles = [];
  for (const [path, data] of jsonEntries) {
    const filename = path.split("/").pop();
    let parsed;
    try {
      parsed = JSON.parse(new TextDecoder().decode(data));
    } catch (e) {
      fileResults.push({ filename, ok: false, message: `Invalid JSON: ${e.message}`, warnings: [] });
      continue;
    }
    parsedFiles.push({ filename, parsed });
  }

  // Group by packId and merge items arrays for duplicates.
  const mergedById = new Map();
  for (const { filename, parsed } of parsedFiles) {
    const id = (parsed.packId || parsed.id || filename.replace(/\.json$/i, "").replace(/[^a-zA-Z0-9_-]/g, "_")).trim();
    if (mergedById.has(id)) {
      const existing = mergedById.get(id);
      existing.parsed.items = [...(existing.parsed.items || []), ...(parsed.items || [])];
      existing.filenames.push(filename);
    } else {
      mergedById.set(id, { parsed, filenames: [filename] });
    }
  }

  for (const { parsed, filenames } of mergedById.values()) {
    const filename = filenames.join(" + ");
    const validation = validatePack(parsed);
    if (!validation.ok) {
      fileResults.push({ filename, ok: false, message: validation.error, warnings: [] });
      continue;
    }

    const schemaResult = validatePackSchema(parsed);
    const warnings = schemaResult.ok ? [] : schemaResult.errors;

    const result = saveUploadedPack(parsed, filenames[0]);
    if (!result.ok) {
      fileResults.push({ filename, ok: false, message: result.error, warnings });
      continue;
    }

    anySuccess = true;
    const { entry } = result;
    const typesSummary = Object.entries(entry.typeCounts || {})
      .filter(([t]) => ITEM_TYPE_LABELS[t])
      .map(([t, n]) => `${n} ${ITEM_TYPE_LABELS[t]}`)
      .join(", ");
    fileResults.push({ filename, ok: true, message: typesSummary, warnings });
  }

  if (anySuccess) {
    hydrateManifest(runtime.manifest, registerPackInCache);
    ensurePreferenceDefaults();
  }

  runtime.adminUploadStatus = {
    ok: anySuccess,
    message: "",
    files: fileResults,
  };

  await renderApp();
}

async function handleClick(event) {
  const tabButton = event.target.closest("[data-tab]");
  if (tabButton) {
    stopSpeaking();
    const newTab = tabButton.dataset.tab;
    const currentTab = persisted.activeTab;

    // Clicking the already-active tab: confirm before resetting to setup view
    if (newTab === currentTab && newTab !== "home") {
      const tabLabel = TABS.find((t) => t.id === newTab)?.title || newTab;
      const hasActiveSession =
        (newTab === "quiz"    && runtime.currentQuiz && !runtime.currentQuiz.completed) ||
        (newTab === "reading" && runtime.passages    && !runtime.passages.completed) ||
        (newTab === "crossword" && runtime.crossword) ||
        (newTab === "progressive" && runtime.progressiveLesson && runtime.progressiveLesson.phase !== "review");
      const message = hasActiveSession
        ? `Abandon the current session and return to ${tabLabel} setup?`
        : `Return to the ${tabLabel} main screen?`;
      if (!window.confirm(message)) return;
      // Reset any in-progress state for that tab
      if (newTab === "quiz")    runtime.currentQuiz = null;
      if (newTab === "reading") runtime.passages    = null;
      if (newTab === "crossword") runtime.crossword = null;
      if (newTab === "progressive") runtime.progressiveLesson = null;
    }

    persisted.activeTab = newTab;
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
    case "admin-export-progress": {
      const backup = exportProgress(persisted);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `learning-web-progress-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }
    case "admin-import-progress": {
      document.getElementById("admin-progress-import")?.click();
      return;
    }
    case "admin-clear-sessions": {
      const eventCount = persisted.progress.attemptEvents?.length || 0;
      if (!window.confirm(`Delete all ${persisted.progress.sessions.length} quiz sessions and ${eventCount} learning event(s)? Word mastery counts will stay in place.`)) return;
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
    // ── Study Book ──────────────────────────────────────────────────────────
    case "open-study-book": {
      const datasetId = actionButton.dataset.datasetId;
      const anchor    = actionButton.dataset.sbAnchor  || null;
      const mdPath    = actionButton.dataset.sbPath    || null;
      await openStudyBook(datasetId, { anchor, mdPath });
      return;
    }
    // ── End Study Book ──────────────────────────────────────────────────────
    case "open-review":
      persisted.activeTab = "review";
      saveStoredState(persisted);
      await renderApp();
      return;
    case "progressive-replay":
    case "progressive-jump-phase":
    case "progressive-listen-back":
    case "progressive-listen-next":
    case "progressive-toggle-listen-grammar":
    case "progressive-vocab-answer":
    case "progressive-vocab-back":
    case "progressive-vocab-next":
    case "progressive-builder-pick":
    case "progressive-builder-remove":
    case "progressive-builder-reset":
    case "progressive-toggle-builder-hint":
    case "progressive-toggle-grammar-labels":
    case "progressive-builder-check":
    case "progressive-builder-back":
    case "progressive-builder-next":
    case "progressive-restart":
    case "progressive-change-language": {
      if (!runtime.progressiveLessonCatalog) {
        runtime.progressiveLessonCatalog = await loadProgressiveLessonCatalog();
      }
      if (!runtime.progressiveLesson) {
        runtime.progressiveLesson = createProgressiveLessonState();
      }
      runtime.progressiveLesson = ensureProgressiveLessonStateForCatalog(runtime.progressiveLesson, runtime.progressiveLessonCatalog);
      const activePackPath = runtime.progressiveLesson.packPath;
      runtime.progressiveLessonPack = await loadProgressiveLessonPack(activePackPath);
      const result = runProgressiveLessonAction(runtime.progressiveLesson, runtime.progressiveLessonPack, action, actionButton.dataset);
      if (result && result.phase) {
        runtime.progressiveLesson = result;
      } else if (result && result.speak) {
        speakProgressiveText(result.speak.text, result.speak.lang);
      }
      await renderApp();
      return;
    }
    case "start-quiz":
      await startQuiz();
      return;
    case "start-crossword":
      await startCrosswordGame();
      return;
    case "crossword-check":
      checkCrosswordAnswers();
      await renderApp();
      return;
    case "crossword-reveal":
      revealCrosswordAnswers();
      await renderApp();
      return;
    case "crossword-new":
      await startCrosswordGame();
      return;
    case "crossword-options":
      runtime.crossword = null;
      await renderApp();
      return;
    case "select-subject": {
      // Switch to a new subject — keep curriculum filter, pick first matching dataset.
      const nextSubject = actionButton.dataset.value;
      if (nextSubject === MY_PACKS_SUBJECT) {
        const uploaded = listUploadedRevisionPacks();
        if (!uploaded.length) return;
        persisted.prefs.quiz.subject = MY_PACKS_SUBJECT;
        persisted.prefs.quiz.datasetId = uploaded[0].id;
        applyDatasetDefaults("quiz", { resetStages: true, resetQuizModes: true });
        saveStoredState(persisted);
        await renderApp();
        return;
      }
      const curriculum = persisted.prefs.quiz.curriculum || "all";
      const datasets = listDatasetsBySubjectAndCurriculum(runtime.manifest, nextSubject, curriculum);
      // If no datasets match the current curriculum, fall back to "all"
      const fallbackDatasets = datasets.length ? datasets : listDatasetsBySubject(runtime.manifest, nextSubject);
      if (!fallbackDatasets.length) return;
      if (!datasets.length) persisted.prefs.quiz.curriculum = "all";
      persisted.prefs.quiz.subject = nextSubject;
      persisted.prefs.quiz.datasetId = fallbackDatasets[0].id;
      applyDatasetDefaults("quiz", { resetStages: true, resetQuizModes: true });
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-crossword-subject": {
      const nextSubject = actionButton.dataset.value;
      if (nextSubject === MY_PACKS_SUBJECT) {
        const uploaded = listUploadedRevisionPacks();
        if (!uploaded.length) return;
        persisted.prefs.crossword.subject = MY_PACKS_SUBJECT;
        persisted.prefs.crossword.datasetId = uploaded[0].id;
        runtime.crossword = null;
        runtime.crosswordError = "";
        applyDatasetDefaults("crossword", { resetStages: true });
        saveStoredState(persisted);
        await renderApp();
        return;
      }
      const curriculum = persisted.prefs.crossword.curriculum || "all";
      const datasets = listCrosswordDatasetsBySubjectAndCurriculum(nextSubject, curriculum);
      const fallbackDatasets = datasets.length ? datasets : listCrosswordDatasetsBySubject(nextSubject);
      if (!fallbackDatasets.length) return;
      if (!datasets.length) persisted.prefs.crossword.curriculum = "all";
      persisted.prefs.crossword.subject = nextSubject;
      persisted.prefs.crossword.datasetId = fallbackDatasets[0].id;
      runtime.crossword = null;
      runtime.crosswordError = "";
      applyDatasetDefaults("crossword", { resetStages: true });
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-crossword-curriculum": {
      const nextCurriculum = actionButton.dataset.value;
      persisted.prefs.crossword.curriculum = nextCurriculum;
      const subject = persisted.prefs.crossword.subject || "language";
      const filtered = listCrosswordDatasetsBySubjectAndCurriculum(subject, nextCurriculum);
      if (filtered.length) persisted.prefs.crossword.datasetId = filtered[0].id;
      runtime.crossword = null;
      runtime.crosswordError = "";
      applyDatasetDefaults("crossword", { resetStages: true });
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-curriculum": {
      // Filter pack dropdown by curriculum level; auto-pick first matching dataset.
      const nextCurriculum = actionButton.dataset.value;
      persisted.prefs.quiz.curriculum = nextCurriculum;
      const subject = persisted.prefs.quiz.subject || "language";
      const filtered = listDatasetsBySubjectAndCurriculum(runtime.manifest, subject, nextCurriculum);
      if (filtered.length) persisted.prefs.quiz.datasetId = filtered[0].id;
      applyDatasetDefaults("quiz", { resetStages: true, resetQuizModes: true });
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-passage-subject": {
      const nextSubject = actionButton.dataset.value;
      if (nextSubject === MY_PACKS_SUBJECT) {
        const uploaded = listUploadedPassageGroups();
        if (!uploaded.length) return;
        persisted.prefs.passages.subject = MY_PACKS_SUBJECT;
        persisted.prefs.passages.groupId = uploaded[0].id;
        const firstPacks = listPassagePacks(runtime.manifest, uploaded[0].id);
        persisted.prefs.passages.packId = firstPacks[0] ? firstPacks[0].id : "";
        persisted.prefs.passages.category = "all";
        persisted.prefs.passages.difficulty = "all";
        runtime.passages = null;
        saveStoredState(persisted);
        await renderApp();
        return;
      }
      const curriculum = persisted.prefs.passages.curriculum || "all";
      const groupsForSubject = listPassageGroupsBySubjectAndCurriculum(runtime.manifest, nextSubject, curriculum);
      const fallbackGroups = groupsForSubject.length ? groupsForSubject : listPassageGroupsBySubject(runtime.manifest, nextSubject);
      if (!fallbackGroups.length) return;
      if (!groupsForSubject.length) persisted.prefs.passages.curriculum = "all";
      persisted.prefs.passages.subject = nextSubject;
      persisted.prefs.passages.groupId = fallbackGroups[0].id;
      const firstPacks = listPassagePacks(runtime.manifest, fallbackGroups[0].id);
      persisted.prefs.passages.packId = firstPacks[0] ? firstPacks[0].id : "";
      persisted.prefs.passages.category = "all";
      persisted.prefs.passages.difficulty = "all";
      runtime.passages = null;
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-passage-curriculum": {
      const nextCurriculum = actionButton.dataset.value;
      persisted.prefs.passages.curriculum = nextCurriculum;
      const subject = persisted.prefs.passages.subject || "";
      if (subject) {
        const groups = listPassageGroupsBySubjectAndCurriculum(runtime.manifest, subject, nextCurriculum);
        if (groups.length) {
          persisted.prefs.passages.groupId = groups[0].id;
          const packs = listPassagePacks(runtime.manifest, groups[0].id);
          persisted.prefs.passages.packId = packs[0] ? packs[0].id : "";
        }
      }
      runtime.passages = null;
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-vocab-subject": {
      const nextSubject = actionButton.dataset.value;
      if (nextSubject === MY_PACKS_SUBJECT) {
        const uploaded = listUploadedRevisionPacks();
        if (!uploaded.length) return;
        persisted.prefs.vocab.subject = MY_PACKS_SUBJECT;
        persisted.prefs.vocab.datasetId = uploaded[0].id;
        persisted.prefs.vocab.search = "";
        persisted.prefs.vocab.partOfSpeech = "";
        persisted.prefs.vocab.category = "";
        persisted.prefs.vocab.categories = [];
        saveStoredState(persisted);
        await renderApp();
        return;
      }
      const curriculum = persisted.prefs.vocab.curriculum || "all";
      const datasets = listDatasetsBySubjectAndCurriculum(runtime.manifest, nextSubject, curriculum);
      const fallbackDatasets = datasets.length ? datasets : listDatasetsBySubject(runtime.manifest, nextSubject);
      if (!fallbackDatasets.length) return;
      if (!datasets.length) persisted.prefs.vocab.curriculum = "all";
      persisted.prefs.vocab.subject = nextSubject;
      persisted.prefs.vocab.datasetId = fallbackDatasets[0].id;
      persisted.prefs.vocab.search = "";
      persisted.prefs.vocab.partOfSpeech = "";
      persisted.prefs.vocab.category = "";
      persisted.prefs.vocab.categories = [];
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-vocab-curriculum": {
      const nextCurriculum = actionButton.dataset.value;
      persisted.prefs.vocab.curriculum = nextCurriculum;
      const subject = persisted.prefs.vocab.subject || "language";
      const filtered = listDatasetsBySubjectAndCurriculum(runtime.manifest, subject, nextCurriculum);
      if (filtered.length) persisted.prefs.vocab.datasetId = filtered[0].id;
      persisted.prefs.vocab.search = "";
      persisted.prefs.vocab.partOfSpeech = "";
      persisted.prefs.vocab.category = "";
      persisted.prefs.vocab.categories = [];
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-builder-subject": {
      const nextSubject = actionButton.dataset.value;
      if (nextSubject === MY_PACKS_SUBJECT) {
        const uploaded = listUploadedBuilderPacks();
        if (!uploaded.length) return;
        persisted.prefs.builder.subject = MY_PACKS_SUBJECT;
        persisted.prefs.builder.packId = uploaded[0].id;
        runtime.builder = null;
        saveStoredState(persisted);
        await renderApp();
        return;
      }
      const curriculum = persisted.prefs.builder.curriculum || "all";
      const packs = listSentenceBuilderPacksBySubjectAndCurriculum(runtime.manifest, nextSubject, curriculum);
      const fallbackPacks = packs.length ? packs : listSentenceBuilderPacksBySubject(runtime.manifest, nextSubject);
      if (!fallbackPacks.length) return;
      if (!packs.length) persisted.prefs.builder.curriculum = "all";
      persisted.prefs.builder.subject = nextSubject;
      persisted.prefs.builder.packId = fallbackPacks[0].id;
      runtime.builder = null;
      saveStoredState(persisted);
      await renderApp();
      return;
    }
    case "select-builder-curriculum": {
      const nextCurriculum = actionButton.dataset.value;
      persisted.prefs.builder.curriculum = nextCurriculum;
      const subject = persisted.prefs.builder.subject || "history";
      const filtered = listSentenceBuilderPacksBySubjectAndCurriculum(runtime.manifest, subject, nextCurriculum);
      if (filtered.length) persisted.prefs.builder.packId = filtered[0].id;
      runtime.builder = null;
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

    // ── Progressive Language actions ────────────────────────────────────────
    case "pl-jump-phase":
    case "pl-replay":
    case "pl-listen-back":
    case "pl-listen-next":
    case "pl-toggle-grammar":
    case "pl-toggle-grammar-labels":
    case "pl-vocab-answer":
    case "pl-vocab-next":
    case "pl-vocab-back":
    case "pl-builder-pick":
    case "pl-builder-remove":
    case "pl-builder-reset":
    case "pl-builder-check":
    case "pl-builder-next":
    case "pl-builder-back":
    case "pl-toggle-builder-grammar":
    case "pl-restart":
    case "pl-change-language": {
      const pl = runtime.progressiveLesson;
      if (!pl.state || !pl.pack) return;
      const { state: newState, effect } = runProgressiveLessonAction(
        pl.state,
        pl.pack,
        action,
        actionButton.dataset,
      );
      pl.state = newState;
      if (effect?.speak) {
        speakText(effect.speak.text, effect.speak.lang);
      }
      await renderApp();
      return;
    }
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

// ── Category checkbox helpers (language packs without stage selection, e.g. German) ──

function getSelectedCategories(prefSection, categoryOptions) {
  if (!categoryOptions.length) return [];
  const current = Array.isArray(prefSection.categories) ? prefSection.categories : [];
  const valid = current.filter((c) => categoryOptions.includes(c));
  return valid.length ? valid : [...categoryOptions]; // default: all selected
}

function updateCategorySelection(sectionKey, input) {
  const prefSection = persisted.prefs[sectionKey];
  const catValue = input.dataset.category;
  const allOptions = [...document.querySelectorAll(`input[name="${sectionKey}-category"]`)]
    .map((el) => el.dataset.category);
  const nextCategories = new Set(getSelectedCategories(prefSection, allOptions));
  if (input.checked) {
    nextCategories.add(catValue);
  } else if (nextCategories.size > 1) {
    nextCategories.delete(catValue);
  } else {
    input.checked = true; // prevent deselecting the last checkbox
  }
  prefSection.categories = allOptions.filter((c) => nextCategories.has(c));
}

async function handleChange(event) {
  // File upload is handled separately (async, does its own renderApp call).
  if (event.target.id === "admin-file-upload") {
    await handleAdminFileUpload(event.target.files && event.target.files[0]);
    return;
  }
  if (event.target.id === "admin-progress-import") {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      importProgress(persisted, text);
      saveStoredState(persisted);
      runtime.adminUploadStatus = {
        ok: true,
        message: `Imported progress backup from "${file.name}".`,
      };
    } catch (error) {
      runtime.adminUploadStatus = {
        ok: false,
        message: `Could not import progress: ${error.message}`,
      };
    }
    event.target.value = "";
    await renderApp();
    return;
  }

  // Quiz answer textareas fire a `change` event when the user clicks the
  // "Check answer" button (blur fires before click).  Letting that fall
  // through to renderApp() would wipe the textarea value before the click
  // handler reads it, causing the answer to be graded as an empty string.
  if (event.target.id === "quiz-typed-answer" || event.target.id === "quiz-gap-typed") return;

  const { id, value } = event.target;
  switch (id) {
    case "vocab-dataset": {
      persisted.prefs.vocab.datasetId = value;
      persisted.prefs.vocab.partOfSpeech = "";
      persisted.prefs.vocab.category = "";
      persisted.prefs.vocab.categories = [];
      // Keep subject in sync when user manually picks a dataset
      const vocabDataset = findDataset(runtime.manifest, value);
      persisted.prefs.vocab.subject = getDatasetSubject(vocabDataset);
      applyDatasetDefaults("vocab", { resetStages: true });
      break;
    }
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
    case "crossword-dataset": {
      persisted.prefs.crossword.datasetId = value;
      const newDataset = findDataset(runtime.manifest, value);
      persisted.prefs.crossword.subject = getDatasetSubject(newDataset);
      runtime.crossword = null;
      runtime.crosswordError = "";
      applyDatasetDefaults("crossword", { resetStages: true });
      break;
    }
    case "crossword-year":
      persisted.prefs.crossword.year = value;
      runtime.crossword = null;
      runtime.crosswordError = "";
      break;
    case "crossword-word-count":
      persisted.prefs.crossword.wordCount = Number(value);
      runtime.crossword = null;
      runtime.crosswordError = "";
      break;
    case "crossword-exclude-mastered":
      persisted.prefs.crossword.excludeMastered = value === "true";
      runtime.crossword = null;
      runtime.crosswordError = "";
      break;
    case "builder-pack": {
      persisted.prefs.builder.packId = value;
      // Keep subject in sync when user manually picks a builder pack
      const allBuilderPacks = listSentenceBuilderPacks(runtime.manifest);
      const chosenBuilderPack = allBuilderPacks.find((p) => p.id === value);
      if (chosenBuilderPack) persisted.prefs.builder.subject = getBuilderPackSubject(chosenBuilderPack);
      runtime.builder = null;
      break;
    }
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

    // ── Progressive Language selectors ──────────────────────────────────────
    case "pl-pack-select": {
      const pl = runtime.progressiveLesson;
      if (!pl.catalog) break;
      const newCatPack = pl.catalog.packs.find(p => p.id === value);
      if (!newCatPack) break;
      const newStage  = newCatPack.stages[0];
      const newLesson = newStage?.lessons[0];
      pl.state = {
        ...pl.state,
        catalogPackId:   value,
        catalogStageId:  newStage?.id  ?? "",
        catalogLessonId: newLesson?.id ?? "",
        packPath:        newLesson?.path ?? "",
      };
      if (newLesson?.path) {
        try {
          pl.pack = await loadProgressiveLessonPack(newLesson.path);
          pl.state.vocabOptions = buildVocabOptions(pl.pack, 0, pl.state.targetLang);
          pl.state.phase = "listen";
        } catch (e) { console.error(e); }
      }
      break;
    }
    case "pl-stage-select": {
      const pl = runtime.progressiveLesson;
      if (!pl.catalog) break;
      const catPack   = pl.catalog.packs.find(p => p.id === pl.state.catalogPackId);
      const newStage  = catPack?.stages.find(s => s.id === value);
      const newLesson = newStage?.lessons[0];
      pl.state = {
        ...pl.state,
        catalogStageId:  value,
        catalogLessonId: newLesson?.id ?? "",
        packPath:        newLesson?.path ?? "",
      };
      if (newLesson?.path) {
        try {
          pl.pack = await loadProgressiveLessonPack(newLesson.path);
          pl.state.vocabOptions = buildVocabOptions(pl.pack, 0, pl.state.targetLang);
          pl.state.phase = "listen";
        } catch (e) { console.error(e); }
      }
      break;
    }
    case "pl-lesson-select": {
      const pl = runtime.progressiveLesson;
      if (!pl.catalog) break;
      const catPack  = pl.catalog.packs.find(p => p.id === pl.state.catalogPackId);
      const catStage = catPack?.stages.find(s => s.id === pl.state.catalogStageId);
      const newLesson = catStage?.lessons.find(l => l.id === value);
      if (!newLesson) break;
      pl.state = { ...pl.state, catalogLessonId: value, packPath: newLesson.path };
      try {
        pl.pack = await loadProgressiveLessonPack(newLesson.path);
        pl.state.vocabOptions = buildVocabOptions(pl.pack, 0, pl.state.targetLang);
        pl.state.phase      = "listen";
        pl.state.chainIndex = 0;
        pl.state.stepIndex  = 0;
      } catch (e) { console.error(e); }
      break;
    }
    case "pl-language-select": {
      const pl = runtime.progressiveLesson;
      if (!pl.state) break;
      pl.state = {
        ...pl.state,
        targetLang:  value,
        phase:       "listen",
        chainIndex:  0,
        stepIndex:   0,
        showGrammar: false,
        vocabIndex:  0,
        vocabOptions: pl.pack ? buildVocabOptions(pl.pack, 0, value) : [],
        vocabFeedback: null,
        sentenceIndex: 0,
        selectedTiles: [],
        bankTiles:     [],
        builderFeedback: null,
        answered:    { vocab: {}, builder: {} },
        mistakes:    [],
        score:       { vocabCorrect: 0, vocabTotal: 0, builderCorrect: 0, builderTotal: 0 },
        spokenStepKey: "",
      };
      break;
    }
    case "passage-show-german":
      persisted.prefs.passages.showGerman = event.target.checked;
      break;
    case "passage-voice":
      persisted.prefs.passages.voiceEnabled = event.target.checked;
      break;
    case "passage-voice-select":
      persisted.prefs.passages.voiceName = event.target.value;
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
      } else if (event.target.name === "crossword-stage") {
        updateStageSelection("crossword", event.target);
        runtime.crossword = null;
        runtime.crosswordError = "";
      } else if (event.target.name === "vocab-category") {
        updateCategorySelection("vocab", event.target);
      }
      break;
  }
  saveStoredState(persisted);
  await renderApp();
  await syncStudyBookToCurrentDataset();
}

async function handleInput(event) {
  if (event.target.dataset.crosswordCell && runtime.crossword) {
    const letter = normalizeCrosswordAnswer(event.target.value).slice(0, 1);
    const key = event.target.dataset.crosswordCell;
    event.target.value = letter;
    runtime.crossword.letters[key] = letter;
    runtime.crossword.checked = false;
    runtime.crossword.revealed = false;
    runtime.crossword.message = null;
    const cell = event.target.closest(".crossword-cell");
    if (cell) cell.classList.remove("is-correct", "is-wrong");
    if (letter) {
      focusCrosswordCell(Number(event.target.dataset.row), Number(event.target.dataset.col) + 1);
    }
    return;
  }

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

function handleKeyDown(event) {
  // Escape closes the Study Book drawer if open
  if (event.key === "Escape" && runtime.studyBook.open) {
    runtime.studyBook.open = false;
    renderStudyBookDrawer();
    document.body.classList.remove("sb-split-mode");
    document.getElementById("app").style.marginRight = "";
    return;
  }
  if (!event.target.dataset.crosswordCell || !runtime.crossword) return;
  const row = Number(event.target.dataset.row);
  const col = Number(event.target.dataset.col);
  if (event.key === "ArrowRight") {
    event.preventDefault();
    focusCrosswordCell(row, col + 1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    focusCrosswordCell(row, col - 1);
  } else if (event.key === "ArrowDown") {
    event.preventDefault();
    focusCrosswordCell(row + 1, col);
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    focusCrosswordCell(row - 1, col);
  } else if (event.key === "Backspace" && !event.target.value) {
    event.preventDefault();
    focusCrosswordCell(row, col - 1);
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
    fillBlankCount: filterFillBlankByStage(unifiedPack, prefs, dataset).length,
    vocabCount: words.length,
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
  session.questionStartedAt = Date.now();
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

async function startCrosswordGame() {
  const prefs = persisted.prefs.crossword;
  const dataset = findDataset(runtime.manifest, prefs.datasetId);
  const allWords = await loadVocabItems(runtime.manifest, dataset.id);
  const scopedWords = filterWordsForScope(allWords, dataset, prefs);
  const unmasteredWords = scopedWords.filter((word) => !isWordMastered(persisted, word.id));
  const wordPool = prefs.excludeMastered && unmasteredWords.length >= Math.min(5, scopedWords.length)
    ? unmasteredWords
    : scopedWords;
  const entries = crosswordEntriesFromWords(wordPool);

  if (entries.length < 5) {
    runtime.crossword = null;
    runtime.crosswordError = "Not enough crossword-friendly vocabulary in this setup. Try another pack or include mastered words.";
    await renderApp();
    return;
  }

  const requestedCount = Math.min(Number(prefs.wordCount) || 10, entries.length);
  const game = generateCrossword(entries, { wordCount: requestedCount, attempts: 120 });
  if (!game.placedEntries.length) {
    runtime.crossword = null;
    runtime.crosswordError = "Could not place a crossword from this word set. Try a smaller word count or a different pack.";
    await renderApp();
    return;
  }

  runtime.crosswordError = "";
  runtime.crossword = {
    dataset,
    datasetId: dataset.id,
    poolSize: entries.length,
    game,
    letters: {},
    checked: false,
    revealed: false,
    message: {
      tone: game.placedEntries.length >= requestedCount ? "good" : "bad",
      text: `Placed ${game.placedEntries.length} of ${requestedCount} random words.`,
    },
  };
  persisted.activeTab = "crossword";
  saveStoredState(persisted);
  await renderApp();
}

function focusCrosswordCell(row, col) {
  const input = document.querySelector(`.crossword-input[data-row="${row}"][data-col="${col}"]`);
  if (input) input.focus({ preventScroll: true });
}

function checkCrosswordAnswers() {
  const state = runtime.crossword;
  if (!state || !state.game) return;
  let correct = 0;
  let total = 0;

  state.game.grid.forEach((row, rowIndex) => {
    row.forEach((answer, colIndex) => {
      if (!answer) return;
      total += 1;
      if ((state.letters[`${rowIndex}:${colIndex}`] || "").toUpperCase() === answer) {
        correct += 1;
      }
    });
  });

  state.checked = true;
  state.message = {
    tone: correct === total ? "good" : "bad",
    text: correct === total ? "All correct." : `${correct} of ${total} letters correct.`,
  };
}

function revealCrosswordAnswers() {
  const state = runtime.crossword;
  if (!state || !state.game) return;
  const letters = {};
  state.game.grid.forEach((row, rowIndex) => {
    row.forEach((answer, colIndex) => {
      if (answer) {
        letters[`${rowIndex}:${colIndex}`] = answer;
      }
    });
  });
  state.letters = letters;
  state.checked = true;
  state.revealed = true;
  state.message = { tone: "good", text: "Answers revealed." };
}

async function answerQuizQuestion(response, extra = null) {
  const session = runtime.currentQuiz;
  if (!session || session.awaitingNext) {
    return;
  }
  const question = session.questions[session.index];
  const result = gradeQuestion(question, response, extra);
  const progressItemId = question.wordId || question.sourceItemId || question.id;
  const timeSpentMs = Math.max(0, Date.now() - (session.questionStartedAt || Date.now()));
  session.awaitingNext = true;
  session.feedback = result;
  session.answers.push({
    questionId: question.id,
    prompt: question.prompt,
    expected: question.answer,
    userAnswer: response,
    correct: result.correct,
    itemId: progressItemId,
    wordId: question.wordId,
    speechText: question.speechText,
    speechLanguage: question.speechLanguage,
  });
  if (result.correct) {
    session.score += 1;
  }
  if (progressItemId) {
    recordWordAnswer(persisted, progressItemId, result.correct);
    const dataset = findDataset(runtime.manifest, session.config.datasetId);
    recordAttempt(persisted, makeAttemptEvent({
      sessionId: session.id,
      packId: session.config.datasetId,
      packTitle: dataset.displayName,
      itemId: progressItemId,
      questionText: question.prompt,
      expectedAnswer: result.expected || question.answer,
      selectedAnswer: response,
      correct: result.correct,
      modeId: question.modeId,
      kind: question.kind,
      timeSpentMs,
    }));
  }
  if (question.wordId) {
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
  session.questionStartedAt = Date.now();
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
          // by preparePassageForSession and the reading tab.
          // Keep in sync with passageFromItem() in data.js — same fallback logic.
          const d = item.data || {};
          return {
            id: item.id,
            topic: Array.isArray(item.topics) ? item.topics[0] || "" : "",
            level: item.level || "",
            sourceText: d.sourcePassage || item.sourcePassage || "",
            targetText: d.targetPassage || item.targetPassage || "",
            speech_language: d.speechLanguage || item.speechLanguage || unified.speechLanguage || unified.sourceLanguageCode || "en-GB",
            chapter: d.chapter || item.chapter || "",
            section: d.section || item.section || "",
            sourceTitle: d.sourceTitle || d.title || item.sourceTitle || item.title || "",
            targetTitle: d.targetTitle || d.title || item.targetTitle || item.title || "",
            questions: (d.questions || item.questions || []).map((q) => ({
              id: q.id,
              // Accept both questionType (canonical) and type (AI-generated shorthand)
              type: q.questionType || q.type || (q.options?.length ? "multiple_choice" : "open"),
              question: q.question || "",
              difficulty: q.difficulty || "medium",
              options: q.options || [],
              // Accept both correctOptionIndex (canonical) and answer (AI-generated shorthand)
              correct_option_index: q.correctOptionIndex ?? q.answer,
              correct_answer: q.correctAnswer || "",
              model_answer_en: q.modelAnswer || "",
              accepted_keywords: q.acceptedKeywords || [],
              grammar_focus: q.grammarFocus || null,
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
  speakText(
    current.sourceText,
    fallback(current.speech_language, "en-GB"),
    persisted.prefs.passages.voiceName || "",
  );
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
