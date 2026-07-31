import type { Entry } from "@/ledger/types";
import {
  daysInMonth,
  expenseTotalsByCategory,
  monthlyTotals,
} from "@/ledger/ledger";
import { formatMonthLabel, shiftMonth } from "@/lib/format-yen";

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

function spendDaysForMonth(
  year: number,
  month: number,
  today: string,
): number {
  const [todayYear, todayMonth, todayDay] = today.split("-").map(Number);
  const totalDays = daysInMonth(year, month);

  if (todayYear === year && todayMonth === month) {
    return Math.max(todayDay, 1);
  }

  return totalDays;
}

export function analysisQuickSummary(
  entries: Entry[],
  year: number,
  month: number,
  today: string,
): AnalysisQuickSummary {
  const totals = monthlyTotals(entries, year, month);
  const spendDays = spendDaysForMonth(year, month, today);
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
      id: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      label: formatMonthLabel(year, month),
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
  const options: Array<{ year: number; month: number; label: string; value: string }> =
    [];
  let year = endYear;
  let month = endMonth;

  for (let index = 0; index < count; index += 1) {
    options.push({
      year,
      month,
      label: formatMonthLabel(year, month),
      value: `${year}-${String(month).padStart(2, "0")}`,
    });
    ({ year, month } = shiftMonth(year, month, -1));
  }

  return options;
}
