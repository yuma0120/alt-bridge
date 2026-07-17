import type { Settings } from "./types";

export const DEFAULT_PROMPT = "Describe this image for a blind or low-vision user in 100 characters or fewer. Avoid speculation; focus on visible details. If uncertain, clearly state the uncertainty.";
const LEGACY_DEFAULT_PROMPT = new TextDecoder().decode(Uint8Array.from(atob("44GT44Gu55S75YOP44KS6KaW6Kaa6Zqc5a6z6ICF5ZCR44GR44Gr6Kqs5piO44GX44Gm44GP44Gg44GV44GE44CC5o6o5ris44Gv6YG/44GR44CB6KaL44GI44Gm44GE44KL5YaF5a6544KS5Lit5b+D44GrMTAw5paH5a2X5Lul5YaF44Gn6Kqs5piO44GX44Gm44GP44Gg44GV44GE44CC5LiN56K65a6f44Gq5aC05ZCI44Gv44CM44Cc44Go5oCd44KP44KM44G+44GZ44CN44Go6KGo54++44GX44Gm44GP44Gg44GV44GE44CC"), (char) => char.charCodeAt(0)));
export const DEFAULT_SETTINGS: Settings = { endpoint: "http://127.0.0.1:8788", model: "", prompt: DEFAULT_PROMPT, maxSize: 1600, lowConfidenceThreshold: 0.4, highConfidenceThreshold: 0.7 };
const SETTINGS_KEY = "settings";

export async function getSettings(): Promise<Settings> {
  const data = await chrome.storage.sync.get(SETTINGS_KEY);
  const saved = data[SETTINGS_KEY] as Partial<Settings> | undefined;
  const settings = { ...DEFAULT_SETTINGS, ...saved };
  if (saved?.prompt === LEGACY_DEFAULT_PROMPT) {
    settings.prompt = DEFAULT_PROMPT;
    await saveSettings(settings);
  }
  return settings;
}
export async function saveSettings(settings: Settings): Promise<void> { await chrome.storage.sync.set({ [SETTINGS_KEY]: settings }); }
export function confidenceMessage(value: number, settings: Settings): string {
  if (value < settings.lowConfidenceThreshold) return "The AI could not recognize this image reliably. Treat this as a reference only.";
  if (value < settings.highConfidenceThreshold) return "AI-generated description (some details may be uncertain)";
  return "AI-generated description";
}
