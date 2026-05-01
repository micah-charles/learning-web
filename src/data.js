import { splitJsonl, uniqueBy } from "./utils.js";

const jsonCache = new Map();
const textCache = new Map();

async function fetchJson(path) {
  if (!jsonCache.has(path)) {
    jsonCache.set(
      path,
      fetch(path).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${path}`);
        }
        return response.json();
      }),
    );
  }
  return jsonCache.get(path);
}

async function fetchText(path) {
  if (!textCache.has(path)) {
    textCache.set(
      path,
      fetch(path).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load ${path}`);
        }
        return response.text();
      }),
    );
  }
  return textCache.get(path);
}

export async function loadManifest() {
  return fetchJson("./data/generated/manifest.json");
}

export function listDatasets(manifest) {
  return [manifest.core].concat(manifest.revisionPacks || []);
}

export function findDataset(manifest, datasetId) {
  const found = listDatasets(manifest).find((dataset) => dataset.id === datasetId);
  return found || manifest.core;
}

export async function loadVocabItems(manifest, datasetId) {
  const dataset = findDataset(manifest, datasetId);
  return fetchJson(`./${dataset.vocabPath}`);
}

export async function loadSentencePools(manifest, datasetId) {
  const dataset = findDataset(manifest, datasetId);
  const shouldMergeCore = dataset.id === manifest.core.id || dataset.mergeCoreSentences !== false;
  const coreSentences = shouldMergeCore && manifest.core.sentencePath
    ? splitJsonl(await fetchText(`./${manifest.core.sentencePath}`))
    : [];
  const selectedSentences = dataset.sentencePath ? splitJsonl(await fetchText(`./${dataset.sentencePath}`)) : [];
  const combined = uniqueBy([...selectedSentences, ...coreSentences], (item) => item.id);
  return {
    core: coreSentences,
    selected: selectedSentences,
    combined,
  };
}

export function listSentenceBuilderPacks(manifest) {
  return manifest.sentenceBuilderPacks || [];
}

export async function loadSentenceBuilderPack(manifest, packId) {
  const pack = listSentenceBuilderPacks(manifest).find((item) => item.id === packId);
  if (!pack) {
    throw new Error(`Unknown sentence builder pack: ${packId}`);
  }
  return splitJsonl(await fetchText(`./${pack.path}`));
}

export async function loadSequenceItems(manifest, packId) {
  const pack = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.sequencePath) return [];
  return splitJsonl(await fetchText(`./${pack.sequencePath}`));
}

export async function loadCategorySortItems(manifest, packId) {
  const pack = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.categorySortPath) return [];
  return splitJsonl(await fetchText(`./${pack.categorySortPath}`));
}

export async function loadFillBlankItems(manifest, packId) {
  const pack = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.fillBlankPath) return [];
  return splitJsonl(await fetchText(`./${pack.fillBlankPath}`));
}

export function listPassageGroups(manifest) {
  return manifest.passageGroups || [];
}

export function listPassagePacks(manifest, groupId) {
  const group = listPassageGroups(manifest).find((item) => item.id === groupId);
  return group ? group.packs || [] : [];
}

export async function loadPassagePack(manifest, groupId, packId) {
  const pack = listPassagePacks(manifest, groupId).find((item) => item.id === packId);
  if (!pack) {
    throw new Error(`Unknown passage pack: ${packId}`);
  }
  if (pack.fileType === "jsonl") {
    return splitJsonl(await fetchText(`./${pack.path}`));
  }
  const parsed = await fetchJson(`./${pack.path}`);
  return Array.isArray(parsed) ? parsed : (parsed.passages || []);
}

// ─── Unified pack loading ────────────────────────────────────────────

export async function loadUnifiedPack(manifest, packId) {
  const pack = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (!pack || !pack.unifiedPath) return null;
  try {
    return await fetchJson(`./${pack.unifiedPath}`);
  } catch (_err) {
    return null;
  }
}

export async function loadCoreUnifiedPack(manifest) {
  const path = manifest.coreUnifiedPath || "data/core_unified.json";
  try {
    return await fetchJson(`./${path}`);
  } catch (_err) {
    return null;
  }
}

export function filterUnifiedItems(unifiedPack, type) {
  if (!unifiedPack || !Array.isArray(unifiedPack.items)) return [];
  return unifiedPack.items.filter((item) => item.type === type);
}

export async function loadUnifiedItemsByType(manifest, packId, type) {
  const pack = await loadUnifiedPack(manifest, packId);
  return filterUnifiedItems(pack, type);
}
