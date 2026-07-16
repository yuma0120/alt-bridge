import { DEFAULT_SETTINGS, getSettings, saveSettings } from "../shared/core";
import type { Settings } from "../shared/types";
import "./style.css";

const app = document.querySelector<HTMLElement>("#app")!;
async function start(): Promise<void> {
  const settings = await getSettings();
  app.innerHTML = `<h1>AltBridge 設定</h1><form><label>ローカルAIサーバーのURL<input name="endpoint" type="url" required value="${escape(settings.endpoint)}" /></label><label>プロンプト<textarea name="prompt" required>${escape(settings.prompt)}</textarea></label><label>最大画像サイズ（px）<input name="maxSize" type="number" min="64" max="8192" value="${settings.maxSize}" /></label><label>低confidence閾値<input name="lowConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.lowConfidenceThreshold}" /></label><label>高confidence閾値<input name="highConfidenceThreshold" type="number" min="0" max="1" step="0.01" value="${settings.highConfidenceThreshold}" /></label><button>保存</button><button type="button" id="reset">初期値に戻す</button><p id="status" aria-live="polite"></p></form>`;
  const form = app.querySelector<HTMLFormElement>("form")!;
  form.onsubmit = async (event) => { event.preventDefault(); const next = Object.fromEntries(new FormData(form)) as Record<string, string>; const value: Settings = { endpoint: next.endpoint.replace(/\/$/, ""), prompt: next.prompt.trim(), maxSize: Number(next.maxSize), lowConfidenceThreshold: Number(next.lowConfidenceThreshold), highConfidenceThreshold: Number(next.highConfidenceThreshold) }; if (!valid(value)) return status("閾値は 0〜1 の範囲で、低 < 高 にしてください。"); await saveSettings(value); status("保存しました。"); };
  app.querySelector<HTMLButtonElement>("#reset")!.onclick = () => { form.reset(); Object.entries(DEFAULT_SETTINGS).forEach(([name, value]) => { const input = form.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement; input.value = String(value); }); };
}
function valid(settings: Settings): boolean { return settings.prompt.length > 0 && Number.isInteger(settings.maxSize) && settings.maxSize >= 64 && settings.maxSize <= 8192 && settings.lowConfidenceThreshold >= 0 && settings.highConfidenceThreshold <= 1 && settings.lowConfidenceThreshold < settings.highConfidenceThreshold; }
function escape(value: string): string { const node = document.createElement("span"); node.textContent = value; return node.innerHTML; }
function status(message: string): void { app.querySelector("#status")!.textContent = message; }
void start();
