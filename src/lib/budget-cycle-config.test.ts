import { describe, expect, it, beforeEach } from "vitest";
import {
  budgetCycleDateRange,
  entryInBudgetCycle,
  payMonthForDate,
} from "@/lib/budget-cycle";
import {
  DEFAULT_BUDGET_CYCLE_END_DAY,
  DEFAULT_BUDGET_CYCLE_START_DAY,
  getBudgetCycleEndDay,
  getBudgetCycleStartDay,
  normalizeBudgetCycleConfig,
  setBudgetCycleConfig,
  validateBudgetCycleConfig,
} from "@/lib/budget-cycle-config";

describe("validateBudgetCycleConfig", () => {
  it("accepts calendar and spanning cycles", () => {
    expect(validateBudgetCycleConfig(1, 31)).toBeNull();
    expect(validateBudgetCycleConfig(24, 23)).toBeNull();
    expect(validateBudgetCycleConfig(5, 5)).not.toBeNull();
  });
});

describe("normalizeBudgetCycleConfig", () => {
  it("pairs pay-day starts with the prior day as end", () => {
    expect(normalizeBudgetCycleConfig(24, 31)).toEqual({
      startDay: 24,
      endDay: 23,
    });
  });
});

describe("setBudgetCycleConfig", () => {
  beforeEach(() => {
    setBudgetCycleConfig({
      startDay: DEFAULT_BUDGET_CYCLE_START_DAY,
      endDay: DEFAULT_BUDGET_CYCLE_END_DAY,
    });
  });

  it("changes spanning cycle math when updated", () => {
    setBudgetCycleConfig({ startDay: 24, endDay: 23 });
    expect(getBudgetCycleStartDay()).toBe(24);
    expect(getBudgetCycleEndDay()).toBe(23);
    expect(payMonthForDate("2026-08-24")).toEqual({ year: 2026, month: 8 });
    expect(budgetCycleDateRange(2026, 8)).toEqual({
      startDate: "2026-08-24",
      endDate: "2026-09-23",
    });
    expect(entryInBudgetCycle("2026-08-24", 2026, 8)).toBe(true);
  });
});
