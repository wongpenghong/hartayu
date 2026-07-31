import type { PortfolioPnlSummary } from "@/ledger/portfolio";
import { EmptyState } from "@/components/NativeUI";
import { formatYen } from "@/lib/format-yen";
import {
  formatReturnPct,
  formatSignedYen,
  pnlTextClass,
  pnlTone,
} from "@/lib/portfolio-display";

export function PortfolioPnlSummaryCard({
  summary,
  loading,
}: {
  summary: PortfolioPnlSummary | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
        <p className="mb-4 text-[17px] font-semibold">Unrealized P&L</p>
        <EmptyState message="Loading P&L…" />
      </section>
    );
  }

  if (summary == null) {
    return null;
  }

  const tone = pnlTone(summary.totalPnlYen);
  const toneClass = pnlTextClass(tone);

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
      <p className="mb-3 text-[17px] font-semibold">Unrealized P&L</p>
      <p className="text-[15px] tabular-nums text-neutral-600 dark:text-neutral-400">
        Cost {formatYen(summary.totalCostBasisYen)} → Value{" "}
        {formatYen(summary.totalValueYen)}
      </p>
      <p className={`mt-2 text-[28px] font-bold tabular-nums ${toneClass}`}>
        {formatSignedYen(summary.totalPnlYen)}
      </p>
      <p className={`text-[15px] font-medium tabular-nums ${toneClass}`}>
        {formatReturnPct(summary.returnPct)}
      </p>
      <p className="mt-3 text-[13px] text-neutral-500">
        P&L for {summary.eligibleCount} of {summary.scopedCount} holdings
      </p>
    </section>
  );
}

export function HoldingPnlBadge({
  pnlYen,
  returnPct,
}: {
  pnlYen: number | null;
  returnPct: number | null;
}) {
  if (pnlYen == null || returnPct == null) {
    return (
      <span className="text-[13px] font-medium tabular-nums text-neutral-400 dark:text-neutral-500">
        N/A
      </span>
    );
  }

  const tone = pnlTone(pnlYen);

  return (
    <span
      className={`text-[13px] font-semibold tabular-nums ${pnlTextClass(tone)}`}
    >
      {formatSignedYen(pnlYen)} {formatReturnPct(returnPct)}
    </span>
  );
}
