import { describe, expect, it } from "vitest";
import { confidenceMessage, DEFAULT_SETTINGS } from "../shared/core";

describe("confidenceMessage", () => {
  it("低・中・高を閾値どおりに表示する", () => {
    expect(confidenceMessage(0.39, DEFAULT_SETTINGS)).toContain("うまく認識");
    expect(confidenceMessage(0.4, DEFAULT_SETTINGS)).toContain("不確かな");
    expect(confidenceMessage(0.7, DEFAULT_SETTINGS)).toBe("AIによる説明");
  });
});
