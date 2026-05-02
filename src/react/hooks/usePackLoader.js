import { useState, useEffect, useCallback } from "react";
import { normalisePack, getQuestionsForMode } from "../utils/packAdapters.js";

async function fetchJSON(url) {
  const cached = sessionStorage.getItem(url);
  if (cached) return JSON.parse(cached);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);

  const data = await res.json();
  sessionStorage.setItem(url, JSON.stringify(data));
  return data;
}

function findPackInManifest(manifest, packId) {
  if (!manifest || !packId) return null;
  const [kind, id] = packId.includes(":") ? packId.split(":", 2) : [null, packId];

  const revision = (!kind || kind === "revision")
    ? (manifest.revisionPacks || []).find((pack) => pack.id === id)
    : null;
  if (revision) return revision;

  const builder = (!kind || kind === "builder")
    ? (manifest.sentenceBuilderPacks || []).find((pack) => pack.id === id)
    : null;
  if (builder) return builder;

  const passageGroup = (!kind || kind === "passage")
    ? (manifest.passageGroups || []).find((group) => group.id === id)
    : null;
  if (passageGroup) return passageGroup;

  return null;
}

export function usePackLoader({
  url,
  manifest: manifestProp,
  packId,
  rawPack: rawPackProp,
  mode,
  count,
} = {}) {
  const [pack, setPack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [manifestData, setManifestData] = useState(manifestProp || null);
  const [tick, setTick] = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!url && !packId && !rawPackProp) {
      setPack(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        let raw = null;

        if (rawPackProp) {
          raw = rawPackProp.items && rawPackProp.byType ? null : rawPackProp;
        } else if (url) {
          raw = await fetchJSON(url);
        } else if (packId) {
          let manifest = manifestData;
          if (!manifest) {
            manifest = await fetchJSON("./data/generated/manifest.json");
            if (!cancelled) setManifestData(manifest);
          }

          const packMeta = findPackInManifest(manifest, packId);
          if (!packMeta) throw new Error(`Pack not found in manifest: ${packId}`);
          if (!packMeta.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);

          raw = await fetchJSON(`./${packMeta.unifiedPath}`);
        }

        if (cancelled) return;

        const normalised = raw ? normalisePack(raw) : rawPackProp;
        if (!normalised) throw new Error("Failed to normalise unified pack data");
        setPack(normalised);
      } catch (err) {
        if (!cancelled) {
          setPack(null);
          setError(err.message || "Failed to load pack");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [url, packId, rawPackProp, manifestData, tick]);

  const questions = pack ? getQuestionsForMode(pack, mode, { count }) : [];

  return {
    pack,
    loading,
    error,
    questions,
    manifest: manifestData,
    reload,
  };
}

export function useManifest() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchJSON("./data/generated/manifest.json")
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { manifest, loading, error };
}

export function usePackList() {
  const { manifest, loading, error } = useManifest();

  return {
    revisionPacks: manifest?.revisionPacks || [],
    sentenceBuilderPacks: manifest?.sentenceBuilderPacks || [],
    passageGroups: manifest?.passageGroups || [],
    allPacks: [
      ...(manifest?.revisionPacks || []).map((pack) => ({
        ...pack,
        packKind: "revision",
        runtimeId: `revision:${pack.id}`,
      })),
      ...(manifest?.sentenceBuilderPacks || []).map((pack) => ({
        ...pack,
        packKind: "builder",
        runtimeId: `builder:${pack.id}`,
      })),
      ...(manifest?.passageGroups || []).map((pack) => ({
        ...pack,
        packKind: "passage",
        runtimeId: `passage:${pack.id}`,
      })),
    ],
    loading,
    error,
  };
}
