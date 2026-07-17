import { describe, expect, it } from "vitest";
import { validatePocketName } from "@/household/pockets";
import { validateCategoryName } from "@/household/categories";

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
