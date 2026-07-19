import type { LanguagePreference, SupportedLocale } from "../shared/types";

const prompts: Record<SupportedLocale, string> = {
  en: "Describe this image for a blind or low-vision user in 100 characters or fewer. Avoid speculation; focus on visible details. If uncertain, clearly state the uncertainty. Respond in English.",
  ja: "この画像を視覚障害者向けに100文字以内で説明してください。推測は避け、見えている内容を中心にしてください。不確実な場合はその旨を明記してください。日本語で回答してください。",
};

const en = {
  settingsTitle: "AltBridge settings",
  endpoint: "Local AI server URL",
  model: "Model name (optional)",
  modelPlaceholder: "Use the server default",
  authToken: "Server access token",
  lanNotice: "This endpoint sends images to another device on your local network.",
  lanConsent: "I understand that images will be sent to this LAN server.",
  lanTokenHint: "A LAN server requires an access token.",
  invalidLan: "LAN endpoints require consent and an access token.",
  language: "Language",
  auto: "Auto (browser language)",
  english: "English",
  japanese: "Japanese",
  prompt: "Prompt",
  presetPrompt: "Built-in {language} prompt",
  customPrompt: "Custom prompt",
  restorePrompt: "Use {language} preset",
  maxSize: "Maximum image size (px)",
  lowThreshold: "Low-confidence threshold",
  highThreshold: "High-confidence threshold",
  save: "Save",
  restoreDefaults: "Restore defaults",
  saved: "Saved.",
  invalidSettings: "Use a model name of 100 characters or fewer, and thresholds where 0 ≤ low < high ≤ 1.",
  settings: "Settings",
  serverUnavailable: "Unable to reach the local AI server. Check Settings.",
  imageCount: "{count} image(s)",
  noImages: "No eligible images found.",
  missingAlt: "⚠ Missing alt",
  emptyAlt: "❔ Empty alt",
  suspiciousAlt: "⚠ Possibly weak alt",
  validAlt: "✓ Alt present",
  excluded: "Excluded",
  generate: "Generate AI description",
  generating: "Generating…",
  generateAgain: "Generate again",
  missingAltValue: "(missing)",
  tabUnavailable: "Unable to access the current tab.",
  pageUnavailable: "Unable to read this page.",
  providerConfidence: "provider confidence",
  heuristicEstimate: "heuristic estimate",
  confidenceHigh: "AI-generated description",
  confidenceMedium: "AI-generated description (some details may be uncertain)",
  confidenceLow: "The AI could not recognize this image reliably. Treat this as a reference only.",
  decorative: "Explicitly marked as decorative",
  svgOrFavicon: "SVG or favicon",
  smallIcon: "Very small icon",
  noAlt: "No alt attribute",
  maybeDecorative: "May be intentionally decorative",
  weakAlt: "May not describe the image",
  altPresent: "Alt attribute present",
  contextGenerate: "Generate AI description",
  generationFailed: "Generation failed",
  imageFetchFailed: "Unable to fetch the image",
};

const ja: Record<keyof typeof en, string> = {
  settingsTitle: "AltBridge 設定",
  endpoint: "ローカルAIサーバーURL",
  model: "モデル名（任意）",
  modelPlaceholder: "サーバーのデフォルトを使用",
  authToken: "サーバーアクセストークン",
  lanNotice: "この接続先では、画像がローカルネットワーク上の別端末へ送信されます。",
  lanConsent: "このLANサーバーへ画像を送信することを理解しました。",
  lanTokenHint: "LANサーバーにはアクセストークンが必要です。",
  invalidLan: "LAN接続先には送信への同意とアクセストークンが必要です。",
  language: "言語",
  auto: "自動（ブラウザ言語）",
  english: "English",
  japanese: "日本語",
  prompt: "プロンプト",
  presetPrompt: "組み込みの{language}プロンプト",
  customPrompt: "カスタムプロンプト",
  restorePrompt: "{language}プリセットを使用",
  maxSize: "最大画像サイズ（px）",
  lowThreshold: "信頼度の低い閾値",
  highThreshold: "信頼度の高い閾値",
  save: "保存",
  restoreDefaults: "初期値に戻す",
  saved: "保存しました。",
  invalidSettings: "モデル名は100文字以内、閾値は 0 ≤ 低 < 高 ≤ 1 にしてください。",
  settings: "設定",
  serverUnavailable: "ローカルAIサーバーに接続できません。設定を確認してください。",
  imageCount: "{count} 件の画像",
  noImages: "対象画像はありません。",
  missingAlt: "⚠ altなし",
  emptyAlt: "❔ altが空",
  suspiciousAlt: "⚠ altが不適切かも",
  validAlt: "✓ altあり",
  excluded: "除外",
  generate: "AI説明を生成",
  generating: "生成中…",
  generateAgain: "再生成",
  missingAltValue: "（なし）",
  tabUnavailable: "現在のタブを取得できませんでした。",
  pageUnavailable: "ページを読み取れませんでした。",
  providerConfidence: "プロバイダのconfidence",
  heuristicEstimate: "ヒューリスティック推定",
  confidenceHigh: "AIによる説明",
  confidenceMedium: "AIによる説明（不確かな部分があります）",
  confidenceLow: "AIがうまく認識できませんでした。参考程度にご覧ください",
  decorative: "装飾目的として明示されています",
  svgOrFavicon: "SVGまたはfaviconです",
  smallIcon: "極小アイコンです",
  noAlt: "alt属性がありません",
  maybeDecorative: "装飾目的の可能性があります",
  weakAlt: "内容を説明していない可能性があります",
  altPresent: "alt属性があります",
  contextGenerate: "AI説明を生成",
  generationFailed: "生成に失敗しました",
  imageFetchFailed: "画像を取得できませんでした",
};

const dictionaries: Record<SupportedLocale, Record<keyof typeof en, string>> = { en, ja };
export type MessageKey = keyof typeof en;

export function resolveLocale(preference: LanguagePreference): SupportedLocale {
  if (preference === "en" || preference === "ja") return preference;
  const language =
    typeof chrome !== "undefined" && chrome.i18n
      ? chrome.i18n.getUILanguage()
      : typeof navigator !== "undefined"
        ? navigator.language
        : "en";
  return language.toLowerCase().startsWith("ja") ? "ja" : "en";
}
export function promptFor(locale: SupportedLocale): string {
  return prompts[locale];
}
export function t(locale: SupportedLocale, key: MessageKey, values: Record<string, string | number> = {}): string {
  return dictionaries[locale][key].replace(/\{(\w+)\}/g, (_match, name: string) => String(values[name] ?? `{${name}}`));
}
