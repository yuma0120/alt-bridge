import { confidenceMessage, getSettings } from "../shared/core";
import type { CachedCaption, ImageCategory, ImageRecord } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;
const labels: Record<ImageCategory, string> = { "missing-alt": "⚠ Missing alt", "empty-alt": "❔ Empty alt", "suspicious-alt": "⚠ Possibly weak alt", "valid-alt": "✓ Alt present", excluded: "Excluded" };

async function start(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return renderError("Unable to access the current tab.");
  const health = await chrome.runtime.sendMessage({ type: "health" }) as { available: boolean };
  const data = await chrome.tabs.sendMessage(tab.id, { type: "getImages" }) as { images: ImageRecord[] };
  render(data.images.filter((image) => image.category !== "excluded"), health.available);
}
function render(images: ImageRecord[], available: boolean): void {
  app.innerHTML = `<header><h1>AltBridge</h1><button id="settings">Settings</button></header>${available ? "" : "<p class=notice>Unable to reach the local AI server. Check Settings.</p>"}<p class=count>${images.length} image(s)</p><section>${images.map(card).join("") || "<p>No eligible images found.</p>"}</section>`;
  document.querySelector<HTMLButtonElement>("#settings")!.onclick = () => chrome.runtime.openOptionsPage();
  document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => button.onclick = async () => {
    button.disabled = true; button.textContent = "Generating…";
    const result = await chrome.runtime.sendMessage({ type: "captionUrl", src: button.dataset.src, force: true }) as CachedCaption & { error?: string };
    const target = button.parentElement!.querySelector<HTMLElement>(".result")!;
    target.textContent = result.error ? result.error : `${result.caption}（${result.confidence.toFixed(2)}）`;
    button.textContent = "Generate again"; button.disabled = false;
  });
  if (!available) document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => button.disabled = true);
}
function card(image: ImageRecord): string { return `<article><img src="${escape(image.src)}" alt="" /><div><strong>${labels[image.category]}</strong><p>${escape(image.reason)}</p><p class=alt>alt: ${escape(image.alt ?? "(missing)")}</p><button data-src="${escapeAttr(image.src)}">Generate AI description</button><p class=result aria-live="polite"></p></div></article>`; }
function escape(value: string): string { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function escapeAttr(value: string): string { return escape(value).replace(/"/g, "&quot;"); }
function renderError(message: string): void { app.textContent = message; }
void start().catch((error: unknown) => renderError(error instanceof Error ? error.message : "Unable to read this page."));
