import { describe, expect, it } from "vitest";
import {
  budgetTotalsFromRows,
  formatBudgetDayCount,
  formatBudgetPaceHint,
  formatBudgetRowSummary,
  formatBudgetSectionTitle,
  formatBudgetUsage,
  homeBudgetHighlightRows,
  homeGlanceNetLine,
} from "@/household/budget-display";

describe("formatBudgetDayCount", () => {
  it("uses singular for one day", () => {
    expect(formatBudgetDayCount(1)).toBe("1 day left");
    expect(formatBudgetDayCount(3)).toBe("3 days left");
  });
});

describe("formatBudgetPaceHint", () => {
  it("shows over copy when remaining is negative", () => {
    expect(
      formatBudgetPaceHint({
        daysInMonth: 31,
        daysElapsed: 30,
        daysLeft: 1,
        spentYen: 9_810,
        limitYen: 1_000,
        remainingYen: -8_810,
        projectedSpendYen: 9_810,
        dailyAllowanceYen: -8_810,
      }),
    ).toBe("Over by ¥8,810");
  });

  it("shows daily allowance when under budget", () => {
    expect(
      formatBudgetPaceHint({
        daysInMonth: 31,
        daysElapsed: 15,
        daysLeft: 16,
        spentYen: 15_000,
        limitYen: 30_000,
        remainingYen: 15_000,
        projectedSpendYen: 31_000,
        dailyAllowanceYen: 938,
      }),
    ).toBe("16 days left · ¥938/day left");
  });
});

describe("formatBudgetUsage", () => {
  it("formats spent against limit", () => {
    expect(formatBudgetUsage(9_810, 1_000)).toBe("¥9,810 of ¥1,000");
  });
});

describe("formatBudgetRowSummary", () => {
  it("marks over-budget rows", () => {
    expect(formatBudgetRowSummary(9_810, 1_000)).toEqual({
      usage: "¥9,810 of ¥1,000",
      remaining: "¥8,810 over",
      over: true,
    });
  });
});

describe("formatBudgetSectionTitle", () => {
  it("includes group totals", () => {
    expect(formatBudgetSectionTitle("Wants", 9_810, 1_000)).toBe(
      "Wants · ¥9,810 of ¥1,000",
    );
  });
});

describe("budgetTotalsFromRows", () => {
  it("sums spent and limit", () => {
    expect(
      budgetTotalsFromRows([
        { spentYen: 9_810, limitYen: 1_000 },
        { spentYen: 669, limitYen: 8_000 },
      ]),
    ).toEqual({ spentYen: 10_479, limitYen: 9_000 });
  });
});

describe("homeBudgetHighlightRows", () => {
  it("prioritizes over-budget and tight categories", () => {
    const rows = [
      { categoryId: "a", spentYen: 669, limitYen: 8_000, remainingYen: 7_331 },
      { categoryId: "b", spentYen: 9_810, limitYen: 1_000, remainingYen: -8_810 },
      { categoryId: "c", spentYen: 90, limitYen: 8_000, remainingYen: 7_910 },
    ];

    expect(homeBudgetHighlightRows(rows, 2).map((row) => row.categoryId)).toEqual([
      "b",
      "a",
    ]);
  });
});

describe("homeGlanceNetLine", () => {
  it("formats monthly net as a sub-line", () => {
    expect(homeGlanceNetLine(-11_292)).toEqual({
      label: "Net this cycle −¥11,292",
      toneClass: "text-[#ff3b30]",
    });
  });
});
