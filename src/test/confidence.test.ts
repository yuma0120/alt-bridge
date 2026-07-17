import { describe, expect, it } from "vitest";
import { confidenceMessage, DEFAULT_SETTINGS } from "../shared/core";

describe("confidenceMessage", () => {
  it("uses the configured low, medium, and high thresholds", () => {
    expect(confidenceMessage(0.39, DEFAULT_SETTINGS)).toContain("could not recognize");
    expect(confidenceMessage(0.4, DEFAULT_SETTINGS)).toContain("uncertain");
    expect(confidenceMessage(0.7, DEFAULT_SETTINGS)).toBe("AI-generated description");
  });
});
