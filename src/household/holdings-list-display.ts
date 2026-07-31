import type { Holding } from "@/ledger/portfolio";

export const HOLDINGS_LIST_PAGE_SIZE = 10;

export type HoldingStatusFilter = "all" | "valued" | "no-quote" | "missing-cost";
export type HoldingSortKey = "value" | "pnl-pct" | "pnl-yen";

export type HoldingListRow = {
  holding: Holding;
  valueYen: number | null;
  pnlYen: number | null;
  returnPct: number | null;
  noQuote: boolean;
  missingCost: boolean;
  hasSnapshot: boolean;
};

export const HOLDING_STATUS_FILTER_OPTIONS: readonly {
  value: HoldingStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "valued", label: "Valued" },
  { value: "no-quote", label: "No quote" },
  { value: "missing-cost", label: "Missing cost" },
];

export const HOLDING_SORT_OPTIONS: readonly {
  value: HoldingSortKey;
  label: string;
}[] = [
  { value: "value", label: "Value (high to low)" },
  { value: "pnl-pct", label: "P&L % (high to low)" },
  { value: "pnl-yen", label: "P&L (high to low)" },
];

export function holdingSortLabel(sortKey: HoldingSortKey): string {
  return HOLDING_SORT_OPTIONS.find((option) => option.value === sortKey)?.label ??
    "Value (high to low)";
}

export function holdingListSortComplete(
  row: HoldingListRow,
  sortKey: HoldingSortKey,
): boolean {
  if (row.noQuote || !row.hasSnapshot) {
    return false;
  }
  if (sortKey === "value") {
    return row.valueYen != null;
  }
  return (
    !row.missingCost && row.pnlYen != null && row.returnPct != null
  );
}

export function matchesHoldingStatusFilter(
  row: HoldingListRow,
  filter: HoldingStatusFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "valued":
      return row.hasSnapshot && !row.noQuote && row.valueYen != null;
    case "no-quote":
      return row.noQuote;
    case "missing-cost":
      return row.missingCost;
  }
}

export function compareHoldingsForSort(
  a: HoldingListRow,
  b: HoldingListRow,
  sortKey: HoldingSortKey,
): number {
  const aComplete = holdingListSortComplete(a, sortKey);
  const bComplete = holdingListSortComplete(b, sortKey);
  if (aComplete !== bComplete) {
    return aComplete ? -1 : 1;
  }
  if (!aComplete) {
    return a.holding.name.localeCompare(b.holding.name);
  }

  let diff = 0;
  switch (sortKey) {
    case "value":
      diff = (b.valueYen ?? 0) - (a.valueYen ?? 0);
      break;
    case "pnl-pct":
      diff = (b.returnPct ?? 0) - (a.returnPct ?? 0);
      break;
    case "pnl-yen":
      diff = (b.pnlYen ?? 0) - (a.pnlYen ?? 0);
      break;
  }
  if (diff !== 0) {
    return diff;
  }
  return a.holding.name.localeCompare(b.holding.name);
}

export function filterAndSortHoldings(
  rows: HoldingListRow[],
  statusFilter: HoldingStatusFilter,
  sortKey: HoldingSortKey,
): HoldingListRow[] {
  return rows
    .filter((row) => matchesHoldingStatusFilter(row, statusFilter))
    .sort((a, b) => compareHoldingsForSort(a, b, sortKey));
}

export function paginateHoldingsPage<T>(
  rows: T[],
  page: number,
  pageSize: number = HOLDINGS_LIST_PAGE_SIZE,
): {
  visible: T[];
  page: number;
  pageCount: number;
  hasPrev: boolean;
  hasNext: boolean;
} {
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const clampedPage = Math.min(Math.max(page, 1), pageCount);
  const start = (clampedPage - 1) * pageSize;

  return {
    visible: rows.slice(start, start + pageSize),
    page: clampedPage,
    pageCount,
    hasPrev: clampedPage > 1,
    hasNext: clampedPage < pageCount,
  };
}
