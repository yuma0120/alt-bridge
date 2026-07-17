import { getSettings } from "../shared/core";
import { LocalCaptionProvider } from "../providers/local-caption-provider";
import type { CachedCaption } from "../shared/types";

const CACHE_KEY = "captions";
chrome.runtime.onInstalled.addListener(() => chrome.contextMenus.create({ id: "caption-image", title: "Generate AI description", contexts: ["image"] }));

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "caption-image" && info.srcUrl) await captionUrl(info.srcUrl);
});

chrome.runtime.onMessage.addListener((message: { type: string; src?: string; force?: boolean }, _sender, sendResponse) => {
  if (message.type === "captionUrl" && message.src) { captionUrl(message.src, message.force === true).then(sendResponse).catch((error: unknown) => sendResponse({ error: error instanceof Error ? error.message : "Generation failed" })); return true; }
  if (message.type === "health") { health().then(sendResponse).catch(() => sendResponse({ available: false })); return true; }
});

async function captionUrl(src: string, force = false): Promise<CachedCaption> {
  const settings = await getSettings();
  const cached = await getCache();
  const key = cacheKey(src, settings);
  if (!force && cached[key]) return cached[key];
  const image = await fetch(src).then(async (response) => { if (!response.ok) throw new Error("Unable to fetch the image"); return response.blob(); });
  const result = await new LocalCaptionProvider(settings.endpoint).caption({ image, prompt: settings.prompt, maxSize: settings.maxSize, model: settings.model });
  const item = { ...result, createdAt: Date.now() };
  await chrome.storage.local.set({ [CACHE_KEY]: { ...cached, [key]: item } });
  return item;
}
async function getCache(): Promise<Record<string, CachedCaption>> { return (await chrome.storage.local.get(CACHE_KEY))[CACHE_KEY] ?? {}; }
function cacheKey(src: string, settings: Awaited<ReturnType<typeof getSettings>>): string {
  return JSON.stringify({ src, endpoint: settings.endpoint.replace(/\/$/, ""), model: settings.model.trim(), prompt: settings.prompt, maxSize: settings.maxSize });
}
async function health(): Promise<{ available: boolean }> {
  const settings = await getSettings();
  const response = await fetch(`${settings.endpoint.replace(/\/$/, "")}/health`);
  return { available: response.ok };
}
