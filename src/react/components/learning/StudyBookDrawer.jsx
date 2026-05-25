/**
 * StudyBookDrawer — React port of the vanilla Study Book drawer.
 *
 * Renders once at App level (not inside individual page components) so it
 * persists while the user navigates between tabs.  Reads all state from
 * StudyBookContext and never manages its own content state.
 *
 * CSS reuses the shared .study-book-drawer / .sb-* classes from styles.css.
 * Split-mode adds body class "sb-split-mode" so .lw-app gets margin-right.
 */
import { useEffect, useRef, useCallback } from "react";
import { highlightMatches } from "@/study-book.js";
import { useStudyBook } from "../../context/StudyBookContext.jsx";

// ── Split-mode body class management ──────────────────────────────────────────
function useSplitMode(splitMode, drawerRef) {
  useEffect(() => {
    document.body.classList.toggle("sb-split-mode", splitMode);
    if (splitMode && drawerRef.current) {
      const w = drawerRef.current.offsetWidth;
      document.querySelector(".lw-app")?.style.setProperty("padding-right", `${w}px`);
    } else {
      document.querySelector(".lw-app")?.style.removeProperty("padding-right");
    }
    return () => {
      document.body.classList.remove("sb-split-mode");
      document.querySelector(".lw-app")?.style.removeProperty("padding-right");
    };
  }, [splitMode]);
}

// ── Drag-to-resize the drawer ─────────────────────────────────────────────────
function useResizeHandle(handleRef, drawerRef, splitMode) {
  useEffect(() => {
    const handle = handleRef.current;
    const drawer = drawerRef.current;
    if (!handle || !drawer) return;

    const onMouseDown = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = drawer.offsetWidth;

      const onMove = (ev) => {
        const delta = startX - ev.clientX;
        const newW = Math.max(280, Math.min(820, startWidth + delta));
        drawer.style.width = `${newW}px`;
        // Keep split-mode push in sync with dragged width
        if (document.body.classList.contains("sb-split-mode")) {
          document.querySelector(".lw-app")?.style.setProperty("padding-right", `${newW}px`);
        }
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    };

    handle.addEventListener("mousedown", onMouseDown);
    return () => handle.removeEventListener("mousedown", onMouseDown);
  }, [splitMode]); // re-attach when splitMode changes so the push logic is fresh
}

// ── Scroll-tracking: update currentAnchor from headings in the content ────────
function useScrollAnchorTracker(open, toc, contentRef, setCurrentAnchor) {
  useEffect(() => {
    if (!open || !toc.length || !contentRef.current) return;
    const el = contentRef.current;
    const handler = () => {
      const headings = [...el.querySelectorAll("h1[id],h2[id],h3[id]")];
      let active = headings[0]?.id || null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= el.getBoundingClientRect().top + 60) {
          active = h.id;
        }
      }
      if (active) setCurrentAnchor(active);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [open, toc, setCurrentAnchor]);
}

// ── Highlight + match-count sync ──────────────────────────────────────────────
function useHighlightedHtml(html, searchQuery, setSearchMatchCount) {
  const result = searchQuery.trim().length >= 2
    ? highlightMatches(html, searchQuery)
    : { html, count: 0 };

  useEffect(() => {
    setSearchMatchCount(result.count);
  }, [result.count, setSearchMatchCount]);

  return result.html;
}

// ── Scroll to search match ────────────────────────────────────────────────────
function useScrollToMatch(contentRef, searchMatchIndex, searchQuery, searchMatchCount) {
  useEffect(() => {
    if (!searchQuery || searchMatchCount === 0 || !contentRef.current) return;
    const marks = contentRef.current.querySelectorAll("mark.sb-highlight");
    const target = marks[searchMatchIndex];
    if (target) target.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [searchMatchIndex, searchMatchCount, searchQuery]);
}

// ── Scroll to anchor ──────────────────────────────────────────────────────────
function useScrollToAnchor(contentRef, currentAnchor, open, html) {
  const prevAnchorRef = useRef(null);
  useEffect(() => {
    if (!open || !currentAnchor || !contentRef.current) return;
    if (currentAnchor === prevAnchorRef.current) return;
    prevAnchorRef.current = currentAnchor;
    const el = contentRef.current.querySelector(`#${CSS.escape(currentAnchor)}`);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [open, currentAnchor, html]);
}

// ── Keyboard: Escape to close ─────────────────────────────────────────────────
function useEscapeClose(open, closeBook) {
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") closeBook(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeBook]);
}

// ── TOC ───────────────────────────────────────────────────────────────────────
function TOC({ toc, currentAnchor, onJump }) {
  if (!toc.length) return null;
  return (
    <nav className="sb-toc" aria-label="Table of contents">
      <p className="sb-toc-title">Contents</p>
      <ul className="sb-toc-list">
        {toc.map((entry, index) => (
          <li key={`${entry.anchor}-${index}`} className={`sb-toc-h${entry.level}${entry.anchor === currentAnchor ? " sb-toc-active" : ""}`}>
            <a
              href={`#${entry.anchor}`}
              onClick={(e) => { e.preventDefault(); onJump(entry.anchor); }}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export function StudyBookDrawer() {
  const {
    open, loading, html, toc, files, activeFile, datasetId,
    searchQuery, searchMatchIndex, searchMatchCount,
    currentAnchor, splitMode,
    closeBook, toggleSplit, switchFile,
    setSearchQuery, navigateMatch,
    setSearchMatchCount, setCurrentAnchor, saveScrollTop,
  } = useStudyBook();

  const contentRef = useRef(null);
  const drawerRef  = useRef(null);
  const handleRef  = useRef(null);

  useSplitMode(splitMode, drawerRef);
  useResizeHandle(handleRef, drawerRef, splitMode);
  useScrollAnchorTracker(open, toc, contentRef, setCurrentAnchor);
  useEscapeClose(open, closeBook);

  const highlightedHtml = useHighlightedHtml(html, searchQuery, setSearchMatchCount);
  useScrollToMatch(contentRef, searchMatchIndex, searchQuery, searchMatchCount);
  useScrollToAnchor(contentRef, currentAnchor, open, html);

  // Restore scroll position when reopening the same content
  useEffect(() => {
    if (open && contentRef.current && !loading) {
      // small delay to let the DOM paint first
      const id = setTimeout(() => {
        if (contentRef.current) contentRef.current.scrollTop = 0;
      }, 50);
      return () => clearTimeout(id);
    }
  }, [open, datasetId, activeFile]);

  // Save scroll position on scroll
  const handleContentScroll = useCallback((e) => {
    saveScrollTop(e.target.scrollTop);
  }, [saveScrollTop]);

  const handleJumpToAnchor = useCallback((anchor) => {
    setCurrentAnchor(anchor);
    const el = contentRef.current?.querySelector(`#${CSS.escape(anchor)}`);
    if (el) el.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [setCurrentAnchor]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateMatch(e.shiftKey ? -1 : 1);
    }
  }, [navigateMatch]);

  return (
    <>
      {/* Drawer */}
      <aside
        className="study-book-drawer"
        data-open={open ? "true" : "false"}
        role="complementary"
        aria-label="Study Book"
        aria-hidden={!open}
        ref={drawerRef}
      >
        {/* Drag handle on the left edge — mirrors vanilla .sb-resize-handle */}
        <div ref={handleRef} className="sb-resize-handle" aria-hidden="true" />
        {/* Header */}
        <div className="sb-header">
          <span className="sb-title">📖 Study Book</span>
          <div className="sb-header-actions">
            {/* File tabs */}
            {files.length > 1 && (
              <div className="sb-file-tabs">
                {files.map((f) => (
                  <button
                    key={f.path}
                    className={`sb-file-tab${f.path === activeFile ? " active" : ""}`}
                    onClick={() => switchFile({ id: datasetId }, f.path)}
                    type="button"
                  >
                    {f.title}
                  </button>
                ))}
              </div>
            )}
            <button
              className="sb-split-btn"
              type="button"
              title="Toggle split view"
              aria-label="Toggle split view"
              onClick={toggleSplit}
            >
              ⬖
            </button>
            <button
              className="sb-close"
              type="button"
              aria-label="Close Study Book"
              onClick={closeBook}
              autoFocus={open}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="sb-search-bar">
          <input
            className="sb-search-input"
            type="search"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            aria-label="Search study notes"
          />
          {searchQuery.trim().length >= 2 && searchMatchCount > 0 && (
            <>
              <span className="sb-search-count">{searchMatchIndex + 1} / {searchMatchCount}</span>
              <button className="sb-search-nav" onClick={() => navigateMatch(-1)} aria-label="Previous match" type="button">↑</button>
              <button className="sb-search-nav" onClick={() => navigateMatch(1)}  aria-label="Next match"     type="button">↓</button>
            </>
          )}
          {searchQuery.trim().length >= 2 && searchMatchCount === 0 && (
            <span className="sb-search-count sb-search-none">no matches</span>
          )}
        </div>

        {/* Inner: TOC + content */}
        <div className="sb-inner">
          <TOC toc={toc} currentAnchor={currentAnchor} onJump={handleJumpToAnchor} />
          <div
            className="sb-content"
            id="sb-content-area"
            tabIndex={0}
            ref={contentRef}
            onScroll={handleContentScroll}
          >
            {loading
              ? <p style={{ padding: "24px 18px", color: "var(--muted)", fontSize: "0.9rem" }}>Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            }
          </div>
        </div>
      </aside>

      {/* Scrim (closes drawer on mobile tap) */}
      {open && (
        <div
          className="sb-scrim"
          onClick={closeBook}
          aria-hidden="true"
        />
      )}
    </>
  );
}

// ── Trigger button — drop this anywhere a page knows its dataset ───────────────
export function StudyBookButton({ dataset, anchor = "", mdPath = "", label = "Study Book" }) {
  const { openBook } = useStudyBook();
  const hasBook = dataset?.contentMdPath || dataset?.extraMdFiles?.length;
  if (!hasBook) return null;
  return (
    <button
      className="lw-btn lw-btn-ghost"
      type="button"
      style={{ fontSize: "0.85rem", padding: "5px 12px", gap: "5px", display: "inline-flex", alignItems: "center" }}
      onClick={() => openBook(dataset, { anchor: anchor || undefined, mdPath: mdPath || undefined })}
      title="Open Study Book"
    >
      📖 {label}
    </button>
  );
}
