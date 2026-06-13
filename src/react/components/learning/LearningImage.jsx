import { useEffect, useState } from "react";
import styles from "./LearningImage.module.css";

function isSafeImageSrc(src) {
  const value = String(src || "").trim();
  if (!value) return false;
  if (value.startsWith("/assets/") || value.startsWith("/images/") || value.startsWith("/data/")) return true;
  if (/^https:\/\/[^\s]+$/i.test(value)) return true;
  return false;
}

export function LearningImage({
  src,
  alt = "Learning image",
  caption = "",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const safeSrc = isSafeImageSrc(src) ? String(src).trim() : "";

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    setFailed(false);
    setOpen(false);
  }, [safeSrc]);

  if (!safeSrc) return null;

  if (failed) {
    return (
      <div className={`${styles.fallback} ${className}`} role="note">
        Image unavailable
      </div>
    );
  }

  return (
    <>
      <figure className={`${styles.root} ${className}`}>
        <button
          type="button"
          className={styles.imageButton}
          onClick={() => setOpen(true)}
          aria-label="Open image larger"
        >
          <img
            src={safeSrc}
            alt={alt || "Learning image"}
            className={styles.image}
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        </button>
        {caption && <figcaption className={styles.caption}>{caption}</figcaption>}
      </figure>

      {open && (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Learning image"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setOpen(false)}
            aria-label="Close image"
          >
            ×
          </button>
          <figure className={styles.lightboxFigure}>
            <img className={styles.lightboxImage} src={safeSrc} alt={alt || "Learning image"} />
            {caption && <figcaption className={styles.lightboxCaption}>{caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}
