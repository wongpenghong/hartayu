import {
  formatBudgetPaceHint,
  formatBudgetRowSummary,
} from "@/household/budget-display";
import type { BudgetPace } from "@/ledger/types";
import { GroupCard, LimitProgressBar } from "@/components/NativeUI";

export function BudgetSummaryCard({
  spentYen,
  limitYen,
  pace,
}: {
  spentYen: number;
  limitYen: number;
  pace: BudgetPace;
}) {
  const summary = formatBudgetRowSummary(spentYen, limitYen);
  const paceHint = formatBudgetPaceHint(pace);

  return (
    <GroupCard title="This month">
      <div className="px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[17px] font-medium">Household budget</p>
            <p className="mt-1 text-[15px] tabular-nums text-neutral-600 dark:text-neutral-300">
              {summary.usage}
            </p>
          </div>
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
            spentYen={spentYen}
            limitYen={limitYen}
            highlightOver
          />
        </div>
        {paceHint ? (
          <p className="mt-2 text-[13px] text-neutral-500">{paceHint}</p>
        ) : null}
      </div>
    </GroupCard>
  );
}
