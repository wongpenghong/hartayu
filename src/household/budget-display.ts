import type { BudgetPace } from "@/ledger/types";
import { formatYen } from "@/lib/format-yen";
import { formatRemainingBudget, netTone } from "@/household/entry-display";

export function homeGlanceNetLine(netYen: number): { label: string; toneClass: string } {
  return {
    label: `Net this cycle ${formatYen(netYen)}`,
    toneClass: netTone(netYen),
  };
}

export function formatBudgetDayCount(daysLeft: number): string {
  if (daysLeft === 1) {
    return "1 day left";
  }

  return `${daysLeft} days left`;
}

export function formatBudgetPaceHint(pace: BudgetPace): string | null {
  if (pace.remainingYen < 0) {
    return `Over by ${formatYen(Math.abs(pace.remainingYen))}`;
  }

  if (pace.daysLeft <= 0) {
    return null;
  }

  if (pace.dailyAllowanceYen <= 0) {
    return `${formatBudgetDayCount(pace.daysLeft)} · no daily allowance left`;
  }

  return `${formatBudgetDayCount(pace.daysLeft)} · ${formatYen(pace.dailyAllowanceYen)}/day left`;
}

export function formatBudgetUsage(spentYen: number, limitYen: number): string {
  return `${formatYen(spentYen)} of ${formatYen(limitYen)}`;
}

export function formatBudgetRowSummary(
  spentYen: number,
  limitYen: number,
): { usage: string; remaining: string; over: boolean } {
  const remainingYen = limitYen - spentYen;

  return {
    usage: formatBudgetUsage(spentYen, limitYen),
    remaining: formatRemainingBudget(remainingYen),
    over: remainingYen < 0,
  };
}

export function formatBudgetSectionTitle(
  title: string,
  spentYen: number,
  limitYen: number,
): string {
  return `${title} · ${formatBudgetUsage(spentYen, limitYen)}`;
}

export function budgetTotalsFromRows(
  rows: readonly { spentYen: number; limitYen: number }[],
): { spentYen: number; limitYen: number } {
  return rows.reduce(
    (totals, row) => ({
      spentYen: totals.spentYen + row.spentYen,
      limitYen: totals.limitYen + row.limitYen,
    }),
    { spentYen: 0, limitYen: 0 },
  );
}

export function homeBudgetHighlightRows<
  T extends { remainingYen: number; spentYen: number },
>(rows: readonly T[], limit = 3): T[] {
  return [...rows]
    .sort((left, right) => {
      if (left.remainingYen < 0 && right.remainingYen >= 0) {
        return -1;
      }
      if (right.remainingYen < 0 && left.remainingYen >= 0) {
        return 1;
      }
      if (left.remainingYen < 0 && right.remainingYen < 0) {
        return left.remainingYen - right.remainingYen;
      }
      return left.remainingYen - right.remainingYen;
    })
    .slice(0, limit);
}
