import type { Settings } from "./types";
import { promptFor, resolveLocale, t } from "../i18n";

export const DEFAULT_PROMPT = promptFor("en");

const SETTINGS_KEY = "settings";

export const DEFAULT_SETTINGS: Settings = {
  endpoint: "http://127.0.0.1:8788",
  model: "",
  authToken: "",
  lanConsent: false,
  language: "auto",
  promptMode: "preset",
  prompt: DEFAULT_PROMPT,
  maxSize: 1600,
  lowConfidenceThreshold: 0.4,
  highConfidenceThreshold: 0.7
};

/**
 * Reads settings from storage and fills in defaults for any missing fields.
 * This function does not write to storage. Use `resolvePromptMode` first
 * if you need up-to-date preset/custom detection after a locale change.
 */
export async function getSettings(): Promise<Settings> {
  const [syncData, localData] = await Promise.all([
    chrome.storage.sync.get(SETTINGS_KEY),
    chrome.storage.local.get("authToken")
  ]);
  const saved = syncData[SETTINGS_KEY] as Partial<Settings> | undefined;
  const authToken = typeof localData.authToken === "string" ? localData.authToken : "";

  const settings: Settings = { ...DEFAULT_SETTINGS, ...saved, authToken };

  if (settings.promptMode === "preset") {
    settings.prompt = promptFor(resolveLocale(settings.language));
  }

  return settings;
}

export async function saveSettings(settings: Settings): Promise<void> {
  const { authToken, ...syncSettings } = settings;
  await Promise.all([
    chrome.storage.sync.set({ [SETTINGS_KEY]: syncSettings }),
    chrome.storage.local.set({ authToken })
  ]);
}

/**
 * Determines whether a saved prompt should be treated as "preset" or "custom".
 * A prompt counts as preset only if it exactly matches the current built-in
 * prompt for the given language preference. Any other value is custom.
 */
export function resolvePromptMode(prompt: string, language: Settings["language"]): Settings["promptMode"] {
  const currentPreset = promptFor(resolveLocale(language));
  return prompt === currentPreset ? "preset" : "custom";
}

export function isLoopbackEndpoint(endpoint: string): boolean {
  try {
    const host = new URL(endpoint).hostname.toLowerCase();
    return host === "localhost" || host === "::1" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function confidenceMessage(value: number, settings: Settings): string {
  const locale = resolveLocale(settings.language);
  if (value < settings.lowConfidenceThreshold) return t(locale, "confidenceLow");
  if (value < settings.highConfidenceThreshold) return t(locale, "confidenceMedium");
  return t(locale, "confidenceHigh");
}