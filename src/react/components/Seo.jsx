import { useEffect } from "react";

function upsertMeta(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement("meta");
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (value == null) return;
    node.setAttribute(key, value);
  });
}

function upsertCanonical(href) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", "canonical");
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

function upsertStructuredData(data) {
  const id = "lw-route-jsonld";
  let node = document.getElementById(id);
  if (!data) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement("script");
    node.id = id;
    node.type = "application/ld+json";
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(data);
}

export default function Seo({
  title,
  description,
  canonical,
  ogTitle,
  ogDescription,
  image,
  noindex = false,
  structuredData,
}) {
  useEffect(() => {
    document.title = title;
    upsertCanonical(canonical);
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "FoxChild@Learn" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: ogTitle || title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: ogDescription || description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: `${ogTitle || title} preview` });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: ogTitle || title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: ogDescription || description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: `${ogTitle || title} preview` });
    upsertStructuredData(structuredData);
  }, [canonical, description, image, noindex, ogDescription, ogTitle, structuredData, title]);

  return null;
}
