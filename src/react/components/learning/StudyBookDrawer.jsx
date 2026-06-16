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
import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
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

function useDrawerWidthVars(open, drawerRef) {
  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer || typeof document === "undefined") return;

    const root = document.documentElement;
    const update = () => {
      const width = drawer.offsetWidth || 0;
      root.style.setProperty("--study-book-drawer-width", `${width}px`);
      root.style.setProperty("--study-book-drawer-offset", open ? `${width + 20}px` : "0px");
    };

    update();

    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(update) : null;
    observer?.observe(drawer);

    return () => {
      observer?.disconnect();
      if (!open) {
        root.style.setProperty("--study-book-drawer-offset", "0px");
      }
    };
  }, [open, drawerRef]);
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
function useScrollAnchorTracker(open, toc, contentRef, setCurrentAnchor, anchorJumpRef) {
  useEffect(() => {
    if (!open || !toc.length || !contentRef.current) return;
    const el = contentRef.current;
    const handler = () => {
      if (anchorJumpRef.current) return;
      const headings = [...el.querySelectorAll("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]")];
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
  }, [open, toc, setCurrentAnchor, anchorJumpRef]);
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
function useScrollToAnchor(contentRef, currentAnchor, open, html, activeFile, anchorJumpRef) {
  const prevAnchorRef = useRef("");
  useLayoutEffect(() => {
    if (!open || !currentAnchor || !contentRef.current) return;
    const anchorKey = `${activeFile || ""}::${currentAnchor}`;
    if (anchorKey === prevAnchorRef.current) return;
    prevAnchorRef.current = anchorKey;
    const el = contentRef.current.querySelector(`#${CSS.escape(currentAnchor)}`);
    if (el) {
      anchorJumpRef.current = currentAnchor;
      el.classList.remove("sb-anchor-flash");
      void el.offsetWidth;
      el.classList.add("sb-anchor-flash");
      const contentTop = contentRef.current.getBoundingClientRect().top;
      const targetTop = Math.max(
        0,
        contentRef.current.scrollTop + el.getBoundingClientRect().top - contentTop - 16,
      );
      const previousScrollBehavior = contentRef.current.style.scrollBehavior;
      contentRef.current.style.scrollBehavior = "auto";
      contentRef.current.scrollTop = targetTop;
      window.requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.style.scrollBehavior = previousScrollBehavior;
        }
      });
      const clearJump = window.setTimeout(() => {
        if (anchorJumpRef.current === currentAnchor) {
          anchorJumpRef.current = null;
        }
      }, 300);
      return () => window.clearTimeout(clearJump);
    }
  }, [open, currentAnchor, html, activeFile, anchorJumpRef]);
}

// ── Keyboard: Escape to close ─────────────────────────────────────────────────
function useEscapeClose(open, closeBook, disabled = false) {
  useEffect(() => {
    if (!open || disabled) return;
    const handler = (e) => { if (e.key === "Escape") closeBook(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, closeBook, disabled]);
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
    currentAnchor, splitMode, scrollTop, notice,
    closeBook, toggleSplit, switchFile,
    setSearchQuery, navigateMatch,
    setSearchMatchCount, setCurrentAnchor, saveScrollTop, setNotice,
  } = useStudyBook();

  const contentRef = useRef(null);
  const drawerRef  = useRef(null);
  const handleRef  = useRef(null);
  const anchorJumpRef = useRef(null);
  const [lightboxImage, setLightboxImage] = useState(null);

  useSplitMode(splitMode, drawerRef);
  useDrawerWidthVars(open, drawerRef);
  useResizeHandle(handleRef, drawerRef, splitMode);
  useScrollAnchorTracker(open, toc, contentRef, setCurrentAnchor, anchorJumpRef);
  useEscapeClose(open, closeBook, !!lightboxImage);

  const highlightedHtml = useHighlightedHtml(html, searchQuery, setSearchMatchCount);
  useScrollToMatch(contentRef, searchMatchIndex, searchQuery, searchMatchCount);
  useScrollToAnchor(contentRef, currentAnchor, open, html, activeFile, anchorJumpRef);

  // Restore scroll position when reopening the same content
  useEffect(() => {
    if (open && contentRef.current && !loading) {
      // small delay to let the DOM paint first
      const id = setTimeout(() => {
        if (contentRef.current && !currentAnchor) {
          contentRef.current.scrollTop = scrollTop || 0;
        }
      }, 50);
      return () => clearTimeout(id);
    }
  }, [open, datasetId, activeFile, loading, currentAnchor, scrollTop]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 4200);
    return () => clearTimeout(id);
  }, [notice, setNotice]);

  useEffect(() => {
    if (!lightboxImage) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") setLightboxImage(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [lightboxImage]);

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

  const handleContentClick = useCallback((event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement) || !target.classList.contains("sb-markdown-image")) {
      return;
    }
    setLightboxImage({
      src: target.currentSrc || target.src,
      alt: target.alt || "Study book image",
    });
  }, []);

  return (
    <>
      {/* Drawer */}
      <aside
        className="study-book-drawer"
        data-testid="studybook-drawer"
        data-open={open ? "true" : "false"}
        data-dataset-id={datasetId || ""}
        data-active-file={activeFile || ""}
        data-current-anchor={currentAnchor || ""}
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
              data-testid="studybook-split-button"
              title="Toggle split view"
              aria-label="Toggle split view"
              onClick={toggleSplit}
            >
              ⬖
            </button>
            <button
              className="sb-close"
              type="button"
              data-testid="studybook-close-button"
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
            data-testid="studybook-search-input"
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

        {notice && (
          <div className="sb-notice" role="status" aria-live="polite">
            {notice}
          </div>
        )}

        {/* Inner: TOC + content */}
        <div className="sb-inner">
          <TOC toc={toc} currentAnchor={currentAnchor} onJump={handleJumpToAnchor} />
          <div
            className="sb-content"
            data-testid="studybook-content"
            id="sb-content-area"
            tabIndex={0}
            ref={contentRef}
            onScroll={handleContentScroll}
            onClick={handleContentClick}
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

      {lightboxImage && (
        <div
          className="sb-image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.alt}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLightboxImage(null);
          }}
        >
          <button
            type="button"
            className="sb-image-lightbox-close"
            onClick={() => setLightboxImage(null)}
            aria-label="Close image"
          >
            ×
          </button>
          <img src={lightboxImage.src} alt={lightboxImage.alt} />
        </div>
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
      data-testid="studybook-open-button"
      type="button"
      style={{ fontSize: "0.85rem", padding: "5px 12px", gap: "5px", display: "inline-flex", alignItems: "center" }}
      onClick={() => openBook(dataset, { anchor: anchor || undefined, mdPath: mdPath || undefined })}
      title="Open Study Book"
    >
      📖 {label}
    </button>
  );
}
