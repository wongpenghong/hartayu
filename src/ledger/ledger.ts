import type {
  CategoryMonthlyTotal,
  Entry,
  EntryFilter,
  EntryKind,
  MonthSegmentTotal,
  MonthlyTotals,
  Pocket,
  PocketBalance,
  SegmentTotal,
} from "./types";
import { shiftMonth } from "@/lib/format-yen";

function entryDelta(entry: Entry): number {
  return entry.kind === "income" ? entry.amountYen : -entry.amountYen;
}

export function balanceForPocket(entries: Entry[], pocketId: string): number {
  return entries
    .filter((entry) => entry.pocketId === pocketId)
    .reduce((total, entry) => total + entryDelta(entry), 0);
}

export function balancesByPocket(
  entries: Entry[],
  pockets: Pocket[],
): PocketBalance[] {
  return pockets
    .filter((pocket) => pocket.archivedAt == null)
    .map((pocket) => ({
      pocketId: pocket.id,
      balanceYen: balanceForPocket(entries, pocket.id),
    }));
}

export function householdBalance(entries: Entry[], pockets: Pocket[]): number {
  return balancesByPocket(entries, pockets).reduce(
    (total, pocket) => total + pocket.balanceYen,
    0,
  );
}

export function entryInMonth(
  entry: Entry,
  year: number,
  month: number,
): boolean {
  const [entryYear, entryMonth] = entry.entryDate.split("-").map(Number);
  return entryYear === year && entryMonth === month;
}

export function monthlyTotals(
  entries: Entry[],
  year: number,
  month: number,
): MonthlyTotals {
  const inMonth = entries.filter((entry) => entryInMonth(entry, year, month));

  const incomeYen = inMonth
    .filter((entry) => entry.kind === "income")
    .reduce((total, entry) => total + entry.amountYen, 0);

  const expenseYen = inMonth
    .filter((entry) => entry.kind === "expense")
    .reduce((total, entry) => total + entry.amountYen, 0);

  return {
    incomeYen,
    expenseYen,
    netYen: incomeYen - expenseYen,
  };
}

export function filterEntries(entries: Entry[], filter: EntryFilter): Entry[] {
  return entries.filter((entry) => {
    if (filter.pocketId && entry.pocketId !== filter.pocketId) {
      return false;
    }
    if (filter.categoryId && entry.categoryId !== filter.categoryId) {
      return false;
    }
    if (filter.year != null && filter.month != null) {
      return entryInMonth(entry, filter.year, filter.month);
    }
    return true;
  });
}

export function monthlyTotalsByCategory(
  entries: Entry[],
  year: number,
  month: number,
): CategoryMonthlyTotal[] {
  const totals = new Map<string, CategoryMonthlyTotal>();

  for (const entry of entries) {
    if (!entryInMonth(entry, year, month)) {
      continue;
    }

    const existing = totals.get(entry.categoryId);
    if (existing) {
      existing.totalYen += entry.amountYen;
      continue;
    }

    totals.set(entry.categoryId, {
      categoryId: entry.categoryId,
      kind: entry.kind,
      totalYen: entry.amountYen,
    });
  }

  return [...totals.values()].sort((left, right) => right.totalYen - left.totalYen);
}

export function expenseTotalForDate(entries: Entry[], date: string): number {
  return entries
    .filter((entry) => entry.kind === "expense" && entry.entryDate === date)
    .reduce((total, entry) => total + entry.amountYen, 0);
}

export function expenseTotalForDateRange(
  entries: Entry[],
  startDate: string,
  endDate: string,
): number {
  return entries
    .filter(
      (entry) =>
        entry.kind === "expense" &&
        entry.entryDate >= startDate &&
        entry.entryDate <= endDate,
    )
    .reduce((total, entry) => total + entry.amountYen, 0);
}

export function trendPercent(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }

  return Math.round(((current - previous) / previous) * 100);
}

export function expenseTotalsByCategory(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByCategory(entries, year, month, "expense");
}

export function incomeTotalsByCategory(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByCategory(entries, year, month, "income");
}

export function totalsByCategory(
  entries: Entry[],
  year: number,
  month: number,
  kind: EntryKind,
): SegmentTotal[] {
  return monthlyTotalsByCategory(entries, year, month)
    .filter((row) => row.kind === kind)
    .map((row) => ({ id: row.categoryId, totalYen: row.totalYen }));
}

export function expenseTotalsByPocket(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByPocket(entries, year, month, "expense");
}

export function incomeTotalsByPocket(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByPocket(entries, year, month, "income");
}

export function totalsByPocket(
  entries: Entry[],
  year: number,
  month: number,
  kind: EntryKind,
): SegmentTotal[] {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (entry.kind !== kind || !entryInMonth(entry, year, month)) {
      continue;
    }

    totals.set(entry.pocketId, (totals.get(entry.pocketId) ?? 0) + entry.amountYen);
  }

  return [...totals.entries()]
    .map(([id, totalYen]) => ({ id, totalYen }))
    .sort((left, right) => right.totalYen - left.totalYen);
}

export function expenseTotalsByMember(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByMember(entries, year, month, "expense");
}

export function incomeTotalsByMember(
  entries: Entry[],
  year: number,
  month: number,
): SegmentTotal[] {
  return totalsByMember(entries, year, month, "income");
}

export function totalsByMember(
  entries: Entry[],
  year: number,
  month: number,
  kind: EntryKind,
): SegmentTotal[] {
  const totals = new Map<string, number>();

  for (const entry of entries) {
    if (entry.kind !== kind || !entryInMonth(entry, year, month)) {
      continue;
    }

    totals.set(entry.memberId, (totals.get(entry.memberId) ?? 0) + entry.amountYen);
  }

  return [...totals.entries()]
    .map(([id, totalYen]) => ({ id, totalYen }))
    .sort((left, right) => right.totalYen - left.totalYen);
}

export function expenseTotalsByRecentMonths(
  entries: Entry[],
  endYear: number,
  endMonth: number,
  count = 6,
): MonthSegmentTotal[] {
  return totalsByRecentMonths(entries, endYear, endMonth, "expense", count);
}

export function incomeTotalsByRecentMonths(
  entries: Entry[],
  endYear: number,
  endMonth: number,
  count = 6,
): MonthSegmentTotal[] {
  return totalsByRecentMonths(entries, endYear, endMonth, "income", count);
}

export function totalsByRecentMonths(
  entries: Entry[],
  endYear: number,
  endMonth: number,
  kind: EntryKind,
  count = 6,
): MonthSegmentTotal[] {
  const results: MonthSegmentTotal[] = [];
  let year = endYear;
  let month = endMonth;

  for (let index = 0; index < count; index += 1) {
    const totalYen = entries
      .filter((entry) => entry.kind === kind && entryInMonth(entry, year, month))
      .reduce((total, entry) => total + entry.amountYen, 0);

    results.unshift({
      id: `${year}-${String(month).padStart(2, "0")}`,
      year,
      month,
      totalYen,
    });

    ({ year, month } = shiftMonth(year, month, -1));
  }

  return results;
}

export function recentEntries(entries: Entry[], limit: number): Entry[] {
  return [...entries]
    .sort((left, right) => {
      if (left.entryDate !== right.entryDate) {
        return right.entryDate.localeCompare(left.entryDate);
      }

      return right.createdAt.localeCompare(left.createdAt);
    })
    .slice(0, limit);
}
