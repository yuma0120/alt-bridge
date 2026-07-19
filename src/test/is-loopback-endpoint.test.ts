import { describe, expect, it } from "vitest";
import { isLoopbackEndpoint } from "../shared/core";

describe("isLoopbackEndpoint", () => {
  it("returns true for 127.0.0.1", () => {
    expect(isLoopbackEndpoint("http://127.0.0.1:8788")).toBe(true);
  });
  it("returns true for localhost", () => {
    expect(isLoopbackEndpoint("http://localhost:8788")).toBe(true);
  });
  it("returns true for ::1 (IPv6)", () => {
    expect(isLoopbackEndpoint("http://[::1]:8788")).toBe(true);
  });
  it("returns false for LAN IP", () => {
    expect(isLoopbackEndpoint("http://192.168.1.100:8788")).toBe(false);
  });
  it("returns false for public hostname", () => {
    expect(isLoopbackEndpoint("https://example.com")).toBe(false);
  });
  it("returns false for malformed URL", () => {
    expect(isLoopbackEndpoint("not-a-url")).toBe(false);
  });
  it("ignores trailing slash", () => {
    expect(isLoopbackEndpoint("http://127.0.0.1:8788/")).toBe(true);
  });
});
