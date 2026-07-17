import { DEFAULT_SETTINGS, getSettings, saveSettings } from "../shared/core";
import { promptFor, resolveLocale, t } from "../i18n";
import type { LanguagePreference, PromptMode, Settings } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;

async function start(): Promise<void> {
  render(await getSettings());
}

function render(settings: Settings): void {
  const locale = resolveLocale(settings.language);
  document.documentElement.lang = locale;
  const languageName = settings.language === "ja" ? t(locale, "japanese") : settings.language === "en" ? t(locale, "english") : t(locale, "auto");
  app.innerHTML = `<h1>${t(locale, "settingsTitle")}</h1><form><label>${t(locale, "endpoint")}<input name="endpoint" type="url" required value="${escape(settings.endpoint)}" /></label><label>${t(locale, "model")}<input name="model" type="text" maxlength="100" placeholder="${t(locale, "modelPlaceholder")}" value="${escape(settings.model)}" /></label><label>${t(locale, "language")}<select name="language"><option value="auto"${selected(settings.language, "auto")}>${t(locale, "auto")}</option><option value="en"${selected(settings.language, "en")}>${t(locale, "english")}</option><option value="ja"${selected(settings.language, "ja")}>${t(locale, "japanese")}</option></select></label><label>${t(locale, "prompt")}<textarea name="prompt" required>${escape(settings.prompt)}</textarea></label><p id="prompt-mode">${settings.promptMode === "custom" ? t(locale, "customPrompt") : t(locale, "presetPrompt", { language: languageName })}</p><button type="button" id="restore-prompt">${t(locale, "restorePrompt", { language: languageName })}</button><label>${t(locale, "maxSize")}<input name="maxSize" type="number" min="64" max="8192" value="${settings.maxSize}" /></label><label>${t(locale, "lowThreshold")}<input name="lowConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.lowConfidenceThreshold}" /></label><label>${t(locale, "highThreshold")}<input name="highConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.highConfidenceThreshold}" /></label><button>${t(locale, "save")}</button><button type="button" id="restore-defaults">${t(locale, "restoreDefaults")}</button><p id="status" aria-live="polite"></p></form>`;
  const form = app.querySelector<HTMLFormElement>("form")!;
  const languageInput = form.elements.namedItem("language") as HTMLSelectElement;
  const promptInput = form.elements.namedItem("prompt") as HTMLTextAreaElement;
  languageInput.onchange = () => {
    const nextLocale = resolveLocale(languageInput.value as LanguagePreference);
    if (settings.promptMode === "preset" || promptInput.value === promptFor(locale)) promptInput.value = promptFor(nextLocale);
  };
  app.querySelector<HTMLButtonElement>("#restore-prompt")!.onclick = () => {
    promptInput.value = promptFor(resolveLocale(languageInput.value as LanguagePreference));
    app.querySelector("#prompt-mode")!.textContent = t(locale, "presetPrompt", { language: languageInput.selectedOptions[0].textContent ?? "" });
  };
  form.onsubmit = async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const language = values.language as LanguagePreference;
    const preset = promptFor(resolveLocale(language));
    const value: Settings = { endpoint: values.endpoint.replace(/\/$/, ""), model: values.model.trim(), language, promptMode: values.prompt.trim() === preset ? "preset" : "custom", prompt: values.prompt.trim(), maxSize: Number(values.maxSize), lowConfidenceThreshold: Number(values.lowConfidenceThreshold), highConfidenceThreshold: Number(values.highConfidenceThreshold) };
    if (!valid(value)) return status(t(locale, "invalidSettings"));
    await saveSettings(value);
    render(await getSettings());
    status(t(resolveLocale(value.language), "saved"));
  };
  app.querySelector<HTMLButtonElement>("#restore-defaults")!.onclick = () => {
    const defaults = { ...DEFAULT_SETTINGS, prompt: promptFor(resolveLocale(DEFAULT_SETTINGS.language)) };
    render(defaults);
  };
}

function valid(settings: Settings): boolean { return settings.model.length <= 100 && settings.prompt.length > 0 && Number.isInteger(settings.maxSize) && settings.maxSize >= 64 && settings.maxSize <= 8192 && settings.lowConfidenceThreshold >= 0 && settings.highConfidenceThreshold <= 1 && settings.lowConfidenceThreshold < settings.highConfidenceThreshold; }
function selected(value: string, option: string): string { return value === option ? " selected" : ""; }
function escape(value: string): string { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function status(message: string): void { app.querySelector("#status")!.textContent = message; }
void start();
