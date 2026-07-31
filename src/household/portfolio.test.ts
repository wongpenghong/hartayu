import { describe, expect, it } from "vitest";
import { validateAssetClassName } from "@/household/asset-classes";
import { validateCostBasis, validateHoldingName, validateHoldingQuantity } from "@/household/holdings";
import { validateSnapshotLine } from "@/household/snapshots";

describe("validateAssetClassName", () => {
  it("rejects empty names", () => {
    expect(validateAssetClassName("")).toBe("Asset class name is required.");
  });
});

describe("validateHoldingName", () => {
  it("accepts trimmed names", () => {
    expect(validateHoldingName(" VTI ")).toBeNull();
  });
});

describe("validateHoldingQuantity", () => {
  it("accepts null and positive numbers", () => {
    expect(validateHoldingQuantity(null)).toBeNull();
    expect(validateHoldingQuantity(1.5)).toBeNull();
  });

  it("rejects non-positive numbers", () => {
    expect(validateHoldingQuantity(0)).toBe("Quantity must be a positive number.");
  });
});

describe("validateCostBasis", () => {
  it("accepts null and positive integers", () => {
    expect(validateCostBasis(null)).toBeNull();
    expect(validateCostBasis(100_000)).toBeNull();
  });
});

describe("validateSnapshotLine", () => {
  it("accepts skipped lines without values", () => {
    expect(validateSnapshotLine(true, { holdingId: "h1", skipped: true })).toBeNull();
  });

  it("requires unit price when holding has quantity", () => {
    expect(
      validateSnapshotLine(true, { holdingId: "h1", unitPriceYen: 1000 }),
    ).toBeNull();
    expect(validateSnapshotLine(true, { holdingId: "h1" })).toBe(
      "Enter a positive unit price in yen.",
    );
  });

  it("requires total value for total-value-only holdings", () => {
    expect(
      validateSnapshotLine(false, { holdingId: "h1", totalValueYen: 500_000 }),
    ).toBeNull();
  });
});

describe("resolveSnapshotInsert", () => {
  it("rejects carry-forward when no prior snapshot exists", async () => {
    const { resolveSnapshotInsert } = await import("@/household/snapshots");
    expect(() =>
      resolveSnapshotInsert(
        { holdingId: "h1", skipped: true },
        true,
        new Map(),
      ),
    ).toThrow("No prior value to carry forward");
  });
});
