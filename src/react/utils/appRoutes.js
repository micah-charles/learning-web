const BASE_URL = "https://www.foxchildidea.com";
const DEFAULT_OG_IMAGE = `${BASE_URL}/og/default.png`;
const SPEAK_LAB_OG_IMAGE = `${BASE_URL}/og/speak-lab.png`;

export const APP_MODULES = [
  {
    id: "home",
    label: "Home",
    path: "/",
    title: "FoxChild@Learn | AI-powered Learning Packs",
    description: "A cosy AI-powered learning space for quizzes, reading, speaking practice, language learning, games, and revision packs.",
    priority: "1.0",
  },
  {
    id: "language",
    label: "Language Ladder",
    path: "/language-ladder",
    title: "Language Ladder | FoxChild@Learn",
    description: "Build language confidence with guided vocabulary, listening, and sentence practice.",
    priority: "0.8",
  },
  {
    id: "quiz",
    label: "Quiz",
    path: "/quiz",
    title: "Quiz Practice | FoxChild@Learn",
    description: "Practise revision questions, vocabulary, grammar, and study pack quizzes in FoxChild@Learn.",
    priority: "0.8",
  },
  {
    id: "smart-test",
    label: "Smart Test",
    path: "/smart-test",
    title: "Smart Test | FoxChild@Learn",
    description: "Try adaptive study checks that help learners focus on what needs more practice.",
    priority: "0.8",
  },
  {
    id: "arcade",
    label: "Arcade",
    path: "/arcade",
    title: "Learning Arcade | FoxChild@Learn",
    description: "Play quick revision games built from vocabulary, quiz, and sentence builder packs.",
    priority: "0.7",
  },
  {
    id: "vocab",
    label: "Vocabulary",
    path: "/vocabulary",
    title: "Vocabulary Practice | FoxChild@Learn",
    description: "Browse vocabulary, definitions, examples, and pack words for KS3 and GCSE revision.",
    priority: "0.8",
  },
  {
    id: "reading",
    label: "Reading",
    path: "/reading",
    title: "Reading Practice | FoxChild@Learn",
    description: "Read passages, answer comprehension questions, and practise language reading packs.",
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
      "provider": {
        "@type": "Organization",
        "name": "FoxChild Idea",
        "url": `${BASE_URL}/`,
      },
    },
  },
  {
    id: "builder",
    label: "Builder",
    path: "/builder",
    title: "Sentence Builder | FoxChild@Learn",
    description: "Build sentences from word tiles and practise grammar, order, and recall.",
    priority: "0.7",
  },
  {
    id: "crossword",
    label: "Crossword",
    path: "/crossword",
    title: "Crossword Revision | FoxChild@Learn",
    description: "Turn learning packs into crossword-style revision challenges.",
    priority: "0.7",
  },
  {
    id: "progress",
    label: "Progress",
    path: "/progress",
    title: "Learning Progress | FoxChild@Learn",
    description: "Review study activity, mastered words, quiz results, and recent progress.",
    priority: "0.7",
  },
  {
    id: "mypacks",
    label: "My Packs",
    path: "/my-packs",
    title: "My Packs | FoxChild@Learn",
    description: "Upload, manage, and practise with custom learning packs in the browser.",
    priority: "0.7",
  },
  {
    id: "about",
    label: "About",
    path: "/about",
    title: "About FoxChild@Learn",
    description: "Learn about FoxChild@Learn, a browser-based learning platform for personalised revision.",
    priority: "0.6",
  },
  {
    id: "ai-prompt",
    label: "AI Pack Creator",
    path: "/ai-pack-creator",
    title: "AI Learning Pack Creator | FoxChild@Learn",
    description: "Create prompts for generating learning packs that can be uploaded into My Packs.",
    priority: "0.6",
  },
  {
    id: "learning-settings",
    label: "Manage Learning",
    path: "/learning-settings",
    title: "Manage Learning | FoxChild@Learn",
    description: "Choose which FoxChild@Learn modules are shown in your learning space.",
    priority: "0.4",
    noindex: true,
  },
  {
    id: "review",
    label: "Review",
    path: "/review",
    title: "Review Words | FoxChild@Learn",
    description: "Review mastered and weaker words from recent practice.",
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
    noindex: Boolean(module.noindex),
    structuredData: module.structuredData,
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
