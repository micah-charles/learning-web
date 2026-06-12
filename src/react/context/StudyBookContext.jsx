/**
 * StudyBookContext — global state for the Study Book drawer.
 *
 * Provides openBook(dataset, opts), closeBook(), and all drawer state
 * to any component in the tree.  The drawer itself is rendered once at
 * App level so it persists across tab switches.
 */
import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import {
  loadMarkdownFile, renderMarkdown, extractTOC,
  datasetHasStudyBook, getStudyBookFiles,
} from "@/study-book.js";
import { MISSING_ANCHOR_NOTICE, resolveStudyBookAnchor } from "./studyBookAnchorState.js";

const INITIAL_STATE = {
  open: false,
  loading: false,
  datasetId: null,
  activeFile: null,
  files: [],
  rawMarkdown: "",
  html: "",
  toc: [],
  searchQuery: "",
  searchMatchIndex: 0,
  searchMatchCount: 0,
  currentAnchor: null,
  scrollTop: 0,
  splitMode: false,
  notice: null,
};

const Ctx = createContext(null);

export function StudyBookProvider({ children }) {
  const [state, setState] = useState(INITIAL_STATE);
  // Ref mirrors state so async callbacks never close over stale values.
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; });

  const openBook = useCallback(async (dataset, { anchor = null, mdPath = null } = {}) => {
    if (!datasetHasStudyBook(dataset)) return;
    const files = getStudyBookFiles(dataset);
    const targetPath = mdPath || files[0].path;
    const prev = stateRef.current;

    // Re-use cached content when dataset + file haven't changed.
    if (prev.datasetId === dataset.id && prev.activeFile === targetPath && prev.html) {
      const anchorState = !anchor
        ? { anchorFound: true, anchor: anchor || prev.currentAnchor || prev.toc[0]?.anchor || null }
        : resolveStudyBookAnchor(prev.rawMarkdown || "", prev.toc || [], anchor);
      setState(p => ({
        ...p, open: true,
        currentAnchor: anchorState.anchorFound
          ? (anchor || p.currentAnchor || p.toc[0]?.anchor || null)
          : (p.toc[0]?.anchor || null),
        notice: anchorState.anchorFound ? null : MISSING_ANCHOR_NOTICE,
      }));
      return { anchorFound: anchorState.anchorFound };
    }

    setState(p => ({ ...p, open: true, loading: true }));
    try {
      const raw = await loadMarkdownFile(targetPath);
      const toc = extractTOC(raw);
      const html = renderMarkdown(raw);
      const anchorState = resolveStudyBookAnchor(raw, toc, anchor);
      setState(p => ({
        ...p,
        loading: false,
        datasetId: dataset.id,
        activeFile: targetPath,
        files,
        rawMarkdown: raw,
        html,
        toc,
        searchQuery: "",
        searchMatchIndex: 0,
        searchMatchCount: 0,
        currentAnchor: anchorState.anchor,
        scrollTop: 0,
        notice: anchorState.notice,
      }));
      return { anchorFound: anchorState.anchorFound };
    } catch (err) {
      console.warn("StudyBook load error:", err);
      const errHtml = renderMarkdown(`# Notes unavailable\n\nCould not load notes for this pack.`);
      setState(p => ({ ...p, loading: false, html: errHtml, toc: [], files, notice: null }));
      return { anchorFound: false };
    }
  }, []);

  const closeBook = useCallback(() => {
    setState(p => ({ ...p, open: false, splitMode: false, notice: null }));
  }, []);

  const toggleSplit = useCallback(() => {
    setState(p => ({ ...p, splitMode: !p.splitMode }));
  }, []);

  const switchFile = useCallback(async (dataset, path) => {
    if (path === stateRef.current.activeFile) return;
    setState(p => ({ ...p, loading: true }));
    try {
      const raw = await loadMarkdownFile(path);
      const toc = extractTOC(raw);
      const html = renderMarkdown(raw);
      setState(p => ({
        ...p, loading: false, activeFile: path, html, toc,
        searchQuery: "", searchMatchIndex: 0, searchMatchCount: 0,
        rawMarkdown: raw,
        currentAnchor: toc[0]?.anchor || null, scrollTop: 0,
        notice: null,
      }));
    } catch (err) {
      console.warn("StudyBook switch file error:", err);
      setState(p => ({ ...p, loading: false }));
    }
  }, []);

  const setSearchQuery = useCallback((q) => {
    setState(p => ({ ...p, searchQuery: q, searchMatchIndex: 0 }));
  }, []);

  const navigateMatch = useCallback((dir) => {
    setState(p => ({
      ...p,
      searchMatchIndex: Math.max(0, Math.min(p.searchMatchCount - 1, p.searchMatchIndex + dir)),
    }));
  }, []);

  const setSearchMatchCount = useCallback((count) => {
    setState(p => ({ ...p, searchMatchCount: count }));
  }, []);

  const setCurrentAnchor = useCallback((anchor) => {
    setState(p => ({ ...p, currentAnchor: anchor }));
  }, []);

  const saveScrollTop = useCallback((scrollTop) => {
    setState(p => ({ ...p, scrollTop }));
  }, []);

  const setNotice = useCallback((notice) => {
    setState(p => ({ ...p, notice }));
  }, []);

  const value = {
    ...state,
    openBook,
    closeBook,
    toggleSplit,
    switchFile,
    setSearchQuery,
    navigateMatch,
    setSearchMatchCount,
    setCurrentAnchor,
    saveScrollTop,
    setNotice,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudyBook() {
  return useContext(Ctx);
}
