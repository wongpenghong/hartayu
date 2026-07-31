import { useNavigate } from "react-router-dom";
import type { PortfolioPnlSummary } from "@/ledger/portfolio";
import { EmptyState } from "@/components/NativeUI";
import { formatYen } from "@/lib/format-yen";
import {
  formatReturnPct,
  formatSignedYen,
  pnlTextClass,
  pnlTone,
} from "@/lib/portfolio-display";

export function PortfolioSummary({
  totalValueYen,
  holdingCount,
  valuedHoldingCount,
  pnlSummary,
  loading,
}: {
  totalValueYen: number;
  holdingCount: number;
  valuedHoldingCount: number;
  pnlSummary: PortfolioPnlSummary | null;
  loading?: boolean;
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Portfolio
        </p>
        <EmptyState message="Loading portfolio…" />
      </section>
    );
  }

  if (holdingCount === 0) {
    return null;
  }

  const pnlToneClass =
    pnlSummary != null ? pnlTextClass(pnlTone(pnlSummary.totalPnlYen)) : "";

  return (
    <button
      type="button"
      onClick={() => navigate("/portfolio")}
      className="rounded-3xl bg-white p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:opacity-80 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Portfolio
        </p>
        <span className="text-[20px] text-neutral-300">›</span>
      </div>
      <p className="mt-2 text-[40px] font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
        {totalValueYen > 0 ? formatYen(totalValueYen) : "—"}
      </p>
      {pnlSummary != null ? (
        <p className={`mt-1 text-[17px] font-semibold tabular-nums ${pnlToneClass}`}>
          {formatSignedYen(pnlSummary.totalPnlYen)}{" "}
          {formatReturnPct(pnlSummary.returnPct)}
        </p>
      ) : null}
      <p className="mt-3 text-[13px] text-neutral-500">
        {valuedHoldingCount > 0
          ? `${valuedHoldingCount} of ${holdingCount} holdings valued`
          : `${holdingCount} holdings · add snapshot values`}
        {pnlSummary != null
          ? ` · P&L for ${pnlSummary.eligibleCount} of ${pnlSummary.scopedCount}`
          : ""}
      </p>
    </button>
  );
}
