import { describe, expect, it } from "vitest";
import { normalizeEmoji, validateEmoji } from "@/household/emoji-utils";

describe("validateEmoji", () => {
  it("accepts null and empty values", () => {
    expect(validateEmoji(null)).toBeNull();
    expect(validateEmoji("")).toBeNull();
    expect(validateEmoji("   ")).toBeNull();
  });

  it("accepts one or two graphemes", () => {
    expect(validateEmoji("🍜")).toBeNull();
    expect(validateEmoji("🏖️")).toBeNull();
  });

  it("rejects long strings", () => {
    expect(validateEmoji("abc")).toMatch(/emoji/i);
  });
});

describe("normalizeEmoji", () => {
  it("trims and drops empty strings", () => {
    expect(normalizeEmoji(" 🎯 ")).toBe("🎯");
    expect(normalizeEmoji("")).toBeNull();
    expect(normalizeEmoji(null)).toBeNull();
  });
});
