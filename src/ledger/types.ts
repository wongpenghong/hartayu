export type EntryKind = "expense" | "income";

export type Entry = {
  id: string;
  accountId: string;
  kind: EntryKind;
  amountYen: number;
  entryDate: string;
};

export type Account = {
  id: string;
  archivedAt?: string | null;
};

export type MonthlyTotals = {
  incomeYen: number;
  expenseYen: number;
  netYen: number;
};

export type AccountBalance = {
  accountId: string;
  balanceYen: number;
};
