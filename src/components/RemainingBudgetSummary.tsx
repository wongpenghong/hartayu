import { Link } from "react-router-dom";
import { formatRemainingBudget } from "@/household/entry-display";
import type { RemainingBudgetRow } from "@/ledger/types";

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

  return (
    <Link
      to="/limits"
      className="block rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:opacity-80 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Budget left
        </p>
        <span className="text-[15px] font-medium text-[#007aff]">Limits</span>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.categoryId}
            className={`text-[15px] ${
              row.remainingYen < 0
                ? "font-semibold text-[#ff3b30]"
                : "text-neutral-700 dark:text-neutral-300"
            }`}
          >
            {categoryNameById.get(row.categoryId) ?? "Category"} ·{" "}
            {formatRemainingBudget(row.remainingYen)}
          </li>
        ))}
      </ul>
    </Link>
  );
}
