import { homeGlanceNetLine } from "@/household/budget-display";
import { LimitProgressBar } from "@/components/NativeUI";
import type { MonthlyTotals } from "@/ledger/types";
import { formatYen } from "@/lib/format-yen";

export function HomeGlanceSummary({
  totals,
  pocketBalanceYen,
}: {
  totals: MonthlyTotals;
  pocketBalanceYen: number;
}) {
  const netLine = homeGlanceNetLine(totals.netYen);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
      <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
        Your cash
      </p>

      <p className="mt-2 text-[40px] font-bold tracking-tight tabular-nums text-[#34c759]">
        {formatYen(pocketBalanceYen)}
      </p>
      <p className="mt-1 text-[15px] font-medium text-[#34c759]">Total cash</p>

      {pocketBalanceYen > 0 ? (
        <div className="mt-4">
          <LimitProgressBar
            spentYen={totals.expenseYen}
            limitYen={pocketBalanceYen}
            highlightOver
          />
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
          <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Income
          </p>
          <p className="mt-1 text-[17px] font-semibold tabular-nums text-[#34c759]">
            {formatYen(totals.incomeYen)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
          <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Expense
          </p>
          <p className="mt-1 text-[17px] font-semibold tabular-nums text-[#ff3b30]">
            {formatYen(totals.expenseYen)}
          </p>
        </div>
      </div>

      <p className={`mt-3 text-center text-[13px] font-medium tabular-nums ${netLine.toneClass}`}>
        {netLine.label}
      </p>
    </section>
  );
}
