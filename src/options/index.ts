import { DEFAULT_SETTINGS, getSettings, saveSettings } from "../shared/core";
import type { Settings } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;
async function start(): Promise<void> {
  const settings = await getSettings();
  app.innerHTML = `<h1>AltBridge settings</h1><form><label>Local AI server URL<input name="endpoint" type="url" required value="${escape(settings.endpoint)}" /></label><label>Model name (optional)<input name="model" type="text" maxlength="100" placeholder="Use the server default" value="${escape(settings.model)}" /></label><label>Prompt<textarea name="prompt" required>${escape(settings.prompt)}</textarea></label><label>Maximum image size (px)<input name="maxSize" type="number" min="64" max="8192" value="${settings.maxSize}" /></label><label>Low-confidence threshold<input name="lowConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.lowConfidenceThreshold}" /></label><label>High-confidence threshold<input name="highConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.highConfidenceThreshold}" /></label><button>Save</button><button type="button" id="restore-defaults">Restore defaults</button><p id="status" aria-live="polite"></p></form>`;
  const form = app.querySelector<HTMLFormElement>("form")!;
  form.onsubmit = async (event) => { event.preventDefault(); const next = Object.fromEntries(new FormData(form)) as Record<string, string>; const value: Settings = { endpoint: next.endpoint.replace(/\/$/, ""), model: next.model.trim(), prompt: next.prompt.trim(), maxSize: Number(next.maxSize), lowConfidenceThreshold: Number(next.lowConfidenceThreshold), highConfidenceThreshold: Number(next.highConfidenceThreshold) }; if (!valid(value)) return status("Use a model name of 100 characters or fewer, and thresholds where 0 ≤ low < high ≤ 1."); await saveSettings(value); status("Saved."); };
  app.querySelector<HTMLButtonElement>("#restore-defaults")!.onclick = () => { HTMLFormElement.prototype.reset.call(form); Object.entries(DEFAULT_SETTINGS).forEach(([name, value]) => { const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement; input.value = String(value); }); };
}
function valid(settings: Settings): boolean { return settings.model.length <= 100 && settings.prompt.length > 0 && Number.isInteger(settings.maxSize) && settings.maxSize >= 64 && settings.maxSize <= 8192 && settings.lowConfidenceThreshold >= 0 && settings.highConfidenceThreshold <= 1 && settings.lowConfidenceThreshold < settings.highConfidenceThreshold; }
function escape(value: string): string { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function status(message: string): void { app.querySelector("#status")!.textContent = message; }
void start();
