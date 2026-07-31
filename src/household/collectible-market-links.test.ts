import { describe, expect, it } from "vitest";
import {
  hasMarketLinkInput,
  holdingShowsNoQuote,
  validateCollectibleCode,
  validateConditionGrade,
  validateMarketLinkInput,
  validateSnkrdunkProductId,
} from "@/household/collectible-market-links";

describe("validateCollectibleCode", () => {
  it("requires non-empty code", () => {
    expect(validateCollectibleCode("")).toBe("Collectible code is required.");
  });
});

describe("validateSnkrdunkProductId", () => {
  it("accepts positive integers", () => {
    expect(validateSnkrdunkProductId("854923")).toBeNull();
  });

  it("rejects non-numeric values", () => {
    expect(validateSnkrdunkProductId("abc")).toBe(
      "SNKRDUNK product ID must be a positive number.",
    );
  });
});

describe("validateConditionGrade", () => {
  it("accepts supported grades", () => {
    expect(validateConditionGrade("psa10")).toBeNull();
  });

  it("rejects unknown grades", () => {
    expect(validateConditionGrade("bgs10")).toBe("Choose a condition grade.");
  });
});

describe("validateMarketLinkInput", () => {
  it("accepts empty optional input", () => {
    expect(
      validateMarketLinkInput({
        collectibleCode: "",
        snkrdunkProductId: "",
        conditionGrade: "",
      }),
    ).toBeNull();
  });

  it("requires all fields when any field is set", () => {
    expect(
      validateMarketLinkInput({
        collectibleCode: "P-159",
        snkrdunkProductId: "",
        conditionGrade: "",
      }),
    ).toBe("SNKRDUNK product ID is required.");
  });
});

describe("hasMarketLinkInput", () => {
  it("detects partial input", () => {
    expect(
      hasMarketLinkInput({
        collectibleCode: "P-159",
        snkrdunkProductId: "",
        conditionGrade: "",
      }),
    ).toBe(true);
  });
});

describe("holdingShowsNoQuote", () => {
  it("shows no quote when fetch failed", () => {
    expect(
      holdingShowsNoQuote(
        {
          holdingId: "h1",
          collectibleCode: "P-159",
          snkrdunkProductId: 1,
          conditionGrade: "psa10",
          lastFetchedAt: "2026-07-31T00:00:00Z",
          lastFetchError: "No listing at this grade",
        },
        undefined,
      ),
    ).toBe(true);
  });
});
