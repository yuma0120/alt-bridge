import type { Settings } from "./types";

export const DEFAULT_PROMPT = "この画像を視覚障害者向けに説明してください。推測は避け、見えている内容を中心に100文字以内で説明してください。不確実な場合は「〜と思われます」と表現してください。";
export const DEFAULT_SETTINGS: Settings = { endpoint: "http://127.0.0.1:8787", prompt: DEFAULT_PROMPT, maxSize: 1600, lowConfidenceThreshold: 0.4, highConfidenceThreshold: 0.7 };
const SETTINGS_KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(data[SETTINGS_KEY] as Partial<Settings> | undefined) };
}
export async function saveSettings(settings: Settings): Promise<void> { await chrome.storage.sync.set({ [SETTINGS_KEY]: settings }); }
export function confidenceMessage(value: number, settings: Settings): string {
  if (value < settings.lowConfidenceThreshold) return "AIがうまく認識できませんでした。参考程度にご覧ください";
  if (value < settings.highConfidenceThreshold) return "AIによる説明（不確かな部分があります）";
  return "AIによる説明";
}
