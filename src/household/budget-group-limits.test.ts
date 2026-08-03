import { describe, expect, it } from "vitest";
import {
  buildBudgetSections,
  effectiveGroupLimitYen,
  formatOverAllocationWarning,
  groupOverAllocationYen,
  sumCategoryLimitsByGroup,
  type BudgetGroupLimits,
} from "@/household/budget-group-limits";
import type { Category } from "@/household/categories";

const emptyLimits: BudgetGroupLimits = {
  needs: null,
  wants: null,
  savings: null,
};

function expenseCategory(
  overrides: Partial<Category> & Pick<Category, "id" | "name">,
): Category {
  return {
    household_id: "household-1",
    kind: "expense",
    is_starter: false,
    monthly_limit_yen: null,
    budget_group: null,
    emoji: null,
    ...overrides,
  };
}

describe("sumCategoryLimitsByGroup", () => {
  it("sums expense category limits by budget group", () => {
    expect(
      sumCategoryLimitsByGroup([
        expenseCategory({
          id: "food",
          name: "Food",
          budget_group: "needs",
          monthly_limit_yen: 300_000,
        }),
        expenseCategory({
          id: "fun",
          name: "Fun",
          budget_group: "wants",
          monthly_limit_yen: 100_000,
        }),
        expenseCategory({
          id: "skip",
          name: "Skip",
          budget_group: "needs",
          monthly_limit_yen: null,
        }),
      ]),
    ).toEqual({
      needs: 300_000,
      wants: 100_000,
      savings: 0,
    });
  });
});

describe("effectiveGroupLimitYen", () => {
  it("uses explicit cap when set", () => {
    expect(
      effectiveGroupLimitYen("needs", { ...emptyLimits, needs: 500_000 }, 300_000),
    ).toBe(500_000);
  });

  it("falls back to allocated category limits", () => {
    expect(effectiveGroupLimitYen("needs", emptyLimits, 300_000)).toBe(300_000);
  });
});

describe("groupOverAllocationYen", () => {
  it("returns null when cap is derived", () => {
    expect(groupOverAllocationYen("needs", emptyLimits, 550_000)).toBeNull();
  });

  it("returns the gap when explicit cap is lower than allocation", () => {
    expect(
      groupOverAllocationYen("needs", { ...emptyLimits, needs: 500_000 }, 550_000),
    ).toBe(50_000);
  });
});

describe("formatOverAllocationWarning", () => {
  it("names the group and amount", () => {
    expect(formatOverAllocationWarning("needs", 50_000)).toBe(
      "Needs over-allocated by ¥50,000",
    );
  });
});

describe("buildBudgetSections", () => {
  it("uses explicit caps and flags over-allocation", () => {
    const food = expenseCategory({
      id: "food",
      name: "Food",
      budget_group: "needs",
      monthly_limit_yen: 300_000,
    });
    const transport = expenseCategory({
      id: "transport",
      name: "Transport",
      budget_group: "needs",
      monthly_limit_yen: 250_000,
    });

    const sections = buildBudgetSections(
      [
        { category: food, spentYen: 280_000 },
        { category: transport, spentYen: 140_000 },
      ],
      { ...emptyLimits, needs: 500_000 },
    );

    expect(sections).toHaveLength(1);
    expect(sections[0]).toMatchObject({
      key: "needs",
      spentYen: 420_000,
      limitYen: 500_000,
      overAllocationYen: 50_000,
      showGroupCap: true,
    });
  });

  it("shows a group with an explicit cap even before categories are budgeted", () => {
    const sections = buildBudgetSections([], { ...emptyLimits, wants: 300_000 });

    expect(sections).toEqual([
      expect.objectContaining({
        key: "wants",
        spentYen: 0,
        limitYen: 300_000,
        rows: [],
        showGroupCap: true,
      }),
    ]);
  });
});
