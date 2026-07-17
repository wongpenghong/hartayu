import type {
  CategoryMonthlyTotal,
  Entry,
  EntryFilter,
  MonthlyTotals,
  Pocket,
  PocketBalance,
} from "./types";

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
