/**
 * scripts/build-studybook-index.js
 *
 * Build-time indexer for FoxChild Tutor study book search.
 * Reads manifest for study book paths, splits markdown by headings,
 * outputs public/search/studybook-index.json for client-side search.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { marked } from "marked";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MANIFEST_PATH = path.join(ROOT, "data", "generated", "manifest.json");
const OUT_DIR = path.join(ROOT, "public", "search");

/**
 * Split markdown by headings into chunks.
 * Returns array of { heading, anchor, level, content, wordCount }
 */
function splitMarkdownByHeadings(markdown, sourcePath) {
  const chunks = [];

  // Use marked's lexer to get tokens
  const tokens = marked.lexer(markdown);

  let currentHeading = null;
  let currentLevel = 0;
  let currentContent = [];
  let currentAnchor = null;

  function flushChunk() {
    if (currentHeading && currentContent.length > 0) {
      const content = currentContent.join("\n").trim();
      if (content.length > 30) { // Skip tiny fragments
        const words = content.split(/\s+/).filter(Boolean).length;
        chunks.push({
          heading: currentHeading,
          anchor: currentAnchor,
          level: currentLevel,
          content,
          wordCount: words,
          sourcePath
        });
      }
    }
    currentContent = [];
  }

  for (const token of tokens) {
    if (token.type === "heading") {
      // Flush previous chunk
      flushChunk();

      // Start new chunk
      currentHeading = token.text;
      currentLevel = token.depth;
      currentAnchor = token.text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    } else if (token.type === "paragraph" || token.type === "list" ||
               token.type === "blockquote" || token.type === "code" ||
               token.type === "table") {
      // Extract text from token
      let text = "";
      if (token.text) {
        text = token.text;
      } else if (token.items) {
        text = token.items.map(i => i.text || "").join("\n");
      } else if (token.tokens) {
        text = token.tokens.map(t => t.text || "").join("\n");
      }
      if (text) currentContent.push(text);
    }
  }

  // Flush final chunk
  flushChunk();

  // If no headings found, treat whole doc as one chunk
  if (chunks.length === 0 && markdown.trim().length > 30) {
    const words = markdown.split(/\s+/).filter(Boolean).length;
    chunks.push({
      heading: "Full Document",
      anchor: null,
      level: 0,
      content: markdown.trim(),
      wordCount: words,
      sourcePath
    });
  }

  return chunks;
}

/**
 * Collect all study book paths from manifest.
 */
function collectStudyBookPaths(manifest) {
  const paths = [];
  const seenFiles = new Set();

  function walk(obj) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) {
      obj.forEach(walk);
      return;
    }
    // Check for contentMdPath
    if (obj.contentMdPath && typeof obj.contentMdPath === "string") {
      const key = `${obj.id}|${obj.contentMdPath}`;
      if (seenFiles.has(key)) return;
      seenFiles.add(key);
      const fullPath = path.join(ROOT, obj.contentMdPath);
      if (fs.existsSync(fullPath)) {
        paths.push({
          id: obj.id,
          displayName: obj.displayName || obj.id,
          subject: obj.subject || "",
          curriculum: obj.curriculum || "",
          packPath: obj.unifiedPath || "",
          filePath: obj.contentMdPath,
          fullPath
        });
      }
    }
    // Check for extraMdFiles
    if (Array.isArray(obj.extraMdFiles)) {
      obj.extraMdFiles.forEach(extra => {
        if (extra.path && typeof extra.path === "string") {
          const extraId = obj.id + (extra.path.includes("/") ? `_${path.basename(extra.path, ".md")}` : "");
          const key = `${extraId}|${extra.path}`;
          if (seenFiles.has(key)) return;
          seenFiles.add(key);
          const fullPath = path.join(ROOT, extra.path);
          if (fs.existsSync(fullPath)) {
            paths.push({
              id: extraId,
              displayName: obj.displayName || obj.id,
              subject: obj.subject || "",
              curriculum: obj.curriculum || "",
              packPath: obj.unifiedPath || "",
              filePath: extra.path,
              fullPath,
              title: extra.title
            });
          }
        }
      });
    }
    // Recurse
    Object.values(obj).forEach(walk);
  }

  walk(manifest);
  return paths;
}

/**
 * Also include pre-generated combined markdown files from public/study-books/
 */
function collectCombinedMarkdownFiles() {
  const studyBooksDir = path.join(ROOT, "public", "study-books");
  const files = [];

  function walkDir(dir, subject, curriculum) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath, subject, entry.name);
      } else if (entry.name.endsWith(".md") && entry.name !== "all.md") {
        // Skip individual curriculum files for now (they're subsets)
      } else if (entry.name === "all.md") {
        // This is the combined subject+curriculum file
        files.push({
          id: `${subject}_${curriculum}_combined`,
          displayName: `${subject} - ${curriculum} (combined)`,
          subject,
          curriculum,
          packPath: "",
          filePath: path.relative(ROOT, fullPath),
          fullPath,
          isCombined: true,
          level: 0
        });
      }
    }
  }

  if (fs.existsSync(studyBooksDir)) {
    const subjects = fs.readdirSync(studyBooksDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    for (const subject of subjects) {
      const subjectDir = path.join(studyBooksDir, subject);
      const curricula = fs.readdirSync(subjectDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      for (const curriculum of curricula) {
        walkDir(path.join(subjectDir, curriculum), subject, curriculum);
      }
    }
  }
  return files;
}

/**
 * Main build function.
 */
async function buildIndex() {
  console.log("🔧 Building study book search index...");

  // Load manifest
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));

  // Collect all study book sources
  const individualPaths = collectStudyBookPaths(manifest);
  const combinedFiles = collectCombinedMarkdownFiles();

  console.log(`  Found ${individualPaths.length} individual study_notes.md files`);
  console.log(`  Found ${combinedFiles.length} combined markdown files`);

  // Process all files
  const allChunks = [];
  let processed = 0;

  for (const file of [...individualPaths, ...combinedFiles]) {
    try {
      const markdown = fs.readFileSync(file.fullPath, "utf-8");
      const chunks = splitMarkdownByHeadings(markdown, file.filePath);

      for (const [chunkIndex, chunk] of chunks.entries()) {
        allChunks.push({
          id: `${file.id}|${file.filePath.replace(/[|]/g, "_")}|${chunk.anchor || "full"}|${chunk.level}|${chunkIndex}`,
          packId: file.id,
          displayName: file.displayName,
          subject: file.subject,
          curriculum: file.curriculum,
          heading: chunk.heading,
          anchor: chunk.anchor,
          level: chunk.level,
          content: chunk.content,
          wordCount: chunk.wordCount,
          sourcePath: file.filePath,
          packPath: file.packPath,
          isCombined: file.isCombined || false
        });
      }
      processed++;
    } catch (err) {
      console.error(`  ⚠️  Failed to process ${file.filePath}:`, err.message);
    }
  }

  console.log(`  Processed ${processed} files`);
  console.log(`  Generated ${allChunks.length} search chunks`);

  // Validate no duplicate IDs
  const seenIds = new Set();
  for (const chunk of allChunks) {
    if (seenIds.has(chunk.id)) {
      console.error(`❌ Duplicate chunk ID: ${chunk.id}`);
      console.error(`  Source file: ${chunk.sourcePath}`);
      process.exit(1);
    }
    seenIds.add(chunk.id);
  }
  console.log(`  ✅ All ${allChunks.length} chunk IDs are unique`);

  // Build output
  const output = {
    version: 1,
    generatedAt: new Date().toISOString(),
    totalChunks: allChunks.length,
    totalFiles: processed,
    chunks: allChunks
  };

  // Write output
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, "studybook-index.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");

  console.log(`✅ Index written to ${outPath}`);
  console.log(`   Total chunks: ${allChunks.length}`);
  console.log(`   Subjects: ${[...new Set(allChunks.map(c => c.subject))].filter(Boolean).join(", ")}`);
}

// Run
buildIndex().catch(err => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});