import { confidenceMessage, getSettings } from "../shared/core";
import { resolveLocale, t } from "../i18n";
import type { CachedCaption, ImageCategory, ImageRecord, Settings, SupportedLocale } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;

async function start(): Promise<void> {
  const settings = await getSettings();
  const locale = resolveLocale(settings.language);
  document.documentElement.lang = locale;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return renderError(t(locale, "tabUnavailable"));
  const health = (await chrome.runtime.sendMessage({ type: "health" })) as { available: boolean };
  const data = (await chrome.tabs.sendMessage(tab.id, { type: "getImages" })) as { images: ImageRecord[] };
  render(
    data.images.filter((image) => image.category !== "excluded"),
    health.available,
    settings,
    locale,
  );
}

function render(images: ImageRecord[], available: boolean, settings: Settings, locale: SupportedLocale): void {
  const unique = uniqueImages(images);
  const groups = [
    { title: "needsAttention" as const, categories: ["missing-alt", "suspicious-alt"] as ImageCategory[] },
    { title: "possiblyDecorative" as const, categories: ["empty-alt"] as ImageCategory[] },
    { title: "altAlreadyPresent" as const, categories: ["valid-alt"] as ImageCategory[] },
  ];
  const content = groups
    .map((group) => {
      const groupImages = unique.filter((image) => group.categories.includes(image.category));
      if (!groupImages.length) return "";
      return `<section class="image-group"><h2>${t(locale, group.title)}</h2>${groupImages.map((image) => card(image, locale)).join("")}</section>`;
    })
    .join("");
  app.innerHTML = `<header><h1>AltBridge</h1><button id="settings">${t(locale, "settings")}</button></header>${available ? "" : `<p class=notice>${t(locale, "serverUnavailable")}</p>`}<p class=count>${t(locale, "imageCount", { count: unique.length })}</p>${content || `<p>${t(locale, "noImages")}</p>`}`;
  document.querySelector<HTMLButtonElement>("#settings")!.onclick = () => chrome.runtime.openOptionsPage();
  document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => {
    const src = button.dataset.src!;
    button.onclick = () => void generateCaption(button, src, settings, locale);
    void showCachedCaption(button, src, settings, locale);
  });
  if (!available)
    document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => (button.disabled = true));
}

function uniqueImages(images: ImageRecord[]): ImageRecord[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    const key = `${image.category}\n${image.src}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function generateCaption(
  button: HTMLButtonElement,
  src: string,
  settings: Settings,
  locale: SupportedLocale,
): Promise<void> {
  button.disabled = true;
  button.textContent = t(locale, "generating");
  const result = (await chrome.runtime.sendMessage({ type: "captionUrl", src, force: true })) as CachedCaption & {
    error?: string;
  };
  showCaption(button, result, settings, locale);
  button.textContent = t(locale, "generateAgain");
  button.disabled = false;
}

async function showCachedCaption(
  button: HTMLButtonElement,
  src: string,
  settings: Settings,
  locale: SupportedLocale,
): Promise<void> {
  const status = (await chrome.runtime.sendMessage({ type: "getCachedCaption", src })) as {
    caption?: CachedCaption;
    generating: boolean;
  };
  if (status.caption) {
    showCaption(button, status.caption, settings, locale);
    button.textContent = t(locale, "generateAgain");
  }
  if (status.generating) {
    button.disabled = true;
    button.textContent = t(locale, "generating");
    window.setTimeout(() => void showCachedCaption(button, src, settings, locale), 500);
  } else if (button.textContent === t(locale, "generating")) {
    button.disabled = false;
  }
}

function showCaption(
  button: HTMLButtonElement,
  result: CachedCaption & { error?: string },
  settings: Settings,
  locale: SupportedLocale,
): void {
  const target = button.parentElement!.querySelector<HTMLElement>(".result")!;
  if (result.error) {
    target.textContent = result.error;
    target.title = "";
    return;
  }
  const source =
    result.confidenceSource === "heuristic" ? t(locale, "heuristicEstimate") : t(locale, "providerConfidence");
  target.textContent = result.caption + "\n" + confidenceMessage(result.confidence, settings) + " (" + source + ")";
  target.title = result.confidenceReasons?.join(" ") ?? "";
}

function card(image: ImageRecord, locale: SupportedLocale): string {
  return `<article><img src="${escapeAttr(image.src)}" alt="" /><div><strong>${label(image.category, locale)}</strong><p>${escape(image.reason)}</p><p class=alt>alt: ${escape(image.alt ?? t(locale, "missingAltValue"))}</p><button data-src="${escapeAttr(image.src)}">${t(locale, "generate")}</button><p class=result aria-live="polite"></p></div></article>`;
}
function label(category: ImageCategory, locale: SupportedLocale): string {
  const key: Record<ImageCategory, "missingAlt" | "emptyAlt" | "suspiciousAlt" | "validAlt" | "excluded"> = {
    "missing-alt": "missingAlt",
    "empty-alt": "emptyAlt",
    "suspicious-alt": "suspiciousAlt",
    "valid-alt": "validAlt",
    excluded: "excluded",
  };
  return t(locale, key[category]);
}
function escape(value: string): string {
  const node = document.createElement("span");
  node.textContent = value;
  return node.innerHTML;
}
function escapeAttr(value: string): string {
  return escape(value).replace(/"/g, "&quot;");
}
function renderError(message: string): void {
  app.textContent = message;
}
void start().catch(async (error: unknown) => {
  const locale = resolveLocale((await getSettings()).language);
  renderError(error instanceof Error ? error.message : t(locale, "pageUnavailable"));
});
