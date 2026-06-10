#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { marked, extractTOC } from "../src/study-book-core.js";

const ROOT = resolve(import.meta.dirname, "..");
const MANIFEST_PATH = resolve(ROOT, "data/generated/manifest.json");
const SEO_DIR = resolve(ROOT, "dist/revision");
const SITEMAP_PATH = resolve(ROOT, "dist/sitemap.xml");
const ROBOTS_PATH = resolve(ROOT, "dist/robots.txt");
const BASE_URL = "https://www.foxchildidea.com";

const SUBJECT_CONFIG = {
  language:         { label: "Languages",         slug: "languages" },
  history:          { label: "History",           slug: "history" },
  geography:        { label: "Geography",         slug: "geography" },
  science:          { label: "Science",           slug: "science" },
  computing:        { label: "Computing",         slug: "computing" },
  religious_studies:{ label: "Religious Studies", slug: "religious-studies" },
  religion:         { label: "Religious Studies", slug: "religious-studies" },
  literature:       { label: "Literature",        slug: "literature" },
};

const CURRICULUM_LABELS = {
  ks3: "KS3",
  gcse: "GCSE",
  "us-middle-school": "US Middle School",
  other: "Other",
};

// configureMarked() + extractTOC() live in src/study-book-core.js
// They are imported above and automatically configured on import.

function slug(value) {
  const text = (value || "study").toString().trim().toLowerCase();
  return text
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-") || "study";
}

function getSubjectConfig(subjectId) {
  const conf = SUBJECT_CONFIG[subjectId];
  if (conf) return conf;
  const s = subjectId.replace(/_/g, "-");
  return { label: subjectId.charAt(0).toUpperCase() + subjectId.slice(1), slug: s };
}

/** Try to read a markdown file; return null if missing */
function readMarkdown(mdPath) {
  const fullPath = resolve(ROOT, mdPath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, "utf-8");
}

/** Convert markdown to HTML (marked is already configured by study-book-core.js) */
function mdToHtml(md) {
  if (!md) return "";
  return marked.parse(md, { async: false });
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapPage(title, description, canonical, contentHtml, structuredData) {
  const sdJson = structuredData ? `\n<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#3d9ea5" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="stylesheet" href="/revision/revision.css" />
  ${sdJson}
</head>
<body>
  <div class="seo-page">
    <header class="seo-header">
      <a href="/" class="seo-logo">
        <img src="/revision/logo.png" alt="" class="seo-logo-img" />
        FoxChild@Learn
      </a>
      <nav class="seo-nav">
        <a href="/">Home</a>
        <a href="/revision/subjects/">Subjects</a>
      </nav>
    </header>
    <main class="seo-main">
      ${contentHtml}
    </main>
    <footer class="seo-footer">
      <p>&copy; FoxChild Idea. <a href="/">Return to the interactive Learning Web app</a></p>
    </footer>
  </div>
</body>
</html>`;
}

function wrapStudyBookPage(title, description, canonical, bookTitle, bookDesc, tocHtml, contentHtml, relatedHtml, structuredData) {
  const sdJson = structuredData ? `\n<script type="application/ld+json">${JSON.stringify(structuredData, null, 2)}</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${canonical}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#3d9ea5" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <link rel="stylesheet" href="/revision/revision.css" />
  ${sdJson}
</head>
<body>
  <div class="sb-page">
    <header class="sb-page-header">
      <a href="/" class="sb-page-logo">
        <img src="/revision/logo.png" alt="" class="seo-logo-img" />
        FoxChild@Learn
      </a>
      <nav class="sb-page-nav">
        <a href="/">Home</a>
        <a href="/revision/subjects/">Subjects</a>
      </nav>
    </header>
    <div class="sb-page-titlebar">
      <h1 class="sb-page-title">${escapeHtml(bookTitle)}</h1>
      ${bookDesc ? '<p class="sb-page-desc">' + escapeHtml(bookDesc) + '</p>' : ""}
    </div>
    <div class="sb-search-bar">
      <input type="search" id="sb-search-input" class="sb-search-input" placeholder="Search within notes..." aria-label="Search notes" />
      <span id="sb-search-count" class="sb-search-count"></span>
      <button id="sb-search-prev" class="sb-search-nav" aria-label="Previous match" title="Previous match">&uarr;</button>
      <button id="sb-search-next" class="sb-search-nav" aria-label="Next match" title="Next match">&darr;</button>
    </div>
    <div class="sb-inner">
      <nav class="sb-toc" aria-label="Table of contents">
        <p class="sb-toc-title">Contents</p>
        <ul class="sb-toc-list">
          ${tocHtml}
        </ul>
      </nav>
      <div id="sb-content" class="sb-content">
        <div data-file-content="main">${contentHtml}</div>
        ${relatedHtml}
        <div class="cta-section">

          <a href="/" class="cta-button secondary">Practice this topic</a>
        </div>
      </div>
    </div>
  </div>
  <script src="/revision/revision-study-book.js"><\/script>
</body>
</html>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  // marked is already configured by importing study-book-core.js

  // Read manifest — collect ALL packs from both arrays
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
  const allPacks = [...(manifest.packs || []), ...(manifest.revisionPacks || [])];
  const packs = manifest.revisionPacks || manifest.packs || [];

  // Collect ALL subjects from the manifest (even packs without contentMdPath)
  const allSubjects = new Map();
  for (const pack of allPacks) {
    const subject = pack.subject || "other";
    const conf = getSubjectConfig(subject);
    const key = conf.slug;
    if (!allSubjects.has(key)) {
      allSubjects.set(key, { slug: conf.slug, label: conf.label, bookCount: 0 });
    }
    allSubjects.get(key).bookCount++;
  }

  // Collect study book packs (those with contentMdPath)
  const studyBooks = [];
  for (const pack of packs) {
    if (!pack.contentMdPath) continue;
    const subject = pack.subject || "other";
    const conf = getSubjectConfig(subject);
    const curriculum = pack.curriculum || "other";
    const curriculumLabel = CURRICULUM_LABELS[curriculum] || curriculum;
    const slugged = slug(pack.id);
    const md = readMarkdown(pack.contentMdPath);
    if (!md) {
      console.warn(`[seo] WARNING: Markdown file not found: ${pack.contentMdPath} (pack: ${pack.id})`);
    }
    studyBooks.push({
      id: pack.id,
      title: pack.displayName || pack.id,
      description: pack.grammarFocusEn || `Study revision notes for ${pack.displayName || pack.id}`,
      subject,
      subjectSlug: conf.slug,
      subjectLabel: conf.label,
      curriculum,
      curriculumLabel,
      slug: slugged,
      md,
      mdPath: pack.contentMdPath,
      pack,
    });
  }

  // Group study books by subject (only for subjects that have them)
  const bySubject = new Map();
  for (const sb of studyBooks) {
    if (!bySubject.has(sb.subjectSlug)) {
      bySubject.set(sb.subjectSlug, { slug: sb.subjectSlug, label: sb.subjectLabel, books: [] });
    }
    bySubject.get(sb.subjectSlug).books.push(sb);
  }

  // Ensure all known subjects appear even without study books
  for (const [slug, info] of allSubjects) {
    if (!bySubject.has(slug)) {
      bySubject.set(slug, { slug, label: info.label, books: [] });
    }
  }

  // Sort subjects by label
  const sortedSubjects = [...bySubject.values()].sort((a, b) => a.label.localeCompare(b.label));

  // Collect all URLs for sitemap
  const sitemapUrls = [];

  // ── Clean output dir ─────────────────────────────────────────────────────────
  const subjectsDir = resolve(SEO_DIR, "subjects");
  const studybookDir = resolve(SEO_DIR, "studybook");
  mkdirSync(resolve(SEO_DIR), { recursive: true });
  mkdirSync(subjectsDir, { recursive: true });
  mkdirSync(studybookDir, { recursive: true });

  // ── Generate subject landing pages ──────────────────────────────────────────
  for (const subj of sortedSubjects) {
    const subjDir = resolve(subjectsDir, subj.slug);
    mkdirSync(subjDir, { recursive: true });

    const pageTitle = `${subj.label} Revision and Practice | FoxChild@Learn`;
    const pageDesc = `Free KS3${subj.slug === "religious-studies" ? " and GCSE" : ""} ${subj.label.toLowerCase()} revision study notes and interactive quizzes. ${subj.books.length} study packs available.`;
    const canonical = `${BASE_URL}/revision/subjects/${subj.slug}/`;

    // Build book cards
    let booksHtml = '<div class="book-grid">';
    for (const sb of subj.books) {
      const bookUrl = `/revision/studybook/${sb.subjectSlug}/${sb.slug}/`;
      const desc = escapeHtml((sb.description || "").substring(0, 150));
      booksHtml += `
        <a href="${bookUrl}" class="book-card">
          <h3 class="book-card-title">${escapeHtml(sb.title)}</h3>
          <p class="book-card-desc">${desc}${sb.description && sb.description.length > 150 ? "&hellip;" : ""}</p>
          <span class="book-card-meta">${sb.curriculumLabel} &middot; ${sb.subjectLabel}</span>
        </a>`;
    }
    booksHtml += "</div>";

    const contentHtml = `
      <h1>${subj.label} Revision and Practice</h1>
      <p class="lead">Free ${subj.label.toLowerCase()} study notes and interactive revision for KS3${subj.slug === "religious-studies" ? " and GCSE" : ""} students. Browse all ${subj.books.length} study packs below, or open the interactive app to practise with quizzes, flashcards, and more.</p>
      ${booksHtml}
      <div class="cta-section">
        <a href="/" class="cta-button">Start interactive quiz practice</a>
      </div>`;

    const sd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${subj.label} Revision and Practice`,
      "description": pageDesc,
      "provider": { "@type": "Organization", "name": "FoxChild Idea", "url": "https://www.foxchildidea.com/" },
    };

    writeFileSync(resolve(subjDir, "index.html"), wrapPage(pageTitle, pageDesc, canonical, contentHtml, sd));
    sitemapUrls.push(canonical);
    console.log(`[seo] Generated subject page: /revision/subjects/${subj.slug}/`);
  }

  // ── Generate subject index page ─────────────────────────────────────────────
  {
    const indexDir = resolve(subjectsDir);
    let listHtml = '<div class="subject-grid">';
    for (const subj of sortedSubjects) {
      const url = `/revision/subjects/${subj.slug}/`;
      listHtml += `
        <a href="${url}" class="subject-card">
          <h2>${subj.label}</h2>
          <p>${subj.books.length} study pack${subj.books.length !== 1 ? "s" : ""}</p>
        </a>`;
    }
    listHtml += "</div>";

    const contentHtml = `
      <h1>All Subjects</h1>
      <p class="lead">Choose a subject to browse revision study notes and practice materials.</p>
      ${listHtml}
      <div class="cta-section">
        <a href="/" class="cta-button">Open interactive Learning Web</a>
      </div>`;

    const sd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "All Subjects | FoxChild@Learn",
      "description": "Browse free KS3 and GCSE revision study notes across all subjects.",
      "provider": { "@type": "Organization", "name": "FoxChild Idea" },
    };

    writeFileSync(resolve(indexDir, "index.html"), wrapPage(
      "All Subjects | FoxChild@Learn",
      "Browse free KS3 and GCSE revision study notes across all subjects. Choose from Geography, History, Science, Languages, Computing, Religious Studies and more.",
      `${BASE_URL}/revision/subjects/`,
      contentHtml,
      sd
    ));
    sitemapUrls.push(`${BASE_URL}/revision/subjects/`);
    console.log("[seo] Generated subject index page: /revision/subjects/");
  }

  // ── Generate study book pages ──────────────────────────────────────────────
  for (const sb of studyBooks) {
    const sbDir = resolve(studybookDir, sb.subjectSlug, sb.slug);
    mkdirSync(sbDir, { recursive: true });

    const pageTitle = `${sb.title} | ${sb.subjectLabel} Revision Notes | FoxChild@Learn`;
    const pageDesc = sb.description
      ? sb.description.substring(0, 160)
      : `Free ${sb.subjectLabel.toLowerCase()} revision study notes for ${sb.title}.`;
    const canonical = `${BASE_URL}/revision/studybook/${sb.subjectSlug}/${sb.slug}/`;

    // Convert markdown to HTML
    let mdHtml = "";
    let toc = [];
    let mdAvailable = false;
    if (sb.md) {
      toc = extractTOC(sb.md);
      mdHtml = mdToHtml(sb.md);
      mdAvailable = true;
    }

    // Render TOC
    let tocHtml = "";
    for (const entry of toc) {
      tocHtml += `<li class="sb-toc-h${entry.level}"><a href="#${entry.anchor}">${escapeHtml(entry.text)}</a></li>\n`;
    }
    if (!tocHtml) {
      tocHtml = '<li class="sb-toc-empty">No sections</li>';
    }

    // Build related topics
    const subjectBooks = bySubject.get(sb.subjectSlug)?.books || [];
    const related = subjectBooks.filter((b) => b.id !== sb.id).slice(0, 6);

    let relatedHtml = "";
    if (related.length > 0) {
      relatedHtml = '<div class="related-section"><h2>Related Topics</h2><div class="book-grid compact">';
      for (const rel of related) {
        const relUrl = `/revision/studybook/${rel.subjectSlug}/${rel.slug}/`;
        relatedHtml += `
          <a href="${relUrl}" class="book-card compact">
            <h3 class="book-card-title">${escapeHtml(rel.title)}</h3>
            <span class="book-card-meta">${rel.curriculumLabel}</span>
          </a>`;
      }
      relatedHtml += "</div></div>";
    }

    const notesHtml = mdAvailable
      ? mdHtml
      : `<p class="notes-unavailable">Study notes are not yet available for this topic. <a href="/">Open the interactive Learning Web</a> to practise with quizzes and activities.</p>`;

    const sd = {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": sb.title,
      "description": sb.description || `${sb.title} revision study notes.`,
      "educationalLevel": sb.curriculumLabel,
      "learningResourceType": "Study Guide",
      "about": sb.subjectLabel,
      "provider": {
        "@type": "Organization",
        "name": "FoxChild Idea",
        "url": "https://www.foxchildidea.com/",
      },
    };

    writeFileSync(resolve(sbDir, "index.html"), wrapStudyBookPage(
      pageTitle, pageDesc, canonical,
      sb.title, sb.description,
      tocHtml, notesHtml, relatedHtml, sd
    ));
    sitemapUrls.push(canonical);

    if (!mdAvailable) {
      console.warn(`[seo] WARNING: Study book page generated without markdown content for: ${sb.id}`);
    }
    console.log(`[seo] Generated study book page: /revision/studybook/${sb.subjectSlug}/${sb.slug}/`);
  }

  // ── Copy assets from public/revision into dist/revision ──────────────────
  // Vite root is src/react/, so public/ at project root isn't copied automatically.
  try {
    const publicRevision = resolve(ROOT, "public/revision");
    if (existsSync(publicRevision)) {
      for (const name of ["revision.css", "revision-study-book.js", "logo.png"]) {
        const src = resolve(publicRevision, name);
        const dest = resolve(SEO_DIR, name);
        if (existsSync(src)) writeFileSync(dest, readFileSync(src));
      }
    }
  } catch (_) { /* asset copy is non-critical */ }

  // ── Generate sitemap.xml ──────────────────────────────────────────────────
  {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const seen = new Set();
    // Homepage (highest priority)
    xml += `  <url><loc>${BASE_URL}/</loc><priority>1.0</priority></url>\n`;
    seen.add(`${BASE_URL}/`);
    // SEO pages
    for (const url of sitemapUrls) {
      if (seen.has(url)) continue;
      seen.add(url);
      xml += `  <url><loc>${url}</loc><priority>0.7</priority></url>\n`;
    }
    xml += `</urlset>`;
    writeFileSync(SITEMAP_PATH, xml);
    console.log(`[seo] Generated sitemap.xml with ${seen.size} URLs`);
  }

  // ── Generate robots.txt ──────────────────────────────────────────────────
  {
    const robots = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml
`;
    writeFileSync(ROBOTS_PATH, robots);
    console.log("[seo] Generated robots.txt");
  }

  console.log(`\n[seo] Done! Generated ${studyBooks.length} study book pages across ${sortedSubjects.length} subjects.`);
}

main();
