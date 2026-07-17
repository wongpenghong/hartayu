import type { Account, AccountBalance, Entry, MonthlyTotals } from "./types";

function entryDelta(entry: Entry): number {
  return entry.kind === "income" ? entry.amountYen : -entry.amountYen;
}

export function balanceForAccount(
  entries: Entry[],
  accountId: string,
): number {
  return entries
    .filter((entry) => entry.accountId === accountId)
    .reduce((total, entry) => total + entryDelta(entry), 0);
}

export function balancesByAccount(
  entries: Entry[],
  accounts: Account[],
): AccountBalance[] {
  return accounts
    .filter((account) => account.archivedAt == null)
    .map((account) => ({
      accountId: account.id,
      balanceYen: balanceForAccount(entries, account.id),
    }));
}

export function householdBalance(
  entries: Entry[],
  accounts: Account[],
): number {
  return balancesByAccount(entries, accounts).reduce(
    (total, account) => total + account.balanceYen,
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
