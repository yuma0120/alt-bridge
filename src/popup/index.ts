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
  app.innerHTML = `<header><h1>AltBridge</h1><button id="settings">${t(locale, "settings")}</button></header>${available ? "" : `<p class=notice>${t(locale, "serverUnavailable")}</p>`}<p class=count>${t(locale, "imageCount", { count: images.length })}</p><section>${images.map((image) => card(image, locale)).join("") || `<p>${t(locale, "noImages")}</p>`}</section>`;
  document.querySelector<HTMLButtonElement>("#settings")!.onclick = () => chrome.runtime.openOptionsPage();
  document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach(
    (button) =>
      (button.onclick = async () => {
        button.disabled = true;
        button.textContent = t(locale, "generating");
        const result = (await chrome.runtime.sendMessage({
          type: "captionUrl",
          src: button.dataset.src,
          force: true,
        })) as CachedCaption & { error?: string };
        const target = button.parentElement!.querySelector<HTMLElement>(".result")!;
        if (result.error) {
          target.textContent = result.error;
        } else {
          const source =
            result.confidenceSource === "heuristic" ? t(locale, "heuristicEstimate") : t(locale, "providerConfidence");
          target.textContent =
            result.caption + "\n" + confidenceMessage(result.confidence, settings) + " (" + source + ")";
          target.title = result.confidenceReasons?.join(" ") ?? "";
        }
        button.textContent = t(locale, "generateAgain");
        button.disabled = false;
      }),
  );
  if (!available)
    document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => (button.disabled = true));
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
