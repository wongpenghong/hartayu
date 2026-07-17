export type EntryKind = "expense" | "income";

export type Entry = {
  id: string;
  pocketId: string;
  categoryId: string;
  memberId: string;
  kind: EntryKind;
  amountYen: number;
  entryDate: string;
  note: string | null;
  createdAt: string;
};

export type Pocket = {
  id: string;
  archivedAt?: string | null;
};

export type MonthlyTotals = {
  incomeYen: number;
  expenseYen: number;
  netYen: number;
};

export type PocketBalance = {
  pocketId: string;
  balanceYen: number;
};

export type CategoryMonthlyTotal = {
  categoryId: string;
  kind: EntryKind;
  totalYen: number;
};

export type EntryFilter = {
  pocketId?: string;
  categoryId?: string;
  year?: number;
  month?: number;
};
