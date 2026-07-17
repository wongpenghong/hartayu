import { PillTabs } from "@/components/NativeUI";
import { formatYen } from "@/lib/format-yen";

export type SpendingPeriod = "daily" | "weekly";

export function SpendingTrendCard({
  period,
  onPeriodChange,
  amountYen,
  trendPercent,
  loading,
}: {
  period: SpendingPeriod;
  onPeriodChange: (period: SpendingPeriod) => void;
  amountYen: number;
  trendPercent: number | null;
  loading?: boolean;
}) {
  const trendUp = trendPercent != null && trendPercent > 0;
  const trendDown = trendPercent != null && trendPercent < 0;

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[17px] font-semibold">Spending trend</p>
        {trendPercent != null ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold ${
              trendUp
                ? "bg-[#ffebee] text-[#ff3b30]"
                : trendDown
                  ? "bg-[#e8f5e9] text-[#34c759]"
                  : "bg-[#f2f2f7] text-neutral-500"
            }`}
          >
            {trendUp ? "↑" : trendDown ? "↓" : "•"} {Math.abs(trendPercent)}%
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <PillTabs
          value={period}
          onChange={onPeriodChange}
          options={[
            { value: "daily", label: "Daily" },
            { value: "weekly", label: "Weekly" },
          ]}
        />
      </div>

      <div className="mt-4">
        <p className="text-[40px] font-bold tracking-tight tabular-nums text-neutral-900">
          {loading ? "…" : formatYen(amountYen)}
        </p>
        <p className="mt-1 text-[14px] text-neutral-500">
          {period === "daily" ? "Spent today" : "Spent this week"}
        </p>
      </div>
    </section>
  );
}
