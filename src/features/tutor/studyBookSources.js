import { datasetHasStudyBook } from "@/study-book.js";

function normalizePath(path) {
  return String(path || "").replace(/^\.\//, "");
}

export function getAllStudyBookDatasets(manifest) {
  const candidates = [
    manifest?.core,
    ...(manifest?.packs || []),
    ...(manifest?.revisionPacks || []),
    ...(manifest?.passageGroups || []),
    ...(manifest?.sentenceBuilderPacks || []),
  ].filter(Boolean);

  const seen = new Set();
  return candidates.filter((dataset) => {
    if (!datasetHasStudyBook(dataset)) return false;
    const key = `${dataset.id || ""}|${dataset.unifiedPath || dataset.passagePath || ""}|${dataset.contentMdPath || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveStudyBookSource(manifest, sourceMeta) {
  if (!manifest || !sourceMeta) return null;

  const datasets = getAllStudyBookDatasets(manifest);
  const sourcePath = normalizePath(sourceMeta.sourcePath);
  const packPath = normalizePath(sourceMeta.packPath);

  if (sourcePath) {
    for (const dataset of datasets) {
      if (normalizePath(dataset.contentMdPath) === sourcePath) {
        return { dataset, mdPath: dataset.contentMdPath, matchedBy: "contentMdPath" };
      }
      const extraFile = (dataset.extraMdFiles || []).find((file) => normalizePath(file.path) === sourcePath);
      if (extraFile) {
        return { dataset, mdPath: extraFile.path, matchedBy: "extraMdFiles" };
      }
    }
  }

  if (packPath) {
    for (const dataset of datasets) {
      if (normalizePath(dataset.unifiedPath) === packPath || normalizePath(dataset.passagePath) === packPath) {
        return {
          dataset,
          mdPath: dataset.contentMdPath || sourcePath || dataset.extraMdFiles?.[0]?.path || null,
          matchedBy: "packPath",
        };
      }
    }
  }

  if (sourceMeta.packId) {
    for (const dataset of datasets) {
      if (dataset.id === sourceMeta.packId) {
        return {
          dataset,
          mdPath: sourcePath || dataset.contentMdPath || dataset.extraMdFiles?.[0]?.path || null,
          matchedBy: "id",
        };
      }
      if (
        sourcePath &&
        sourceMeta.packId.startsWith(`${dataset.id}_`) &&
        (dataset.extraMdFiles || []).some((file) => normalizePath(file.path) === sourcePath)
      ) {
        return { dataset, mdPath: sourcePath, matchedBy: "syntheticId" };
      }
    }
  }

  return null;
}
