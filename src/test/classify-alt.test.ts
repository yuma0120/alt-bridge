import { describe, expect, it } from "vitest";
import { classifyAlt } from "../content/index";

// Helper: call classifyAlt with minimal arguments
const classify = (
  alt: string | null,
  opts: {
    role?: string | null;
    ariaHidden?: string | null;
    inSvg?: boolean;
    isFavicon?: boolean;
    width?: number;
    height?: number;
  } = {},
) =>
  classifyAlt(
    alt,
    opts.role ?? null,
    opts.ariaHidden ?? null,
    opts.inSvg ?? false,
    opts.isFavicon ?? false,
    opts.width ?? 100,
    opts.height ?? 100,
    "en",
  );

describe("classifyAlt", () => {
  describe("excluded — decorative", () => {
    it("excludes role=presentation", () => {
      expect(classify("some text", { role: "presentation" }).category).toBe("excluded");
    });
    it("excludes aria-hidden=true", () => {
      expect(classify("some text", { ariaHidden: "true" }).category).toBe("excluded");
    });
  });

  describe("excluded — svg/favicon", () => {
    it("excludes images inside SVG", () => {
      expect(classify("some text", { inSvg: true }).category).toBe("excluded");
    });
    it("excludes favicon URLs", () => {
      expect(classify("some text", { isFavicon: true }).category).toBe("excluded");
    });
  });

  describe("excluded — small icon", () => {
    it("excludes 16x16 images", () => {
      expect(classify("some text", { width: 16, height: 16 }).category).toBe("excluded");
    });
    it("does NOT exclude 17x17 images", () => {
      expect(classify("some text", { width: 17, height: 17 }).category).not.toBe("excluded");
    });
  });

  describe("missing-alt", () => {
    it("classifies null alt as missing-alt", () => {
      expect(classify(null).category).toBe("missing-alt");
    });
  });

  describe("empty-alt", () => {
    it("classifies empty string alt as empty-alt", () => {
      expect(classify("").category).toBe("empty-alt");
    });
  });

  describe("suspicious-alt", () => {
    it("flags alt shorter than 3 characters", () => {
      expect(classify("ab").category).toBe("suspicious-alt");
    });
    it("flags generic alt 'image'", () => {
      expect(classify("image").category).toBe("suspicious-alt");
    });
    it("flags generic alt Japanese", () => {
      expect(classify("\u753b\u50cf").category).toBe("suspicious-alt");
    });
    it("flags filename-like alt", () => {
      expect(classify("photo_01.jpg").category).toBe("suspicious-alt");
    });
    it("flags URL alt", () => {
      expect(classify("https://example.com/img.png").category).toBe("suspicious-alt");
    });
  });

  describe("valid-alt", () => {
    it("accepts a descriptive alt text", () => {
      expect(classify("A dog running in the park").category).toBe("valid-alt");
    });
    it("accepts Japanese descriptive alt text", () => {
      expect(classify("\u516c\u5712\u3092\u8d70\u308b\u72ac").category).toBe("valid-alt");
    });
  });
});
