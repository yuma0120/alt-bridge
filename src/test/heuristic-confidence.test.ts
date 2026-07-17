import { describe, expect, it } from "vitest";
import { estimateCaptionConfidence } from "../../ollama-proxy/confidence";

describe("estimateCaptionConfidence", () => {
  it("marks a missing-image response as very low reliability", () => {
    expect(estimateCaptionConfidence("Please provide the image you would like me to describe.").confidence).toBe(0.05);
  });

  it("rewards concrete visual detail without claiming provider confidence", () => {
    expect(estimateCaptionConfidence("A red car is parked beside a tree on a city street.").confidence).toBeGreaterThan(0.65);
  });
});
