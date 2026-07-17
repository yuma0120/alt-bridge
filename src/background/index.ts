import { getSettings } from "../shared/core";
import { resolveLocale, t } from "../i18n";
import { LocalCaptionProvider } from "../providers/local-caption-provider";
import type { CachedCaption } from "../shared/types";

const CACHE_KEY = "captions";
chrome.runtime.onInstalled.addListener(() => { void updateContextMenu(); });
chrome.storage.onChanged.addListener((changes, area) => { if (area === "sync" && changes.settings) void updateContextMenu(); });

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === "caption-image" && info.srcUrl) await captionUrl(info.srcUrl);
});

chrome.runtime.onMessage.addListener((message: { type: string; src?: string; force?: boolean }, _sender, sendResponse) => {
  if (message.type === "captionUrl" && message.src) { captionUrl(message.src, message.force === true).then(sendResponse).catch(async (error: unknown) => { const locale = resolveLocale((await getSettings()).language); sendResponse({ error: error instanceof Error ? error.message : t(locale, "generationFailed") }); }); return true; }
  if (message.type === "health") { health().then(sendResponse).catch(() => sendResponse({ available: false })); return true; }
});

async function captionUrl(src: string, force = false): Promise<CachedCaption> {
  const settings = await getSettings();
  const cached = await getCache();
  const key = cacheKey(src, settings);
  if (!force && cached[key]) return cached[key];
  const locale = resolveLocale(settings.language);
  const image = await fetch(src).then(async (response) => { if (!response.ok) throw new Error(t(locale, "imageFetchFailed")); return response.blob(); });
  const result = await new LocalCaptionProvider(settings.endpoint).caption({ image, prompt: settings.prompt, maxSize: settings.maxSize, model: settings.model, authToken: settings.authToken });
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
  const headers: HeadersInit = settings.authToken ? { Authorization: `Bearer ${settings.authToken}` } : {};
  const response = await fetch(`${settings.endpoint.replace(/\/$/, "")}/health`, { headers });
  return { available: response.ok };
}
async function updateContextMenu(): Promise<void> {
  const settings = await getSettings();
  const locale = resolveLocale(settings.language);
  await chrome.contextMenus.removeAll();
  chrome.contextMenus.create({ id: "caption-image", title: t(locale, "contextGenerate"), contexts: ["image"] });
}
