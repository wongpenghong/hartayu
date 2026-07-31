import { Link } from "react-router-dom";
import {
  budgetTotalsFromRows,
  formatBudgetRowSummary,
  homeBudgetHighlightRows,
} from "@/household/budget-display";
import { LimitProgressBar } from "@/components/NativeUI";
import type { RemainingBudgetRow } from "@/ledger/types";

function BudgetHighlightRow({
  name,
  row,
}: {
  name: string;
  row: RemainingBudgetRow;
}) {
  const summary = formatBudgetRowSummary(row.spentYen, row.limitYen);

  return (
    <li className="border-t border-[#ececee] pt-3 first:border-t-0 first:pt-0 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[15px] font-medium">{name}</span>
        <span className="text-right">
          <span className="block text-[13px] tabular-nums text-neutral-500">
            {summary.usage}
          </span>
          <span
            className={`mt-0.5 block text-[15px] font-semibold tabular-nums ${
              summary.over
                ? "text-[#ff3b30]"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {summary.remaining}
          </span>
        </span>
      </div>
      <div className="mt-2">
        <LimitProgressBar
          spentYen={row.spentYen}
          limitYen={row.limitYen}
          highlightOver
        />
      </div>
    </li>
  );
}

export function RemainingBudgetSummary({
  rows,
  categoryNameById,
  loading,
}: {
  rows: RemainingBudgetRow[];
  categoryNameById: Map<string, string>;
  loading?: boolean;
}) {
  if (loading || rows.length === 0) {
    return null;
  }

  const totals = budgetTotalsFromRows(rows);
  const summary = formatBudgetRowSummary(totals.spentYen, totals.limitYen);
  const highlights = homeBudgetHighlightRows(rows);
  const hiddenCount = rows.length - highlights.length;

  return (
    <Link
      to="/budget"
      className="block rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:opacity-80 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Budget
        </p>
        <span className="text-[20px] text-neutral-300">›</span>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <p className="text-[15px] tabular-nums text-neutral-600 dark:text-neutral-300">
          {summary.usage}
        </p>
        <p
          className={`text-[15px] font-semibold tabular-nums ${
            summary.over
              ? "text-[#ff3b30]"
              : "text-neutral-700 dark:text-neutral-300"
          }`}
        >
          {summary.remaining}
        </p>
      </div>

      <div className="mt-3">
        <LimitProgressBar
          spentYen={totals.spentYen}
          limitYen={totals.limitYen}
          highlightOver
        />
      </div>

      {highlights.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {highlights.map((row) => (
            <BudgetHighlightRow
              key={row.categoryId}
              name={categoryNameById.get(row.categoryId) ?? "Category"}
              row={row}
            />
          ))}
        </ul>
      ) : null}

      {hiddenCount > 0 ? (
        <p className="mt-3 text-[13px] font-medium text-[#007aff]">
          {hiddenCount} more categor{hiddenCount === 1 ? "y" : "ies"}
        </p>
      ) : null}
    </Link>
  );
}
