import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 920px)";
const GAP = 12;
const EDGE_MARGIN = 12;
const TUTOR_HEIGHT_ESTIMATE = 118;
const MIN_SPACE_FOR_HINT = 132;

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia?.(MOBILE_QUERY).matches;
}

function measureTutorPosition(targetRef) {
  if (!isMobileViewport() || !targetRef.current) {
    return { placement: "desktop", style: null };
  }
  const phraseRect = targetRef.current.getBoundingClientRect();
  const viewportHeight = window.innerHeight || 0;
  const viewportWidth = window.innerWidth || 0;
  const spaceAbove = phraseRect.top;
  const spaceBelow = viewportHeight - phraseRect.bottom;
  const width = Math.min(360, Math.max(220, viewportWidth - 24));
  const left = Math.max(EDGE_MARGIN, Math.min(viewportWidth - width - EDGE_MARGIN, (viewportWidth - width) / 2));

  if (spaceBelow >= MIN_SPACE_FOR_HINT || spaceBelow >= spaceAbove) {
    return {
      placement: spaceBelow >= MIN_SPACE_FOR_HINT ? "below" : "compact",
      style: {
        top: `${Math.min(viewportHeight - TUTOR_HEIGHT_ESTIMATE - EDGE_MARGIN, phraseRect.bottom + GAP)}px`,
        left: `${left}px`,
        right: "auto",
        bottom: "auto",
        width: `${width}px`,
      },
    };
  }

  if (spaceAbove >= MIN_SPACE_FOR_HINT) {
    return {
      placement: "above",
      style: {
        top: `${Math.max(EDGE_MARGIN, phraseRect.top - TUTOR_HEIGHT_ESTIMATE - GAP)}px`,
        left: `${left}px`,
        right: "auto",
        bottom: "auto",
        width: `${width}px`,
      },
    };
  }

  return {
    placement: "compact",
    style: {
      right: "18px",
      bottom: "82px",
      left: "auto",
      top: "auto",
      width: "72px",
    },
  };
}

export function useFloatingTutorPosition(targetRef, { enabled = true, deps = [] } = {}) {
  const [position, setPosition] = useState({ placement: "desktop", style: null });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setPosition({ placement: "desktop", style: null });
      return undefined;
    }

    let frame = 0;
    const update = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        setPosition(measureTutorPosition(targetRef));
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      window.removeEventListener("scroll", update, true);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, targetRef, ...deps]);

  return position;
}
