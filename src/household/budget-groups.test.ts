import { describe, expect, it } from "vitest";
import {
  BUDGET_GROUP_ORDER,
  budgetGroupLabel,
  validateBudgetGroup,
} from "@/household/budget-groups";

describe("validateBudgetGroup", () => {
  it("accepts null and known groups", () => {
    expect(validateBudgetGroup(null)).toBeNull();
    expect(validateBudgetGroup("needs")).toBeNull();
    expect(validateBudgetGroup("wants")).toBeNull();
    expect(validateBudgetGroup("savings")).toBeNull();
  });

  it("rejects unknown values", () => {
    expect(validateBudgetGroup("fun")).toMatch(/needs/i);
  });
});

describe("budgetGroupLabel", () => {
  it("maps known groups and null", () => {
    expect(budgetGroupLabel("needs")).toBe("Needs");
    expect(budgetGroupLabel(null)).toBe("Other");
  });
});

describe("BUDGET_GROUP_ORDER", () => {
  it("lists groups in display order", () => {
    expect(BUDGET_GROUP_ORDER).toEqual(["needs", "wants", "savings"]);
  });
});
