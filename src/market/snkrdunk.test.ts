import { describe, expect, it } from "vitest";
import { parseSnkrdunkQuote } from "@/market/snkrdunk";

describe("parseSnkrdunkQuote", () => {
  const chips = [
    { filterConditionId: "psa_10", hasListing: true, usedMinPrice: 180_000 },
    { filterConditionId: "psa_9", hasListing: false, usedMinPrice: null },
  ];

  it("returns floor price for matching grade with listing", () => {
    expect(parseSnkrdunkQuote({ chips }, "psa10")).toEqual({
      ok: true,
      unitPriceYen: 180_000,
    });
  });

  it("returns no_listing when grade chip has no listing", () => {
    expect(parseSnkrdunkQuote({ chips }, "psa9")).toEqual({
      ok: false,
      reason: "no_listing",
    });
  });

  it("returns invalid_response when chip is missing", () => {
    expect(parseSnkrdunkQuote({ chips: [] }, "psa10")).toEqual({
      ok: false,
      reason: "invalid_response",
    });
  });
});
