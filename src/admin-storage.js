/**
 * admin-storage.js
 *
 * Client-side admin storage for user-uploaded pack JSON files.
 *
 * Architecture:
 *   - Metadata list stored in localStorage under META_KEY (fast to enumerate)
 *   - Full pack blobs stored individually under DATA_KEY_PREFIX + id
 *   - hydrateManifest() injects saved packs into the live manifest object and
 *     pre-populates the data.js fetchJson cache so all game-mode loaders work
 *     without any network requests or changes to the loaders themselves.
 */

const META_KEY        = "learningWeb.uploadedPacks.meta";
const DATA_KEY_PREFIX = "learningWeb.uploadedPack.";

// Item types the unified-pack schema defines.
const KNOWN_ITEM_TYPES = new Set([
  "vocab", "sentence", "sequence", "categorySort",
  "fillBlank", "sentenceBuilder", "passage",
]);

// Sentinel URL prefix — pre-filled into the fetchJson cache instead of fetched.
export const UPLOADED_PATH_PREFIX = "uploaded://";

// ─── Schema validation ────────────────────────────────────────────────────────

/**
 * Returns { ok: true, typeCounts } or { ok: false, error }.
 * typeCounts is { [itemType]: count }.
 */
export function validatePack(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, error: "File must be a JSON object, not an array or primitive." };
  }
  if (!Array.isArray(data.items)) {
    return { ok: false, error: 'Missing required field "items" (must be an array).' };
  }
  if (data.items.length === 0) {
    return { ok: false, error: '"items" array is empty — nothing to load.' };
  }

  const typeCounts = {};
  for (const item of data.items) {
    const t = item && item.type;
    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
  }

  const knownFound = Object.keys(typeCounts).filter((t) => KNOWN_ITEM_TYPES.has(t));
  if (knownFound.length === 0) {
    return {
      ok: false,
      error:
        `No recognised item types found in "items". ` +
        `Expected at least one of: ${[...KNOWN_ITEM_TYPES].join(", ")}.`,
    };
  }

  return { ok: true, typeCounts };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function derivePackId(data, filename) {
  if (data.packId && typeof data.packId === "string") return data.packId.trim();
  if (data.id    && typeof data.id    === "string") return data.id.trim();
  return (filename || "uploaded_pack")
    .replace(/\.json$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);
}

function deriveDisplayName(data, packId) {
  return (
    data.title       ||
    data.displayName ||
    data.packTitle   ||
    packId.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Which manifest arrays this pack belongs in, based on item types present. */
function resolveManifestSections(typeCounts) {
  const sections = [];
  const hasRevision =
    typeCounts.vocab    || typeCounts.sentence   ||
    typeCounts.sequence || typeCounts.categorySort ||
    typeCounts.fillBlank;
  if (hasRevision)           sections.push("revisionPacks");
  if (typeCounts.passage)    sections.push("passageGroups");
  if (typeCounts.sentenceBuilder) sections.push("sentenceBuilderPacks");
  return sections;
}

// ─── localStorage I/O ─────────────────────────────────────────────────────────

function loadMeta() {
  try {
    const raw = window.localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMeta(meta) {
  window.localStorage.setItem(META_KEY, JSON.stringify(meta));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Returns array of metadata objects (does not parse pack blobs). */
export function listUploadedPacks() {
  return loadMeta();
}

/** Returns the full pack JSON for a given id, or null if not found. */
export function getUploadedPackData(id) {
  try {
    const raw = window.localStorage.getItem(DATA_KEY_PREFIX + id);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Validates and saves a pack.
 * @param {object} packData  Parsed JSON from the uploaded file.
 * @param {string} filename  Original filename (used for id fallback).
 * @returns {{ ok: boolean, error?: string, entry?: object }}
 */
export function saveUploadedPack(packData, filename) {
  const validation = validatePack(packData);
  if (!validation.ok) return { ok: false, error: validation.error };

  const id          = derivePackId(packData, filename);
  const displayName = deriveDisplayName(packData, id);
  const sections    = resolveManifestSections(validation.typeCounts);

  // Guard: must map to at least one section
  if (!sections.length) {
    return { ok: false, error: "No known manifest section matches item types in this pack." };
  }

  // Persist blob
  const serialised = JSON.stringify(packData);
  try {
    window.localStorage.setItem(DATA_KEY_PREFIX + id, serialised);
  } catch (e) {
    return {
      ok: false,
      error: `Browser storage is full. Delete an existing pack first. (${e.message})`,
    };
  }

  // Update meta list (replace if same id)
  const entry = {
    id,
    displayName,
    subject:             packData.subject             || "",
    curriculum:          packData.curriculum          || "",
    typeCounts:          validation.typeCounts,
    sections,
    itemCount:           packData.items.length,
    sizeBytes:           serialised.length,
    addedAt:             new Date().toISOString(),
    sourceLanguageCode:  packData.sourceLanguageCode  || "",
    targetLanguageCode:  packData.targetLanguageCode  || "",
    sourceLanguageLabel: packData.sourceLanguageLabel || "",
    targetLanguageLabel: packData.targetLanguageLabel || "",
  };
  const meta = loadMeta().filter((m) => m.id !== id);
  meta.push(entry);
  saveMeta(meta);

  return { ok: true, entry };
}

/** Removes pack data and metadata for the given id. */
export function deleteUploadedPack(id) {
  window.localStorage.removeItem(DATA_KEY_PREFIX + id);
  saveMeta(loadMeta().filter((m) => m.id !== id));
}

// ─── Manifest hydration ───────────────────────────────────────────────────────

/**
 * Call once after loadManifest().
 *
 * For each saved pack this function:
 *   1. Calls registerInCache(path, packData) so that data.js's fetchJson()
 *      returns the blob from memory instead of attempting a network fetch.
 *   2. Injects a descriptor into each applicable manifest array
 *      (revisionPacks, passageGroups, sentenceBuilderPacks).
 *
 * @param {object}   manifest        Live manifest object — mutated in place.
 * @param {function} registerInCache data.js registerPackInCache function.
 */
export function hydrateManifest(manifest, registerInCache) {
  const metaList = listUploadedPacks();

  for (const entry of metaList) {
    const packData = getUploadedPackData(entry.id);
    if (!packData) continue; // blob was lost (e.g. storage cleared manually)

    const path = UPLOADED_PATH_PREFIX + entry.id;
    registerInCache(path, packData);

    if (entry.sections.includes("revisionPacks")) {
      manifest.revisionPacks = (manifest.revisionPacks || []).filter(
        (p) => p.id !== entry.id,
      );
      manifest.revisionPacks.push({
        id:                  entry.id,
        displayName:         entry.displayName,
        unifiedPath:         path,
        subject:             entry.subject,
        curriculum:          entry.curriculum || "",
        wordCount:           entry.typeCounts.vocab      || 0,
        sentenceCount:       entry.typeCounts.sentence   || 0,
        supportsSentences:   !!(entry.typeCounts.sentence),
        mergeCoreSentences:  false,
        stageOptions:        packData.stageOptions       || [],
        defaultQuizModes:    packData.defaultQuizModes   || [],
        sourceLanguageCode:  entry.sourceLanguageCode,
        targetLanguageCode:  entry.targetLanguageCode,
        sourceLanguageLabel: entry.sourceLanguageLabel,
        targetLanguageLabel: entry.targetLanguageLabel,
        _uploaded: true,
      });
    }

    if (entry.sections.includes("passageGroups")) {
      manifest.passageGroups = (manifest.passageGroups || []).filter(
        (p) => p.id !== entry.id,
      );
      manifest.passageGroups.push({
        id:          entry.id,
        displayName: entry.displayName,
        unifiedPath: path,
        subject:     entry.subject,
        curriculum:  entry.curriculum || "",
        _uploaded:   true,
      });
    }

    if (entry.sections.includes("sentenceBuilderPacks")) {
      manifest.sentenceBuilderPacks = (manifest.sentenceBuilderPacks || []).filter(
        (p) => p.id !== entry.id,
      );
      manifest.sentenceBuilderPacks.push({
        id:          entry.id,
        displayName: entry.displayName,
        subject:     entry.subject,
        curriculum:  entry.curriculum || "",
        unifiedPath: path,
        _uploaded:   true,
      });
    }
  }
}
