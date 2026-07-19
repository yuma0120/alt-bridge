import { describe, expect, it } from "vitest";
import { validateSettings } from "../shared/core";
import { DEFAULT_SETTINGS } from "../shared/core";

const base = { ...DEFAULT_SETTINGS };

describe("valid (options form validator)", () => {
  it("accepts default settings", () => {
    expect(validateSettings(base)).toBe(true);
  });

  it("rejects model name longer than 100 characters", () => {
    expect(validateSettings({ ...base, model: "a".repeat(101) })).toBe(false);
  });

  it("accepts model name of exactly 100 characters", () => {
    expect(validateSettings({ ...base, model: "a".repeat(100) })).toBe(true);
  });

  it("rejects empty prompt", () => {
    expect(validateSettings({ ...base, prompt: "" })).toBe(false);
  });

  it("rejects non-integer maxSize", () => {
    expect(validateSettings({ ...base, maxSize: 800.5 })).toBe(false);
  });

  it("rejects maxSize below 64", () => {
    expect(validateSettings({ ...base, maxSize: 63 })).toBe(false);
  });

  it("rejects maxSize above 8192", () => {
    expect(validateSettings({ ...base, maxSize: 8193 })).toBe(false);
  });

  it("rejects lowConfidenceThreshold below 0", () => {
    expect(validateSettings({ ...base, lowConfidenceThreshold: -0.01 })).toBe(false);
  });

  it("rejects highConfidenceThreshold above 1", () => {
    expect(validateSettings({ ...base, highConfidenceThreshold: 1.01 })).toBe(false);
  });

  it("rejects equal low and high thresholds", () => {
    expect(validateSettings({ ...base, lowConfidenceThreshold: 0.5, highConfidenceThreshold: 0.5 })).toBe(false);
  });

  it("rejects low threshold greater than high threshold", () => {
    expect(validateSettings({ ...base, lowConfidenceThreshold: 0.8, highConfidenceThreshold: 0.3 })).toBe(false);
  });

  it("accepts boundary values 0 and 1", () => {
    expect(validateSettings({ ...base, lowConfidenceThreshold: 0, highConfidenceThreshold: 1 })).toBe(true);
  });
});
