import { vi } from "vitest";

// chrome API スタブ: content/index.ts や background/index.ts をインポートしても
// クラッシュしないように、最低限の chrome グローバルを用意する。
const chromeMock = {
  runtime: {
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
  },
  storage: {
    sync: { get: vi.fn(), set: vi.fn() },
    local: { get: vi.fn(), set: vi.fn() },
    onChanged: { addListener: vi.fn() },
  },
  tabs: { query: vi.fn(), sendMessage: vi.fn() },
  contextMenus: { create: vi.fn(), removeAll: vi.fn(), onClicked: { addListener: vi.fn() } },
  i18n: { getUILanguage: vi.fn(() => "en") },
};

// @ts-expect-error chrome は Node.js 環境に存在しない
globalThis.chrome = chromeMock;

// document スタブ: options/index.ts のトップレベルが document.querySelector を呼ぶため
if (typeof document === "undefined") {
  const documentMock = {
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    createElement: vi.fn(() => ({ textContent: "", innerHTML: "" })),
    documentElement: { lang: "" },
  };
  // @ts-expect-error document は Node.js 環境に存在しない
  globalThis.document = documentMock;
}
