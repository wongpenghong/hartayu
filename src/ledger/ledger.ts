import type { Entry, MonthlyTotals, Pocket, PocketBalance } from "./types";

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
