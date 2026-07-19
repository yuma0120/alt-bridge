import { getSettings } from "../shared/core";
import { resolveLocale, t } from "../i18n";
import type { ImageRecord, SupportedLocale } from "../shared/types";

const genericAlt = /^(image|img|photo|picture|画像|写真)$/i;
const filenameAlt = /(^|\s)(img|image|photo)[_-]?\d*|\.(jpe?g|png|gif|webp|avif)$/i;
const urlAlt = /^(https?:|data:)/i;

/** DOM に依存しない分類ロジック。テストおよび内部で共用する。 */
export function classifyAlt(
  alt: string | null,
  role: string | null,
  ariaHidden: string | null,
  inSvg: boolean,
  isFavicon: boolean,
  naturalWidth: number,
  naturalHeight: number,
  locale: SupportedLocale,
): Pick<ImageRecord, "category" | "reason"> {
  if (role === "presentation" || ariaHidden === "true")
    return { category: "excluded", reason: t(locale, "decorative") };
  if (inSvg || isFavicon) return { category: "excluded", reason: t(locale, "svgOrFavicon") };
  if (naturalWidth <= 16 && naturalHeight <= 16)
    return { category: "excluded", reason: t(locale, "smallIcon") };
  if (alt === null) return { category: "missing-alt", reason: t(locale, "noAlt") };
  if (alt === "") return { category: "empty-alt", reason: t(locale, "maybeDecorative") };
  if (alt.length < 3 || genericAlt.test(alt) || filenameAlt.test(alt) || urlAlt.test(alt))
    return { category: "suspicious-alt", reason: t(locale, "weakAlt") };
  return { category: "valid-alt", reason: t(locale, "altPresent") };
}

function categoryFor(image: HTMLImageElement, locale: SupportedLocale): Pick<ImageRecord, "category" | "reason"> {
  return classifyAlt(
    image.getAttribute("alt"),
    image.getAttribute("role"),
    image.getAttribute("aria-hidden"),
    Boolean(image.closest("svg")),
    image.src.includes("favicon"),
    image.naturalWidth,
    image.naturalHeight,
    locale,
  );
}


function collectImages(locale: SupportedLocale): ImageRecord[] {
  return [...document.images]
    .filter((image) => Boolean(image.currentSrc || image.src))
    .map((image, index) => ({
      id: `${index}-${image.currentSrc || image.src}`,
      src: image.currentSrc || image.src,
      alt: image.getAttribute("alt"),
      width: image.naturalWidth,
      height: image.naturalHeight,
      ...categoryFor(image, locale),
    }));
}

chrome.runtime.onMessage.addListener((message: { type: string }, _sender, sendResponse) => {
  if (message.type !== "getImages") return;
  getSettings().then((settings) => sendResponse({ images: collectImages(resolveLocale(settings.language)) }));
  return true;
});


