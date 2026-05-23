import fs from "node:fs";
import path from "node:path";

const args = new Set(process.argv.slice(2));
const shouldFix = args.has("--fix");
const packsRootArg = process.argv.find((arg) => arg.startsWith("--packs-root="));
const csvArg = process.argv.find((arg) => arg.startsWith("--csv="));

const packsRoot = packsRootArg
  ? packsRootArg.slice("--packs-root=".length)
  : "data/ProgressiveLanguagePacks/qclaw/stage1";
const csvPath = csvArg
  ? csvArg.slice("--csv=".length)
  : "docs/progressive_language_placeholder_corrections.csv";

const LANGS = ["en", "de", "fr", "es", "zh", "ja"];

const CURATED_TERMS = {
  PLACE_AIRPORT: {
    en: { text: "airport" },
    de: { text: "Flughafen", article: "der" },
    fr: { text: "aéroport", article: "l'" },
    es: { text: "aeropuerto", article: "el" },
    zh: { text: "机场" },
    ja: { text: "空港" },
  },
  VEHICLE_AIRPLANE: {
    en: { text: "airplane" },
    de: { text: "Flugzeug", article: "das" },
    fr: { text: "avion", article: "l'" },
    es: { text: "avión", article: "el" },
    zh: { text: "飞机" },
    ja: { text: "飛行機" },
  },
};

function conceptAlias(conceptId) {
  return conceptId.toLowerCase().replace(/_/g, " ");
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function listPackFiles(root) {
  const files = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listPackFiles(fullPath));
    } else if (entry.isFile() && entry.name === "pack.json") {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function hasAsciiWord(text) {
  return /[A-Za-z]/.test(text);
}

function isUsableTargetText(lang, text, englishText) {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (lang !== "en" && englishText && trimmed.toLowerCase() === englishText.toLowerCase()) {
    return false;
  }
  if ((lang === "zh" || lang === "ja") && hasAsciiWord(trimmed)) {
    return false;
  }
  return true;
}

function displayText(term, lang) {
  if (!term) return "";
  if (term.article && ["de", "fr", "es"].includes(lang)) {
    if (/['’]$/.test(term.article)) return `${term.article}${term.text}`;
    return `${term.article} ${term.text}`;
  }
  return term.text;
}

function replacementFor(concept, lang, jsonPath) {
  const englishText = concept.translations?.en?.text || "";
  const curated = CURATED_TERMS[concept.conceptId]?.[lang];
  const existing = concept.translations?.[lang];
  const useGloss = jsonPath.endsWith(".meaning");

  if (useGloss && englishText) {
    return { replacement: englishText, source: "english_gloss", confidence: "high" };
  }
  if (curated?.text) {
    return { replacement: curated.text, source: "curated", confidence: "high" };
  }
  if (isUsableTargetText(lang, existing?.text, englishText)) {
    return { replacement: existing.text, source: "vocabulary", confidence: "medium" };
  }
  return { replacement: "", source: "missing", confidence: "low" };
}

function normalizeSpacing(text, lang, jsonPath) {
  let result = text;
  const isTargetSurface =
    jsonPath.endsWith(".text") ||
    jsonPath.includes(".tiles[") ||
    (jsonPath.includes(".tokens[") && jsonPath.endsWith(".text"));
  if ((lang === "zh" || lang === "ja") && isTargetSurface) {
    result = result.replace(/\s+/g, "");
  }
  if (lang === "fr") {
    result = result
      .replace(/\bl['’]\s+/gi, "l'")
      .replace(/\b(dans|à|a)\s+la\s+(aéroport|avion)\b/gi, (_, prep, noun) => `${prep === "a" ? "à" : prep} l'${noun}`)
      .replace(/\b(dans|à|a)\s+le\s+(aéroport|avion)\b/gi, (_, prep, noun) => `${prep === "a" ? "à" : prep} l'${noun}`)
      .replace(/\bla\s+(aéroport|avion)\b/gi, "l'$1")
      .replace(/\ble\s+(aéroport|avion)\b/gi, "l'$1");
  }
  if (lang === "es") {
    result = result
      .replace(/\ben\s+la\s+aeropuerto\b/gi, "en el aeropuerto")
      .replace(/\bla\s+aeropuerto\b/gi, "el aeropuerto");
  }
  return result;
}

function replaceAlias(value, alias, replacement, lang, jsonPath) {
  const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const next = value.replace(new RegExp(escapedAlias, "gi"), replacement);
  return normalizeSpacing(next, lang, jsonPath);
}

function updateCuratedVocabulary(pack, filePath, rows) {
  let changed = false;
  for (const item of pack.vocabulary || []) {
    const terms = CURATED_TERMS[item.conceptId];
    if (!terms) continue;
    for (const lang of LANGS) {
      const current = item.translations?.[lang] || {};
      const desired = terms[lang];
      if (!desired) continue;
      const desiredTranslation = { ...current, ...desired };
      if (JSON.stringify(current) === JSON.stringify(desiredTranslation)) continue;
      rows.push({
        file: filePath,
        packId: pack.packId,
        section: "vocabulary",
        jsonPath: `vocabulary[conceptId=${item.conceptId}].translations.${lang}`,
        language: lang,
        conceptId: item.conceptId,
        issueType: "bad_or_placeholder_vocabulary_translation",
        originalValue: JSON.stringify(current),
        correctedValue: JSON.stringify(desiredTranslation),
        confidence: "high",
        action: shouldFix ? "changed" : "would_change",
      });
      if (shouldFix) {
        item.translations[lang] = desiredTranslation;
        changed = true;
      }
    }
  }
  return changed;
}

function scanNode(node, context, concepts, rows) {
  let changed = false;
  if (typeof node === "string") {
    let value = node;
    for (const concept of concepts) {
      const alias = concept.alias;
      if (!value.toLowerCase().includes(alias)) continue;
      const { replacement, source, confidence } = replacementFor(concept, context.lang, context.jsonPath);
      if (!replacement) {
        rows.push({
          ...context,
          conceptId: concept.conceptId,
          issueType: "concept_label_leak",
          originalValue: node,
          correctedValue: "",
          confidence,
          action: "needs_manual_review",
        });
        continue;
      }
      const next = replaceAlias(value, alias, replacement, context.lang, context.jsonPath);
      if (next !== value) {
        rows.push({
          ...context,
          conceptId: concept.conceptId,
          issueType: `concept_label_leak:${source}`,
          originalValue: node,
          correctedValue: next,
          confidence,
          action: shouldFix ? "changed" : "would_change",
        });
        value = next;
        changed = true;
      }
    }
    return { value, changed };
  }

  if (Array.isArray(node)) {
    const next = node.map((item, index) => {
      const result = scanNode(item, { ...context, jsonPath: `${context.jsonPath}[${index}]` }, concepts, rows);
      changed = changed || result.changed;
      return result.value;
    });
    return { value: next, changed };
  }

  if (node && typeof node === "object") {
    const next = node;
    for (const [key, child] of Object.entries(node)) {
      const result = scanNode(child, { ...context, jsonPath: `${context.jsonPath}.${key}` }, concepts, rows);
      if (result.changed) {
        next[key] = result.value;
        changed = true;
      }
    }
    return { value: next, changed };
  }

  return { value: node, changed: false };
}

function scanTranslations(translations, context, concepts, rows) {
  let changed = false;
  for (const lang of LANGS) {
    const translation = translations?.[lang];
    if (!translation) continue;
    const result = scanNode(
      translation,
      { ...context, language: lang, lang, jsonPath: `${context.jsonPath}.${lang}` },
      concepts,
      rows,
    );
    if (result.changed) {
      translations[lang] = result.value;
      changed = true;
    }
  }
  return changed;
}

function scanPack(filePath) {
  const pack = readJson(filePath);
  const rows = [];
  let changed = updateCuratedVocabulary(pack, filePath, rows);
  const concepts = (pack.vocabulary || [])
    .map((item) => ({ ...item, alias: conceptAlias(item.conceptId) }))
    .sort((a, b) => b.alias.length - a.alias.length);

  for (const [chainIndex, chain] of (pack.phraseProgressionChains || []).entries()) {
    for (const [stepIndex, step] of (chain.steps || []).entries()) {
      changed = scanTranslations(
        step.translations,
        {
          file: filePath,
          packId: pack.packId,
          section: "phraseProgressionChains",
          jsonPath: `phraseProgressionChains[${chainIndex}].steps[${stepIndex}].translations`,
        },
        concepts,
        rows,
      ) || changed;
    }
  }

  for (const [builderIndex, builder] of (pack.sentenceBuilders || []).entries()) {
    changed = scanTranslations(
      builder.translations,
      {
        file: filePath,
        packId: pack.packId,
        section: "sentenceBuilders",
        jsonPath: `sentenceBuilders[${builderIndex}].translations`,
      },
      concepts,
      rows,
    ) || changed;
  }

  if (changed && shouldFix) {
    writeJson(filePath, pack);
  }
  return rows;
}

const rows = listPackFiles(packsRoot).flatMap(scanPack);
fs.mkdirSync(path.dirname(csvPath), { recursive: true });
const headers = [
  "file",
  "packId",
  "section",
  "jsonPath",
  "language",
  "conceptId",
  "issueType",
  "originalValue",
  "correctedValue",
  "confidence",
  "action",
];
const csv = [
  headers.join(","),
  ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
].join("\n");
fs.writeFileSync(csvPath, `${csv}\n`);

const changedCount = rows.filter((row) => row.action === "changed").length;
const wouldChangeCount = rows.filter((row) => row.action === "would_change").length;
const manualCount = rows.filter((row) => row.action === "needs_manual_review").length;
console.log(JSON.stringify({
  packsRoot,
  csvPath,
  fix: shouldFix,
  rows: rows.length,
  changed: changedCount,
  wouldChange: wouldChangeCount,
  needsManualReview: manualCount,
}, null, 2));
