import { hasStudyBookAnchor } from "@/study-book.js";

export const MISSING_ANCHOR_NOTICE = "Opened the correct study book, but the exact heading was not found.";

export function resolveStudyBookAnchor(rawMarkdown, toc, requestedAnchor) {
  if (!requestedAnchor) {
    return { anchor: toc[0]?.anchor || null, anchorFound: true, notice: null };
  }
  const anchorFound = (Array.isArray(toc) && toc.some((entry) => entry?.anchor === requestedAnchor))
    || hasStudyBookAnchor(rawMarkdown, requestedAnchor);
  return {
    anchor: anchorFound ? requestedAnchor : (toc[0]?.anchor || null),
    anchorFound,
    notice: anchorFound ? null : MISSING_ANCHOR_NOTICE,
  };
}
