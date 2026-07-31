import type { Category } from "@/household/categories";
import { formatBudgetRowSummary } from "@/household/budget-display";
import { LimitProgressBar } from "@/components/NativeUI";

export function BudgetCategoryRow({
  category,
  spentYen,
  onEdit,
}: {
  category: Category;
  spentYen: number;
  onEdit: (category: Category) => void;
}) {
  const budgetYen = category.monthly_limit_yen ?? 0;
  const summary = formatBudgetRowSummary(spentYen, budgetYen);

  return (
    <button
      type="button"
      onClick={() => onEdit(category)}
      className="w-full border-b border-[#ececee] px-4 py-4 text-left last:border-b-0 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[17px] font-medium">{category.name}</span>
        <span className="text-right">
          <span className="block text-[15px] tabular-nums text-neutral-600 dark:text-neutral-300">
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
      <div className="mt-3">
        <LimitProgressBar
          spentYen={spentYen}
          limitYen={budgetYen}
          highlightOver
        />
      </div>
    </button>
  );
}
