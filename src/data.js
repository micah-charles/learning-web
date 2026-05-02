/**
 * data.js — unified-only loaders
 *
 * Single loading path for all pack data.
 * Only the unified pack format is supported.
 * Legacy paths (vocabPath, sentencePath, etc.) are never loaded.
 */

const jsonCache = new Map();

async function fetchJson(path) {
  if (!jsonCache.has(path)) {
    jsonCache.set(
      path,
      fetch(path).then(async (response) => {
        if (!response.ok) throw new Error(`Failed to load ${path}: ${response.status}`);
        return response.json();
      }),
    );
  }
  return jsonCache.get(path);
}

export async function loadManifest() {
  return fetchJson("./data/generated/manifest.json");
}

// ─── Revision packs ─────────────────────────────────────────────────

export async function loadUnifiedPack(manifest, packId) {
  const pack = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);
  return fetchJson(`./${pack.unifiedPath}`);
}

export async function loadCoreUnifiedPack(manifest) {
  const path = manifest.coreUnifiedPath || "data/core_unified.json";
  return fetchJson(`./${path}`);
}

export function filterUnifiedItems(unifiedPack, type) {
  if (!unifiedPack || !Array.isArray(unifiedPack.items)) return [];
  return unifiedPack.items.filter((item) => item.type === type);
}

export async function loadUnifiedItemsByType(manifest, packId, type) {
  const pack = await loadUnifiedPack(manifest, packId);
  return filterUnifiedItems(pack, type);
}

// ─── Sentence builder ──────────────────────────────────────────────

export async function loadSentenceBuilderUnifiedPack(manifest, packId) {
  const pack = (manifest.sentenceBuilderPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.unifiedPath) throw new Error(`No unifiedPath for sentence builder pack: ${packId}`);
  return fetchJson(`./${pack.unifiedPath}`);
}

export function listSentenceBuilderPacks(manifest) {
  return manifest.sentenceBuilderPacks || [];
}

// ─── Passage packs ─────────────────────────────────────────────────

export async function loadPassageUnifiedPack(manifest, groupId) {
  const group = (manifest.passageGroups || []).find((g) => g.id === groupId);
  if (!group || !group.unifiedPath) throw new Error(`No unifiedPath for passage group: ${groupId}`);
  return fetchJson(`./${group.unifiedPath}`);
}

export function listPassageGroups(manifest) {
  return manifest.passageGroups || [];
}
