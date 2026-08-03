import { describe, expect, it, beforeEach } from "vitest";
import {
  budgetCycleDateRange,
  budgetCycleDayStats,
  currentBudgetCycleInTokyo,
  entryInBudgetCycle,
  payMonthForDate,
} from "@/lib/budget-cycle";
import {
  DEFAULT_BUDGET_CYCLE_END_DAY,
  DEFAULT_BUDGET_CYCLE_START_DAY,
  setBudgetCycleConfig,
} from "@/lib/budget-cycle-config";

beforeEach(() => {
  setBudgetCycleConfig({
    startDay: DEFAULT_BUDGET_CYCLE_START_DAY,
    endDay: DEFAULT_BUDGET_CYCLE_END_DAY,
  });
});

describe("budgetCycleDateRange", () => {
  it("defaults to calendar month", () => {
    expect(budgetCycleDateRange(2026, 2)).toEqual({
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
  });

  it("supports spanning cycles", () => {
    expect(
      budgetCycleDateRange(2026, 7, { startDay: 24, endDay: 23 }),
    ).toEqual({
      startDate: "2026-07-24",
      endDate: "2026-08-23",
    });
  });

  it("supports same-month cycles", () => {
    expect(
      budgetCycleDateRange(2026, 7, { startDay: 5, endDay: 20 }),
    ).toEqual({
      startDate: "2026-07-05",
      endDate: "2026-07-20",
    });
  });
});

describe("payMonthForDate", () => {
  it("uses calendar month by default", () => {
    expect(payMonthForDate("2026-08-03")).toEqual({ year: 2026, month: 8 });
  });

  it("uses the previous month before a spanning start day", () => {
    expect(
      payMonthForDate("2026-08-03", { startDay: 24, endDay: 23 }),
    ).toEqual({ year: 2026, month: 7 });
  });

  it("uses the current month on a spanning start day", () => {
    expect(
      payMonthForDate("2026-08-24", { startDay: 24, endDay: 23 }),
    ).toEqual({ year: 2026, month: 8 });
  });
});

describe("entryInBudgetCycle", () => {
  it("includes entries inside a spanning cycle", () => {
    const config = { startDay: 24, endDay: 23 };
    expect(entryInBudgetCycle("2026-07-24", 2026, 7, config)).toBe(true);
    expect(entryInBudgetCycle("2026-08-23", 2026, 7, config)).toBe(true);
    expect(entryInBudgetCycle("2026-07-23", 2026, 7, config)).toBe(false);
    expect(entryInBudgetCycle("2026-08-24", 2026, 7, config)).toBe(false);
  });
});

describe("currentBudgetCycleInTokyo", () => {
  it("labels the active calendar month by default", () => {
    const cycle = currentBudgetCycleInTokyo(new Date("2026-08-03T12:00:00+09:00"));
    expect(cycle.year).toBe(2026);
    expect(cycle.month).toBe(8);
    expect(cycle.startDate).toBe("2026-08-01");
    expect(cycle.endDate).toBe("2026-08-31");
    expect(cycle.label).toBe("Aug 2026 · 1 Aug – 31 Aug");
  });
});

describe("budgetCycleDayStats", () => {
  it("counts elapsed and remaining days inside a spanning cycle", () => {
    setBudgetCycleConfig({ startDay: 24, endDay: 23 });
    expect(budgetCycleDayStats(2026, 7, "2026-08-03")).toEqual({
      totalDays: 31,
      daysElapsed: 11,
      daysLeft: 21,
      inCycle: true,
    });
  });
});
