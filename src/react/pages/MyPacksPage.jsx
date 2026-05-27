/**
 * MyPacksPage.jsx
 *
 * "My Packs" tab — upload custom JSON pack files, view and delete them.
 * Uses admin-storage.js for localStorage-backed pack management.
 * Supports single .json files and .zip bundles containing multiple packs.
 */
import { useState, useRef, useCallback } from "react";
import {
  listUploadedPacks,
  saveUploadedPack,
  deleteUploadedPack,
  validatePack,
} from "@/admin-storage.js";
import { useManifest } from "../context/ManifestContext.jsx";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function processFile(file) {
  const ext = file.name.split(".").pop().toLowerCase();

  if (ext === "json") {
    const text = await file.text();
    let data;
    try { data = JSON.parse(text); }
    catch { return [{ ok: false, filename: file.name, error: "Invalid JSON." }]; }
    const validation = validatePack(data);
    if (!validation.ok) return [{ ok: false, filename: file.name, error: validation.error }];
    const entry = saveUploadedPack(data, file.name);
    return [{ ok: true, filename: file.name, entry }];
  }

  if (ext === "zip") {
    // Lazy-load fflate for ZIP support
    let fflate;
    try {
      fflate = await import("https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js");
    } catch {
      return [{ ok: false, filename: file.name, error: "Could not load ZIP library (fflate)." }];
    }
    const buf = await file.arrayBuffer();
    let unzipped;
    try {
      unzipped = fflate.unzipSync(new Uint8Array(buf));
    } catch {
      return [{ ok: false, filename: file.name, error: "Could not extract ZIP." }];
    }
    const results = [];
    for (const [name, bytes] of Object.entries(unzipped)) {
      if (!name.endsWith(".json")) continue;
      const text = new TextDecoder().decode(bytes);
      let data;
      try { data = JSON.parse(text); }
      catch { results.push({ ok: false, filename: name, error: "Invalid JSON." }); continue; }
      const validation = validatePack(data);
      if (!validation.ok) { results.push({ ok: false, filename: name, error: validation.error }); continue; }
      const entry = saveUploadedPack(data, name);
      results.push({ ok: true, filename: name, entry });
    }
    return results.length ? results : [{ ok: false, filename: file.name, error: "No JSON files found in ZIP." }];
  }

  return [{ ok: false, filename: file.name, error: "Unsupported file type. Use .json or .zip." }];
}

// ─── PackRow ─────────────────────────────────────────────────────────────────

function PackRow({ pack, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 14px",
        borderRadius: "8px",
        border: "1.5px solid var(--lw-line)",
        background: "var(--lw-panel)",
        marginBottom: "8px",
        gap: "10px",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontWeight: 600, color: "var(--lw-ink)", fontSize: "0.92rem" }}>
          {pack.displayName || pack.id}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
          {pack.subject && <span className="lw-chip blue">{pack.subject}</span>}
          {pack.wordCount > 0 && <span className="lw-chip">{pack.wordCount} words</span>}
          {pack.sizeBytes && <span className="lw-chip">{formatBytes(pack.sizeBytes)}</span>}
        </div>
      </div>
      {confirming ? (
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            className="lw-btn lw-btn-ghost"
            style={{ fontSize: "0.82rem", color: "var(--lw-coral)" }}
            type="button"
            onClick={() => { onDelete(pack.id); setConfirming(false); }}
          >
            Yes, delete
          </button>
          <button
            className="lw-btn lw-btn-ghost"
            style={{ fontSize: "0.82rem" }}
            type="button"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="lw-btn lw-btn-ghost"
          style={{ fontSize: "0.82rem" }}
          type="button"
          onClick={() => setConfirming(true)}
        >
          Remove
        </button>
      )}
    </div>
  );
}

// ─── MyPacksPage ──────────────────────────────────────────────────────────────

export default function MyPacksPage({ onNavigate }) {
  const { rehydrate } = useManifest();
  const fileInputRef = useRef(null);
  const [packs, setPacks]       = useState(() => listUploadedPacks());
  const [results, setResults]   = useState(null); // upload results
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging]  = useState(false);

  function refresh() { setPacks(listUploadedPacks()); }

  function handleDelete(id) {
    deleteUploadedPack(id);
    refresh();
    rehydrate(); // remove pack from live manifest too
  }

  const handleFiles = useCallback(async (files) => {
    if (!files.length) return;
    setUploading(true);
    setResults(null);
    const allResults = [];
    for (const file of Array.from(files)) {
      const res = await processFile(file);
      allResults.push(...res);
    }
    setResults(allResults);
    setUploading(false);
    refresh();
    rehydrate(); // inject newly saved packs into the live manifest
  }, [rehydrate]);

  function handleFileInput(e) {
    handleFiles(e.target.files);
    e.target.value = "";
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  const successCount = (results || []).filter((r) => r.ok).length;
  const failCount    = (results || []).filter((r) => !r.ok).length;

  return (
    <div className="lw-page">
      <div className="lw-card" style={{ marginBottom: "20px" }}>
        <h2 className="lw-section-title">My Packs</h2>
        <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem", marginBottom: "16px" }}>
          Upload your own pack JSON files to use them in Quiz, Vocabulary, and Review.
          Packs are stored only in this browser — nothing is sent to a server.
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "var(--lw-teal)" : "var(--lw-line)"}`,
            borderRadius: "12px",
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragging ? "rgba(80,165,160,0.04)" : "transparent",
            transition: "border-color 0.2s, background 0.2s",
            marginBottom: "14px",
          }}
        >
          <p style={{ fontWeight: 600, color: "var(--lw-ink)", marginBottom: "4px" }}>
            {uploading ? "Processing…" : "Drop files here, or click to browse"}
          </p>
          <p style={{ color: "var(--lw-muted)", fontSize: "0.82rem" }}>
            Accepts <code>.json</code> (single pack) or <code>.zip</code> (bundle of JSON files)
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.zip,application/json,application/zip"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* Upload results */}
        {results && (
          <div style={{ marginBottom: "12px" }}>
            {successCount > 0 && (
              <p style={{ color: "var(--lw-green)", fontWeight: 600, fontSize: "0.9rem", marginBottom: "4px" }}>
                ✓ {successCount} pack{successCount > 1 ? "s" : ""} uploaded successfully.
              </p>
            )}
            {failCount > 0 && (
              <div>
                {results.filter((r) => !r.ok).map((r, i) => (
                  <p key={i} style={{ color: "var(--lw-coral)", fontSize: "0.85rem", marginBottom: "2px" }}>
                    ✗ <strong>{r.filename}</strong>: {r.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="lw-card">
        <h2 className="lw-section-title">Uploaded Packs ({packs.length})</h2>
        {packs.length === 0 ? (
          <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem" }}>
            No custom packs uploaded yet. Use the uploader above to add your own JSON packs.
          </p>
        ) : (
          packs.map((pack) => (
            <PackRow key={pack.id} pack={pack} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* ── AI Prompt Builder ───────────────────────────────────────────── */}
      <div className="lw-card mp-ai-card">
        <div className="mp-ai-card-inner">
          <div className="mp-ai-card-icon" aria-hidden="true">✦</div>
          <div className="mp-ai-card-body">
            <h2 className="lw-section-title" style={{ marginBottom: 4 }}>
              AI Prompt Builder
            </h2>
            <p style={{ color: "var(--lw-muted)", fontSize: "0.88rem", marginBottom: 14 }}>
              Build optimised pack-generation prompts using local Chrome AI, then paste into
              ChatGPT, Codex, or Claude to generate your <code>pack_unified.json</code>.
              Everything stays in your browser — nothing is sent to a server.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <button
                className="lw-btn lw-btn--primary"
                type="button"
                onClick={() => onNavigate?.("ai-prompt")}
              >
                Open AI Prompt Builder →
              </button>
              <span className="lw-chip blue" style={{ fontSize: "0.75rem" }}>Local only</span>
              <span className="lw-chip" style={{ fontSize: "0.75rem" }}>No backend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
