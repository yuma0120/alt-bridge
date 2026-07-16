import { getSettings } from "../shared/core";
import { LocalCaptionProvider } from "../providers/local-caption-provider";
import type { CachedCaption } from "../shared/types";

const CACHE_KEY = "captions";
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: "caption-image", title: "AI説明を生成", contexts: ["image"] }));

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "caption-image" && info.srcUrl) await captionUrl(info.srcUrl);
});

chrome.runtime.onMessage.addListener((message: { type: string; src?: string }, _sender, sendResponse) => {
  if (message.type === "captionUrl" && message.src) { captionUrl(message.src).then(sendResponse).catch((error: unknown) => sendResponse({ error: error instanceof Error ? error.message : "生成に失敗しました" })); return true; }
  if (message.type === "health") { health().then(sendResponse).catch(() => sendResponse({ available: false })); return true; }
});

async function captionUrl(src: string): Promise<CachedCaption> {
  const cached = await getCache();
  if (cached[src]) return cached[src];
  const settings = await getSettings();
  const image = await fetch(src).then(async (response) => { if (!response.ok) throw new Error("画像を取得できませんでした"); return response.blob(); });
  const result = await new LocalCaptionProvider(settings.endpoint).caption({ image, prompt: settings.prompt, maxSize: settings.maxSize });
  const item = { ...result, createdAt: Date.now() };
  await chrome.storage.local.set({ [CACHE_KEY]: { ...cached, [src]: item } });
  return item;
}
async function getCache(): Promise<Record<string, CachedCaption>> { return (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY] ?? {}; }
async function health(): Promise<{ available: boolean }> {
  const settings = await getSettings();
  const response = await fetch(`${settings.endpoint.replace(/\/$/, "")}/health`);
  return { available: response.ok };
}
