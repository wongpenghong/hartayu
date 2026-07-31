import { describe, expect, it } from "vitest";
import { validateEntryDraft, validateTransferDraft } from "@/household/entry-form";
import { formatIdrInput, formatIdrInputLive, parseIdrInput } from "@/lib/format-idr";
import { formatYenInput, formatYenInputLive, parseYenInput, todayInTokyo } from "@/lib/format-yen";

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

describe("formatYenInputLive", () => {
  it("adds grouping separators while typing", () => {
    expect(formatYenInputLive("1000")).toBe("1,000");
    expect(formatYenInputLive("1000000")).toBe("1,000,000");
  });

  it("returns empty for blank input", () => {
    expect(formatYenInputLive("")).toBe("");
    expect(formatYenInputLive("¥,")).toBe("");
  });
});

describe("todayInTokyo", () => {
  it("returns an ISO date in Asia/Tokyo", () => {
    expect(todayInTokyo(new Date("2026-07-17T14:00:00Z"))).toBe("2026-07-17");
    expect(todayInTokyo(new Date("2026-07-17T16:00:00Z"))).toBe("2026-07-18");
  });
});

describe("parseIdrInput", () => {
  it("parses plain and formatted rupiah strings", () => {
    expect(parseIdrInput("150000")).toBe(150_000);
    expect(parseIdrInput("Rp150.000")).toBe(150_000);
    expect(parseIdrInput(" 2.500.000 ")).toBe(2_500_000);
  });

  it("rejects empty, zero, decimal, and negative amounts", () => {
    expect(parseIdrInput("")).toBeNull();
    expect(parseIdrInput("0")).toBeNull();
    expect(parseIdrInput("12.5")).toBeNull();
    expect(parseIdrInput("-100")).toBeNull();
  });
});

describe("formatIdrInput", () => {
  it("formats integers with rupiah prefix", () => {
    expect(formatIdrInput(150_000)).toBe("Rp150.000");
  });
});

describe("formatIdrInputLive", () => {
  it("adds grouping separators while typing", () => {
    expect(formatIdrInputLive("150000")).toBe("150.000");
  });
});

describe("validateEntryDraft", () => {
  const validDraft = {
    kind: "expense" as const,
    amountYen: 1500,
    foreignAmountIdr: null,
    exchangeRateIdrToJpy: null,
    pocketId: "pocket-a",
    categoryId: "cat-a",
    entryDate: "2026-07-17",
    note: "",
  };

  it("accepts a complete draft", () => {
    expect(validateEntryDraft(validDraft)).toBeNull();
  });

  it("accepts JPY with optional IDR", () => {
    expect(
      validateEntryDraft({ ...validDraft, foreignAmountIdr: 35_000_000 }),
    ).toBeNull();
  });

  it("accepts IDR with exchange rate and no typed yen", () => {
    expect(
      validateEntryDraft({
        ...validDraft,
        amountYen: null,
        foreignAmountIdr: 150_000,
        exchangeRateIdrToJpy: 0.0095,
      }),
    ).toBeNull();
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

  it("rejects invalid IDR when JPY is valid", () => {
    expect(
      validateEntryDraft({ ...validDraft, foreignAmountIdr: 0 }),
    ).toMatch(/idr/i);
    expect(
      validateEntryDraft({ ...validDraft, foreignAmountIdr: -100 }),
    ).toMatch(/idr/i);
  });

  it("rejects IDR without rate or yen", () => {
    expect(
      validateEntryDraft({
        ...validDraft,
        amountYen: null,
        foreignAmountIdr: 150_000,
      }),
    ).toMatch(/exchange rate/i);
  });

  it("rejects rate without IDR or yen", () => {
    expect(
      validateEntryDraft({
        ...validDraft,
        amountYen: null,
        exchangeRateIdrToJpy: 0.0095,
      }),
    ).toMatch(/foreign amount/i);
  });
});

describe("validateTransferDraft", () => {
  const validDraft = {
    amountYen: 10_000,
    fromPocketId: "pocket-a",
    toPocketId: "pocket-b",
    entryDate: "2026-07-17",
    note: "",
  };

  it("accepts a complete transfer draft", () => {
    expect(validateTransferDraft(validDraft)).toBeNull();
  });

  it("requires distinct pockets and positive amount", () => {
    expect(
      validateTransferDraft({ ...validDraft, amountYen: null }),
    ).toMatch(/amount/i);
    expect(
      validateTransferDraft({ ...validDraft, fromPocketId: "" }),
    ).toMatch(/source/i);
    expect(
      validateTransferDraft({ ...validDraft, toPocketId: "" }),
    ).toMatch(/destination/i);
    expect(
      validateTransferDraft({ ...validDraft, toPocketId: "pocket-a" }),
    ).toMatch(/differ/i);
  });
});
