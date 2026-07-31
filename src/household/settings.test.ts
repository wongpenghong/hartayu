import { describe, expect, it } from "vitest";
import { validatePocketName } from "@/household/pockets";
import { validateCategoryName, validateCategoryLimit } from "@/household/categories";

describe("validatePocketName", () => {
  it("rejects empty names", () => {
    expect(validatePocketName("   ")).toBe("Pocket name is required.");
  });

  it("accepts trimmed names", () => {
    expect(validatePocketName(" Shared cash ")).toBeNull();
  });
});

describe("validateCategoryName", () => {
  it("rejects empty names", () => {
    expect(validateCategoryName("")).toBe("Category name is required.");
  });

  it("accepts valid names", () => {
    expect(validateCategoryName("Subscriptions")).toBeNull();
  });
});

describe("validateCategoryLimit", () => {
  it("accepts null and positive yen", () => {
    expect(validateCategoryLimit(null)).toBeNull();
    expect(validateCategoryLimit(50_000)).toBeNull();
  });

  it("rejects non-positive budgets", () => {
    expect(validateCategoryLimit(0)).toBe("Budget must be a positive whole yen amount.");
  });
});
