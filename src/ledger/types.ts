export type EntryKind = "expense" | "income" | "transfer";

export type Entry = {
  id: string;
  pocketId: string;
  toPocketId: string | null;
  categoryId: string | null;
  memberId: string;
  kind: EntryKind;
  amountYen: number;
  foreignAmountIdr: number | null;
  entryDate: string;
  note: string | null;
  createdAt: string;
};

export type Goal = {
  id: string;
  name: string;
  targetAmountYen: number;
  targetDate: string | null;
  linkedPocketId: string | null;
  emoji: string | null;
  createdAt: string;
};

export type GoalContribution = {
  id: string;
  goalId: string;
  memberId: string;
  amountYen: number;
  contributionDate: string;
  note: string | null;
  createdAt: string;
};

export type GoalProgress = {
  goalId: string;
  savedYen: number;
  targetAmountYen: number;
  progressPercent: number;
  remainingYen: number;
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

export type SegmentTotal = {
  id: string;
  totalYen: number;
};

export type MonthSegmentTotal = SegmentTotal & {
  year: number;
  month: number;
};

export type EntryFilter = {
  pocketId?: string;
  categoryId?: string;
  year?: number;
  month?: number;
};

export type EntryDayGroup = {
  date: string;
  entries: Entry[];
};

export type BudgetPace = {
  daysInMonth: number;
  daysElapsed: number;
  daysLeft: number;
  spentYen: number;
  limitYen: number;
  remainingYen: number;
  projectedSpendYen: number;
  dailyAllowanceYen: number;
};

export type RemainingBudgetRow = {
  categoryId: string;
  spentYen: number;
  limitYen: number;
  remainingYen: number;
};
