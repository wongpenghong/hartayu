import { describe, expect, it } from "vitest";
import {
  deriveYenFromIdr,
  formatExchangeRateInput,
  parseExchangeRateInput,
  resolveEntryAmountYen,
} from "@/lib/format-idr-rate";

describe("parseExchangeRateInput", () => {
  it("parses positive decimal rates", () => {
    expect(parseExchangeRateInput("0.0095")).toBe(0.0095);
    expect(parseExchangeRateInput("0,0095")).toBe(0.0095);
  });

  it("rejects empty, zero, and invalid values", () => {
    expect(parseExchangeRateInput("")).toBeNull();
    expect(parseExchangeRateInput("0")).toBeNull();
    expect(parseExchangeRateInput("-0.01")).toBeNull();
    expect(parseExchangeRateInput("abc")).toBeNull();
  });
});

describe("formatExchangeRateInput", () => {
  it("stringifies the stored rate", () => {
    expect(formatExchangeRateInput(0.0095)).toBe("0.0095");
  });
});

describe("deriveYenFromIdr", () => {
  it("rounds IDR times rate to whole yen", () => {
    expect(deriveYenFromIdr(15_000_000, 0.0095)).toBe(142_500);
    expect(deriveYenFromIdr(150_000, 0.0095)).toBe(1_425);
  });
});

describe("resolveEntryAmountYen", () => {
  it("prefers a typed yen amount", () => {
    expect(resolveEntryAmountYen(2_000, 150_000, 0.0095)).toBe(2_000);
  });

  it("derives yen from IDR and rate when yen is missing", () => {
    expect(resolveEntryAmountYen(null, 150_000, 0.0095)).toBe(1_425);
  });

  it("returns null when neither yen nor IDR+rate is available", () => {
    expect(resolveEntryAmountYen(null, null, null)).toBeNull();
    expect(resolveEntryAmountYen(null, 150_000, null)).toBeNull();
  });
});
