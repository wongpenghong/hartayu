import { useMemo } from "react";
import { Link } from "react-router-dom";
import { categoryNameById } from "@/household/category-utils";
import { breakdownColor } from "@/household/breakdown-colors";
import type { Category } from "@/household/categories";
import { DonutChart } from "@/components/DonutChart";
import { expenseTotalsByCategory } from "@/ledger/ledger";
import type { Entry } from "@/ledger/types";

export function ExpenseBreakdownCard({
  entries,
  categories,
  year,
  month,
  loading,
}: {
  entries: Entry[];
  categories: Category[];
  year: number;
  month: number;
  loading?: boolean;
}) {
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const segments = useMemo(
    () =>
      expenseTotalsByCategory(entries, year, month).map((row, index) => ({
        id: row.id,
        label: categoriesById.get(row.id) ?? "Category",
        value: row.totalYen,
        color: breakdownColor(index),
      })),
    [categoriesById, entries, month, year],
  );

  if (loading || segments.length === 0) {
    return null;
  }

  return (
    <Link
      to="/analysis"
      className="block rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:opacity-80 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[17px] font-semibold">Spending by category</p>
        <span className="text-[15px] font-medium text-[#007aff]">Analysis</span>
      </div>
      <DonutChart segments={segments} centerLabel="Total spent" />
    </Link>
  );
}
