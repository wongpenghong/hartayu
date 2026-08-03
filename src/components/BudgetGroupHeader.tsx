import { formatBudgetRowSummary } from "@/household/budget-display";
import { budgetGroupTone, budgetProgressTone } from "@/household/budget-colors";
import type { BudgetGroup } from "@/household/budget-groups";
import { LimitProgressBar } from "@/components/NativeUI";
import { formatYen } from "@/lib/format-yen";

export function BudgetGroupHeader({
  group,
  spentYen,
  limitYen,
  overAllocationYen,
  onEdit,
}: {
  group: BudgetGroup;
  spentYen: number;
  limitYen: number;
  overAllocationYen: number | null;
  onEdit: () => void;
}) {
  const tone = budgetGroupTone(group);
  const summary = formatBudgetRowSummary(spentYen, limitYen);

  return (
    <button
      type="button"
      onClick={onEdit}
      className={`mb-3 w-full rounded-2xl p-4 text-left shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:opacity-90 ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-[12px] font-medium uppercase tracking-wide ${tone.muted}`}>
            Used
          </p>
          <p className={`mt-1 text-[15px] tabular-nums ${tone.accent}`}>
            {summary.usage}
          </p>
        </div>
        <div className="text-right">
          <p className={`text-[12px] font-medium uppercase tracking-wide ${tone.muted}`}>
            Left
          </p>
          <p
            className={`mt-1 text-[20px] font-bold tabular-nums ${
              summary.over ? tone.overText : tone.accent
            }`}
          >
            {summary.remaining}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <LimitProgressBar
          spentYen={spentYen}
          limitYen={limitYen}
          highlightOver
          tone={budgetProgressTone(tone)}
          showPercent
        />
      </div>

      {overAllocationYen != null ? (
        <p className={`mt-3 text-[13px] font-medium ${tone.muted}`}>
          Over-allocated by {formatYen(overAllocationYen)}
        </p>
      ) : null}
    </button>
  );
}
