import { describe, expect, it } from "vitest";
import { confidenceMessage, DEFAULT_SETTINGS } from "../shared/core";

describe("confidenceMessage", () => {
  it("uses the configured low, medium, and high thresholds in English", () => {
    const settings = { ...DEFAULT_SETTINGS, language: "en" as const };
    expect(confidenceMessage(0.39, settings)).toContain("could not recognize");
    expect(confidenceMessage(0.4, settings)).toContain("uncertain");
    expect(confidenceMessage(0.7, settings)).toBe("AI-generated description");
  });

  it("localizes confidence messages in Japanese", () => {
    const settings = { ...DEFAULT_SETTINGS, language: "ja" as const };
    expect(confidenceMessage(0.39, settings)).toContain("うまく認識");
  });
});
