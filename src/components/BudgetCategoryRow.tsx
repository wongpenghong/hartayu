import type { Category } from "@/household/categories";
import { formatBudgetRowSummary } from "@/household/budget-display";
import {
  budgetGroupTone,
  budgetProgressTone,
  type BudgetTone,
} from "@/household/budget-colors";
import type { BudgetGroup } from "@/household/budget-groups";
import { CategoryIcon, LimitProgressBar } from "@/components/NativeUI";

export function BudgetCategoryRow({
  category,
  spentYen,
  group,
  onEdit,
}: {
  category: Category;
  spentYen: number;
  group: BudgetGroup | "other";
  onEdit: (category: Category) => void;
}) {
  const budgetYen = category.monthly_limit_yen ?? 0;
  const summary = formatBudgetRowSummary(spentYen, budgetYen);
  const tone: BudgetTone = budgetGroupTone(group);

  return (
    <button
      type="button"
      onClick={() => onEdit(category)}
      className={`rounded-2xl p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:opacity-90 ${tone.card}`}
    >
      <div className="flex items-center gap-2.5">
        <CategoryIcon kind={category.kind} emoji={category.emoji} />
        <span className={`text-[16px] font-semibold ${tone.accent}`}>
          {category.name}
        </span>
      </div>

      <p className={`mt-3 text-[12px] tabular-nums ${tone.muted}`}>
        {summary.usage}
      </p>

      <p className={`mt-3 text-[11px] font-medium uppercase tracking-wide ${tone.muted}`}>
        Left
      </p>
      <p
        className={`text-[22px] font-bold tabular-nums ${
          summary.over ? tone.overText : tone.accent
        }`}
      >
        {summary.remaining}
      </p>

      <div className="mt-3">
        <LimitProgressBar
          spentYen={spentYen}
          limitYen={budgetYen}
          highlightOver
          tone={budgetProgressTone(tone)}
          showPercent
        />
      </div>
    </button>
  );
}
