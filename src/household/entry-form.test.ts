import { describe, expect, it } from "vitest";
import { validateEntryDraft } from "@/household/entry-form";
import { formatYenInput, parseYenInput, todayInTokyo } from "@/lib/format-yen";

describe("parseYenInput", () => {
  it("parses plain and formatted yen strings", () => {
    expect(parseYenInput("1200")).toBe(1200);
    expect(parseYenInput("¥1,200")).toBe(1200);
    expect(parseYenInput(" 2,500 ")).toBe(2500);
  });

  it("rejects empty, zero, decimal, and negative amounts", () => {
    expect(parseYenInput("")).toBeNull();
    expect(parseYenInput("0")).toBeNull();
    expect(parseYenInput("12.5")).toBeNull();
    expect(parseYenInput("-100")).toBeNull();
  });
});

describe("formatYenInput", () => {
  it("formats integers with yen symbol", () => {
    expect(formatYenInput(1200)).toBe("¥1,200");
  });
});

describe("todayInTokyo", () => {
  it("returns an ISO date in Asia/Tokyo", () => {
    expect(todayInTokyo(new Date("2026-07-17T14:00:00Z"))).toBe("2026-07-17");
    expect(todayInTokyo(new Date("2026-07-17T16:00:00Z"))).toBe("2026-07-18");
  });
});

describe("validateEntryDraft", () => {
  const validDraft = {
    kind: "expense" as const,
    amountYen: 1500,
    pocketId: "pocket-a",
    categoryId: "cat-a",
    entryDate: "2026-07-17",
    note: "",
  };

  it("accepts a complete draft", () => {
    expect(validateEntryDraft(validDraft)).toBeNull();
  });

  it("requires amount, pocket, category, and date", () => {
    expect(
      validateEntryDraft({ ...validDraft, amountYen: null }),
    ).toMatch(/amount/i);
    expect(validateEntryDraft({ ...validDraft, pocketId: "" })).toMatch(
      /pocket/i,
    );
    expect(validateEntryDraft({ ...validDraft, categoryId: "" })).toMatch(
      /category/i,
    );
    expect(validateEntryDraft({ ...validDraft, entryDate: "" })).toMatch(
      /date/i,
    );
  });
});
