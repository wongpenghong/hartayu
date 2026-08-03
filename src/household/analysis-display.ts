import type { Entry } from "@/ledger/types";
import {
  expenseTotalsByCategory,
  monthlyTotals,
} from "@/ledger/ledger";
import {
  budgetCycleDayStats,
  budgetCycleLabel,
  budgetCyclePeriodKey,
  budgetCyclePickerOptions,
} from "@/lib/budget-cycle";
import { shiftMonth } from "@/lib/format-yen";

export type AnalysisQuickSummary = {
  avgDailySpendYen: number;
  topExpenseCategoryId: string | null;
  topExpenseCategoryYen: number;
  savingsYen: number;
  savingsRatio: number | null;
};

export type IncomeExpenseMonthPoint = {
  id: string;
  year: number;
  month: number;
  label: string;
  incomeYen: number;
  expenseYen: number;
};

function spendDaysForCycle(
  year: number,
  month: number,
  today: string,
): number {
  const { daysElapsed, inCycle } = budgetCycleDayStats(year, month, today);
  return inCycle ? Math.max(daysElapsed, 1) : daysElapsed;
}

export function analysisQuickSummary(
  entries: Entry[],
  year: number,
  month: number,
  today: string,
): AnalysisQuickSummary {
  const totals = monthlyTotals(entries, year, month);
  const spendDays = spendDaysForCycle(year, month, today);
  const topExpense = expenseTotalsByCategory(entries, year, month)[0];

  return {
    avgDailySpendYen:
      spendDays > 0 ? Math.round(totals.expenseYen / spendDays) : 0,
    topExpenseCategoryId: topExpense?.id ?? null,
    topExpenseCategoryYen: topExpense?.totalYen ?? 0,
    savingsYen: totals.netYen,
    savingsRatio:
      totals.incomeYen > 0 ? totals.netYen / totals.incomeYen : null,
  };
}

export function formatSavingsRatio(ratio: number | null): string {
  if (ratio == null) {
    return "—";
  }

  return `${Math.round(ratio * 100)}%`;
}

export function incomeExpenseChartPoints(
  entries: Entry[],
  endYear: number,
  endMonth: number,
  count = 6,
): IncomeExpenseMonthPoint[] {
  const points: IncomeExpenseMonthPoint[] = [];
  let year = endYear;
  let month = endMonth;

  for (let index = 0; index < count; index += 1) {
    const totals = monthlyTotals(entries, year, month);
    points.unshift({
      id: budgetCyclePeriodKey(year, month),
      year,
      month,
      label: budgetCycleLabel(year, month),
      incomeYen: totals.incomeYen,
      expenseYen: totals.expenseYen,
    });
    ({ year, month } = shiftMonth(year, month, -1));
  }

  return points;
}

export function monthPickerOptions(
  endYear: number,
  endMonth: number,
  count = 24,
): Array<{ year: number; month: number; label: string; value: string }> {
  return budgetCyclePickerOptions(endYear, endMonth, count);
}
