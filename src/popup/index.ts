import { confidenceMessage, getSettings } from "../shared/core";
import type { CachedCaption, ImageCategory, ImageRecord } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;
const labels: Record<ImageCategory, string> = { "missing-alt": "⚠ altなし", "empty-alt": "❔ alt=\"\"", "suspicious-alt": "⚠ altが不適切かも", "valid-alt": "✓ altあり", excluded: "除外" };

async function start(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.id) return renderError("現在のタブを取得できませんでした。");
  const health = await chrome.runtime.sendMessage({ type: "health" }) as { available: boolean };
  const data = await chrome.tabs.sendMessage(tab.id, { type: "getImages" }) as { images: ImageRecord[] };
  render(data.images.filter((image) => image.category !== "excluded"), health.available);
}
function render(images: ImageRecord[], available: boolean): void {
  app.innerHTML = `<header><h1>AltBridge</h1><button id="settings">設定</button></header>${available ? "" : "<p class=notice>ローカルAIサーバーに接続できません。設定を確認してください。</p>"}<p class=count>${images.length} 件の画像</p><section>${images.map(card).join("") || "<p>対象画像はありません。</p>"}</section>`;
  document.querySelector<HTMLButtonElement>("#settings")!.onclick = () => chrome.runtime.openOptionsPage();
  document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => button.onclick = async () => {
    button.disabled = true; button.textContent = "生成中…";
    const result = await chrome.runtime.sendMessage({ type: "captionUrl", src: button.dataset.src }) as CachedCaption & { error?: string };
    const target = button.parentElement!.querySelector<HTMLElement>(".result")!;
    target.textContent = result.error ? result.error : `${result.caption}（${result.confidence.toFixed(2)}）`;
    button.textContent = "再表示"; button.disabled = false;
  });
  if (!available) document.querySelectorAll<HTMLButtonElement>("[data-src]").forEach((button) => button.disabled = true);
}
function card(image: ImageRecord): string { return `<article><img src="${escape(image.src)}" alt="" /><div><strong>${labels[image.category]}</strong><p>${escape(image.reason)}</p><p class=alt>alt: ${escape(image.alt ?? "（なし）")}</p><button data-src="${escapeAttr(image.src)}">AI説明を生成</button><p class=result aria-live="polite"></p></div></article>`; }
function escape(value: string): string { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function escapeAttr(value: string): string { return escape(value).replace(/"/g, "&quot;"); }
function renderError(message: string): void { app.textContent = message; }
void start().catch((error: unknown) => renderError(error instanceof Error ? error.message : "ページを読み取れませんでした。"));
