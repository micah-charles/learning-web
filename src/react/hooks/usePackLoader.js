/**
 * usePackLoader.js
 *
 * Reusable hook to load a learning pack by path or pack id.
 * Handles loading state, error state, and normalisation.
 *
 * Supports three loading modes:
 *  1. load by URL path  (pass `url` prop)
 *  2. load from the app manifest (pass `manifest` + `packId`)
 *  3. pass a raw pack object directly (pass `pack` prop)
 */

import { useState, useEffect, useCallback } from "react";
import { normalisePack, getQuestionsForMode } from "../utils/packAdapters.js";

// ─── Manifest-aware loader ──────────────────────────────────────────

/**
 * Fetch JSON with caching.
 */
async function fetchJSON(url) {
  const cached = sessionStorage.getItem(url);
  if (cached) return JSON.parse(cached);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  sessionStorage.setItem(url, JSON.stringify(data));
  return data;
}

/**
 * Find a pack in the manifest by id and return its unifiedPath.
 */
function findPackInManifest(manifest, packId) {
  if (!manifest || !packId) return null;
  // Try revision packs
  const rev = (manifest.revisionPacks || []).find((p) => p.id === packId);
  if (rev) return rev;
  // Try sentence builder packs
  const sb = (manifest.sentenceBuilderPacks || []).find((p) => p.id === packId);
  if (sb) return sb;
  return null;
}

// ─── Main hook ─────────────────────────────────────────────────────

/**
 * @typedef {Object} UsePackLoaderOptions
 * @property {string}   [url]         - direct URL to a pack JSON file
 * @property {object}   [manifest]   - loaded manifest (required for packId mode)
 * @property {string}   [packId]      - pack id (requires manifest)
 * @property {object}   [rawPack]     - pass a raw pack object directly
 * @property {string}   [mode]        - game mode to normalise questions for: "mcq"|"typing"|"flashcard"|"sequence"|"sort"|"gap"|"passage"
 * @property {number}   [count]       - max questions to return (default: all)
 */

/**
 * @returns {{
 *   pack: object|null,
 *   loading: boolean,
 *   error: string|null,
 *   questions: Array,
 *   manifest: object|null,
 *   reload: () => void
 * }}
 */
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
      setError("usePackLoader: provide url, packId, or rawPack");
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
          // Mode 3: raw pack object passed directly
          raw = rawPackProp;
        } else if (url) {
          // Mode 1: load by URL
          raw = await fetchJSON(url);
        } else if (packId) {
          // Mode 2: load from manifest
          let man = manifestData;
          if (!man) {
            man = await fetchJSON("./data/generated/manifest.json");
            if (!cancelled) setManifestData(man);
          }
          const packMeta = findPackInManifest(man, packId);
          if (!packMeta) throw new Error(`Pack not found in manifest: ${packId}`);
          if (!packMeta.unifiedPath) throw new Error(`No unifiedPath for pack: ${packId}`);
          raw = await fetchJSON(`./${packMeta.unifiedPath}`);
        }

        if (cancelled) return;

        const normalised = normalisePack(raw);
        if (!normalised) throw new Error("Failed to normalise pack data");
        setPack(normalised);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load pack");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [url, packId, rawPackProp, tick]);

  // Derive questions filtered by game mode
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

// ─── Convenience: load manifest ──────────────────────────────────

export function useManifest() {
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("./data/generated/manifest.json")
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setManifest(data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { manifest, loading, error };
}

// ─── Convenience: load a pack list from manifest ──────────────────

export function usePackList() {
  const { manifest, loading, error } = useManifest();

  const revisionPacks = manifest?.revisionPacks || [];
  const sentenceBuilderPacks = manifest?.sentenceBuilderPacks || [];
  const passageGroups = manifest?.passageGroups || [];

  return {
    revisionPacks,
    sentenceBuilderPacks,
    passageGroups,
    loading,
    error,
  };
}