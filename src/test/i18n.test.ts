import { describe, expect, it } from "vitest";
import { promptFor, resolveLocale, t } from "../i18n";

describe("internationalization", () => {
  it("uses an explicit language preference", () => {
    expect(resolveLocale("ja")).toBe("ja");
    expect(resolveLocale("en")).toBe("en");
  });

  it("uses language-specific UI strings and prompt presets", () => {
    expect(t("ja", "generate")).toBe("AI説明を生成");
    expect(promptFor("ja")).toContain("日本語で回答");
    expect(promptFor("en")).toContain("Respond in English");
  });
});
