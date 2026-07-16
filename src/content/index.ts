import type { ImageCategory, ImageRecord } from "../shared/types";

const genericAlt = /^(image|img|photo|picture|画像|写真)$/i;
const filenameAlt = /(^|\\s)(img|image|photo)[_-]?\\d*|\\.(jpe?g|png|gif|webp|avif)$/i;
const urlAlt = /^(https?:|data:)/i;

function categoryFor(image: HTMLImageElement): Pick<ImageRecord, "category" | "reason"> {
  const alt = image.getAttribute("alt");
  const role = image.getAttribute("role");
  if (role === "presentation" || image.getAttribute("aria-hidden") === "true") return { category: "excluded", reason: "装飾目的として明示されています" };
  if (image.closest("svg") || image.src.includes("favicon")) return { category: "excluded", reason: "SVGまたはfaviconです" };
  if (image.naturalWidth <= 16 && image.naturalHeight <= 16) return { category: "excluded", reason: "極小アイコンです" };
  if (alt === null) return { category: "missing-alt", reason: "alt属性がありません" };
  if (alt === "") return { category: "empty-alt", reason: "装飾目的の可能性があります" };
  if (alt.length < 3 || genericAlt.test(alt) || filenameAlt.test(alt) || urlAlt.test(alt)) return { category: "suspicious-alt", reason: "内容を説明していない可能性があります" };
  return { category: "valid-alt", reason: "alt属性があります" };
}

function recordFor(image: HTMLImageElement, index: number): ImageRecord {
  const classification = categoryFor(image);
  return { id: `${index}-${image.currentSrc || image.src}`, src: image.currentSrc || image.src, alt: image.getAttribute("alt"), width: image.naturalWidth, height: image.naturalHeight, ...classification };
}

function collectImages(): ImageRecord[] {
  return [...document.images].filter((image) => Boolean(image.currentSrc || image.src)).map(recordFor);
}

chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse) => {
  if (message.type === "getImages") sendResponse({ images: collectImages() });
});

new MutationObserver(() => { /* popup reads current DOM on demand; observer keeps lazy/dynamic images in scope */ }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src", "srcset", "alt"] });
