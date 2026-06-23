const BASE_URL = "https://www.foxchildidea.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og/default.png`;
const SPEAK_LAB_OG_IMAGE = `${BASE_URL}/og/speak-lab.png`;
const DEFAULT_PROVIDER = {
  "@type": "Organization",
  "name": "FoxChild Idea",
  "url": `${BASE_URL}/`,
};
const DEFAULT_AUDIENCE = {
  "@type": "EducationalAudience",
  "educationalRole": "student",
};
const DEFAULT_APP_LANGUAGES = ["en-GB"];

export const APP_MODULES = [
  {
    id: "home",
    label: "Home",
    path: "/",
    title: "FoxChild@Learn | AI Revision Packs for KS3 and GCSE",
    description: "Create, practise and review AI-ready study packs with quizzes, reading, speaking, games, vocabulary and progress tracking for KS3 and GCSE learners.",
    ogTitle: "FoxChild@Learn | AI-ready revision packs and practice tools",
    ogDescription: "A local-first learning web app for study packs, quizzes, reading, speaking practice, games and progress tracking.",
    keywords: [
      "FoxChild Learn",
      "AI revision packs",
      "KS3 revision",
      "GCSE revision",
      "learning web app",
      "study pack creator",
      "student progress tracking",
    ],
    learningResourceType: "Educational web application",
    educationalUse: ["Revision", "Practice", "Self assessment"],
    teaches: ["Vocabulary recall", "Reading comprehension", "Language learning", "Exam revision"],
    priority: "1.0",
  },
  {
    id: "language",
    label: "Language Ladder",
    path: "/language-ladder",
    title: "Language Ladder | Guided Language Lessons | FoxChild@Learn",
    description: "Build vocabulary, listening and sentence confidence with step-by-step language lessons for German, Latin and multilingual practice.",
    ogTitle: "Language Ladder | Step-by-step language learning",
    ogDescription: "Practise language lessons with listening, vocabulary, sentence building and guided review in FoxChild@Learn.",
    keywords: [
      "Language Ladder",
      "language learning",
      "German vocabulary",
      "Latin vocabulary",
      "listening practice",
      "sentence practice",
      "guided language lessons",
    ],
    learningResourceType: "Language learning activity",
    educationalUse: ["Practice", "Language learning", "Vocabulary building"],
    teaches: ["Vocabulary", "Listening", "Sentence patterns", "Language confidence"],
    inLanguage: ["en-GB", "de-DE", "la"],
    priority: "0.8",
  },
  {
    id: "quiz",
    label: "Quiz",
    path: "/quiz",
    title: "Quiz Practice | KS3 and GCSE Revision Questions | FoxChild@Learn",
    description: "Practise multiple choice, typed and sentence-build quiz questions from language, geography, history, science and study packs.",
    ogTitle: "Quiz Practice | Turn study packs into revision questions",
    ogDescription: "Use FoxChild@Learn quizzes to practise vocabulary, definitions, grammar, pack questions and topic recall.",
    keywords: [
      "quiz practice",
      "revision questions",
      "KS3 quiz",
      "GCSE quiz",
      "vocabulary quiz",
      "study pack quiz",
      "multiple choice revision",
    ],
    learningResourceType: "Quiz",
    educationalUse: ["Assessment", "Practice", "Revision"],
    teaches: ["Vocabulary recall", "Topic knowledge", "Grammar practice", "Exam confidence"],
    priority: "0.8",
  },
  {
    id: "smart-test",
    label: "Smart Test",
    path: "/smart-test",
    title: "Smart Test | Adaptive Revision Checks | FoxChild@Learn",
    description: "Use adaptive study checks to find weak areas, retry missed knowledge and focus revision time on what needs practice.",
    ogTitle: "Smart Test | Adaptive checks for targeted revision",
    ogDescription: "Smart Test helps learners focus on weaker knowledge using adaptive questions and review signals.",
    keywords: [
      "smart test",
      "adaptive revision",
      "targeted practice",
      "weak area review",
      "revision check",
      "personalised learning",
    ],
    learningResourceType: "Adaptive assessment",
    educationalUse: ["Assessment", "Personalised practice", "Revision"],
    teaches: ["Knowledge gaps", "Recall accuracy", "Revision planning"],
    priority: "0.8",
  },
  {
    id: "arcade",
    label: "Arcade",
    path: "/arcade",
    title: "Learning Arcade | Revision Games | FoxChild@Learn",
    description: "Play quick learning games built from vocabulary, quiz and sentence builder packs, including Quiz Hunt and Snake Builder practice.",
    ogTitle: "Learning Arcade | Game-based revision practice",
    ogDescription: "Turn study content into fast revision games for vocabulary, quiz questions and sentence building.",
    keywords: [
      "learning games",
      "revision games",
      "Quiz Hunt",
      "Snake Builder",
      "vocabulary games",
      "sentence builder game",
      "educational arcade",
    ],
    learningResourceType: "Educational game",
    educationalUse: ["Practice", "Game-based learning", "Revision"],
    teaches: ["Fast recall", "Vocabulary", "Sentence order", "Topic knowledge"],
    priority: "0.7",
  },
  {
    id: "vocab",
    label: "Vocabulary",
    path: "/vocabulary",
    title: "Vocabulary Practice | Flashcards and Definitions | FoxChild@Learn",
    description: "Browse, filter and practise vocabulary cards with definitions, examples, topics and language pack words for revision.",
    ogTitle: "Vocabulary Practice | Flashcards, definitions and examples",
    ogDescription: "Use pack-based vocabulary cards to revise key terms, meanings, examples, topics and languages.",
    keywords: [
      "vocabulary practice",
      "flashcards",
      "definitions",
      "keyword revision",
      "German vocabulary",
      "Latin vocabulary",
      "topic vocabulary",
    ],
    learningResourceType: "Flashcard practice",
    educationalUse: ["Vocabulary building", "Revision", "Practice"],
    teaches: ["Definitions", "Key terms", "Examples", "Language vocabulary"],
    priority: "0.8",
  },
  {
    id: "reading",
    label: "Reading",
    path: "/reading",
    title: "Reading Practice | Comprehension Passages | FoxChild@Learn",
    description: "Read study and language passages, answer comprehension questions and practise understanding with pack-based reading activities.",
    ogTitle: "Reading Practice | Passages and comprehension questions",
    ogDescription: "Practise reading comprehension with passages, questions, topic filters and language reading packs.",
    keywords: [
      "reading practice",
      "comprehension passages",
      "reading questions",
      "language reading",
      "passage packs",
      "KS3 reading",
      "GCSE reading",
    ],
    learningResourceType: "Reading comprehension activity",
    educationalUse: ["Reading", "Comprehension", "Practice"],
    teaches: ["Reading comprehension", "Question answering", "Language understanding"],
    priority: "0.8",
  },
  {
    id: "speak-shadow",
    label: "Speak Lab",
    path: "/speak-lab",
    title: "Speak Lab | Read Aloud with Fox Tutor | FoxChild@Learn",
    description: "Practise read-aloud speaking with Fox Tutor. Listen, repeat, get pronunciation feedback, and try challenge mode in English, German, Chinese, Japanese and more.",
    ogTitle: "Speak Lab | Read Aloud with Fox Tutor",
    ogDescription: "Practise speaking and reading aloud with Fox Tutor. Listen, repeat, score, and challenge yourself.",
    keywords: [
      "Speak Lab",
      "read aloud practice",
      "speech recognition practice",
      "pronunciation feedback",
      "shadow reading",
      "Chinese reading aloud",
      "Japanese reading aloud",
      "German speaking practice",
    ],
    image: SPEAK_LAB_OG_IMAGE,
    priority: "0.9",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": "Speak Lab",
      "description": "A read-aloud practice tool where learners listen, repeat, receive pronunciation feedback, and try challenge mode.",
      "url": `${BASE_URL}/speak-lab`,
      "learningResourceType": "Interactive learning activity",
      "educationalUse": "Practice",
      "teaches": [
        "Reading aloud",
        "Pronunciation",
        "Listening and speaking",
        "Language fluency",
      ],
      "inLanguage": ["en", "de", "fr", "es", "it", "zh", "ja"],
      "audience": DEFAULT_AUDIENCE,
      "provider": DEFAULT_PROVIDER,
    },
  },
  {
    id: "builder",
    label: "Builder",
    path: "/builder",
    title: "Sentence Builder | Word Tile Grammar Practice | FoxChild@Learn",
    description: "Build sentences from word tiles, practise word order and grammar patterns, and review sentence-builder packs.",
    ogTitle: "Sentence Builder | Word tile grammar practice",
    ogDescription: "Practise sentence order, grammar and recall with interactive word tiles from sentence-builder packs.",
    keywords: [
      "sentence builder",
      "word tiles",
      "grammar practice",
      "sentence order",
      "language builder",
      "translation practice",
    ],
    learningResourceType: "Sentence building activity",
    educationalUse: ["Grammar practice", "Language learning", "Revision"],
    teaches: ["Word order", "Sentence construction", "Grammar patterns"],
    priority: "0.7",
  },
  {
    id: "crossword",
    label: "Crossword",
    path: "/crossword",
    title: "Crossword Revision | Keyword Puzzle Practice | FoxChild@Learn",
    description: "Turn learning pack keywords and definitions into crossword-style revision puzzles for quick recall practice.",
    ogTitle: "Crossword Revision | Pack-based keyword puzzles",
    ogDescription: "Practise definitions and key terms through crossword puzzles generated from learning packs.",
    keywords: [
      "crossword revision",
      "keyword puzzle",
      "definition practice",
      "revision crossword",
      "study pack puzzle",
    ],
    learningResourceType: "Educational puzzle",
    educationalUse: ["Revision", "Recall practice", "Game-based learning"],
    teaches: ["Definitions", "Keyword recall", "Topic vocabulary"],
    priority: "0.7",
  },
  {
    id: "progress",
    label: "Progress",
    path: "/progress",
    title: "Learning Progress | Study History and Mastery | FoxChild@Learn",
    description: "Track study history, mastered words, recent activity, quiz results, Speak Lab attempts and learning progress in one dashboard.",
    ogTitle: "Learning Progress | Track revision history and mastery",
    ogDescription: "Review progress, practice history, mastered words, quiz results and learning activity in FoxChild@Learn.",
    keywords: [
      "learning progress",
      "study history",
      "revision tracking",
      "mastered words",
      "quiz results",
      "practice history",
    ],
    learningResourceType: "Learning progress dashboard",
    educationalUse: ["Progress tracking", "Self assessment", "Revision planning"],
    teaches: ["Study reflection", "Mastery tracking", "Revision planning"],
    priority: "0.7",
  },
  {
    id: "mypacks",
    label: "My Packs",
    path: "/my-packs",
    title: "My Packs | Upload and Manage Learning Packs | FoxChild@Learn",
    description: "Upload, manage and practise with custom JSON learning packs for quizzes, reading, vocabulary and sentence activities.",
    ogTitle: "My Packs | Upload custom learning packs",
    ogDescription: "Bring your own learning packs into FoxChild@Learn and practise them in the browser.",
    keywords: [
      "My Packs",
      "upload learning packs",
      "custom study packs",
      "JSON learning packs",
      "pack management",
      "AI generated packs",
    ],
    learningResourceType: "Learning pack manager",
    educationalUse: ["Content management", "Practice", "Personalised learning"],
    teaches: ["Custom revision", "Pack-based learning", "Self-directed study"],
    priority: "0.7",
  },
  {
    id: "about",
    label: "About",
    path: "/about",
    title: "About FoxChild@Learn | Local-first AI Study Tools",
    description: "Learn about FoxChild@Learn, a browser-based learning platform for families creating personalised revision and study activities.",
    ogTitle: "About FoxChild@Learn | Local-first study tools",
    ogDescription: "Learn the mission behind FoxChild@Learn: turning everyday study materials into interactive revision tools.",
    keywords: [
      "About FoxChild Learn",
      "local-first learning",
      "AI study tools",
      "personalised revision",
      "family learning",
    ],
    learningResourceType: "About page",
    educationalUse: ["Information", "Product overview"],
    teaches: ["Learning Web mission", "Study pack workflow"],
    priority: "0.6",
  },
  {
    id: "ai-prompt",
    label: "AI Pack Creator",
    path: "/ai-pack-creator",
    title: "AI Learning Pack Creator | Prompt Builder | FoxChild@Learn",
    description: "Create structured prompts for AI-generated learning packs that can be uploaded into My Packs and practised in the app.",
    ogTitle: "AI Learning Pack Creator | Generate upload-ready pack prompts",
    ogDescription: "Build structured prompts for vocabulary, quiz, reading and revision packs that work with FoxChild@Learn.",
    keywords: [
      "AI learning pack creator",
      "prompt builder",
      "AI generated study packs",
      "learning pack JSON",
      "revision pack generator",
    ],
    learningResourceType: "Prompt builder",
    educationalUse: ["Content creation", "Study pack generation", "Revision planning"],
    teaches: ["Prompt design", "Pack creation", "Structured learning content"],
    priority: "0.6",
  },
  {
    id: "learning-settings",
    label: "Manage Learning",
    path: "/learning-settings",
    title: "Manage Learning | Personalise FoxChild@Learn",
    description: "Choose which modules, subjects and learning routes appear in your FoxChild@Learn workspace.",
    keywords: [
      "manage learning",
      "learning settings",
      "personalise study app",
      "student setup",
      "parent setup",
    ],
    priority: "0.4",
    noindex: true,
  },
  {
    id: "review",
    label: "Review",
    path: "/review",
    title: "Review Words | Weak Vocabulary Practice | FoxChild@Learn",
    description: "Review mastered and weaker words from recent practice, revisit mistakes and strengthen vocabulary recall.",
    ogTitle: "Review Words | Focus on weaker vocabulary",
    ogDescription: "Use recent practice history to review weaker words, mastered vocabulary and recall targets.",
    keywords: [
      "review words",
      "weak vocabulary",
      "vocabulary review",
      "mistake practice",
      "revision review",
      "mastered words",
    ],
    learningResourceType: "Review activity",
    educationalUse: ["Revision", "Recall practice", "Self assessment"],
    teaches: ["Vocabulary recall", "Mistake review", "Mastery practice"],
    priority: "0.5",
  },
];

export const APP_ROUTES = Object.fromEntries(APP_MODULES.map((module) => [module.id, module.path]));
export const PUBLIC_SITEMAP_MODULES = APP_MODULES.filter((module) => !module.noindex && module.priority);

const MODULE_BY_ID = new Map(APP_MODULES.map((module) => [module.id, module]));
const TAB_BY_PATH = new Map(APP_MODULES.map((module) => [module.path, module.id]));

const PATH_ALIASES = new Map([
  ["/vocab", "vocab"],
  ["/speak-shadow", "speak-shadow"],
  ["/speaklab", "speak-shadow"],
  ["/speak", "speak-shadow"],
  ["/mypacks", "mypacks"],
  ["/my-packs", "mypacks"],
  ["/language", "language"],
  ["/language-ladder", "language"],
  ["/smarttest", "smart-test"],
  ["/smart-test", "smart-test"],
]);

const HASH_ALIASES = new Map([
  ["#speak-lab", "speak-shadow"],
  ["#speak-shadow", "speak-shadow"],
  ["#reading", "reading"],
  ["#quiz", "quiz"],
  ["#vocabulary", "vocab"],
  ["#vocab", "vocab"],
  ["#builder", "builder"],
  ["#my-packs", "mypacks"],
]);

export function moduleForTab(tabId) {
  return MODULE_BY_ID.get(tabId) || MODULE_BY_ID.get("home");
}

export function pathForTab(tabId) {
  return moduleForTab(tabId).path;
}

export function metadataForTab(tabId) {
  const module = moduleForTab(tabId);
  return {
    title: module.title,
    description: module.description,
    canonical: `${BASE_URL}${module.path}`,
    ogTitle: module.ogTitle || module.title,
    ogDescription: module.ogDescription || module.description,
    image: module.image || DEFAULT_OG_IMAGE,
    imageAlt: module.imageAlt || `${module.label} preview in FoxChild@Learn`,
    keywords: Array.isArray(module.keywords) ? module.keywords.join(", ") : "",
    noindex: Boolean(module.noindex),
    structuredData: module.structuredData || buildModuleStructuredData(module),
  };
}

function buildModuleStructuredData(module) {
  if (module.noindex) return undefined;
  return {
    "@context": "https://schema.org",
    "@type": module.schemaType || "LearningResource",
    "name": module.schemaName || module.label,
    "description": module.description,
    "url": `${BASE_URL}${module.path}`,
    "learningResourceType": module.learningResourceType || "Interactive learning activity",
    "educationalUse": module.educationalUse || "Practice",
    "teaches": module.teaches || module.keywords || [],
    "inLanguage": module.inLanguage || DEFAULT_APP_LANGUAGES,
    "audience": module.audience || DEFAULT_AUDIENCE,
    "provider": DEFAULT_PROVIDER,
  };
}

function normalizePathname(pathname) {
  if (!pathname) return "/";
  const clean = pathname.replace(/\/+$/, "") || "/";
  return clean.toLowerCase();
}

export function resolveAppRoute(locationLike = window.location) {
  const pathname = normalizePathname(locationLike.pathname);
  const hash = (locationLike.hash || "").toLowerCase();
  const directTab = TAB_BY_PATH.get(pathname) || PATH_ALIASES.get(pathname);
  if (directTab) {
    return { tab: directTab, notFound: false, canonicalPath: pathForTab(directTab), replace: pathname !== pathForTab(directTab) };
  }
  if (pathname === "/" && HASH_ALIASES.has(hash)) {
    const tab = HASH_ALIASES.get(hash);
    return { tab, notFound: false, canonicalPath: pathForTab(tab), replace: true };
  }
  return { tab: "not-found", notFound: true, canonicalPath: pathname, replace: false };
}
