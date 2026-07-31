import type { PortfolioPnlSummary } from "@/ledger/portfolio";
import { formatPnlCoverageNote, formatReturnPct, formatSignedYen, pnlTextClass, pnlTone } from "@/lib/portfolio-display";
import { PortfolioHeroCard } from "@/components/portfolio/PortfolioHeroCard";

export function PortfolioPnlSummaryCard({
  summary,
  loading,
}: {
  summary: PortfolioPnlSummary | null;
  loading: boolean;
}) {
  if (!loading && summary == null) {
    return null;
  }

  return (
    <PortfolioHeroCard
      title="Total portfolio"
      totalValueYen={summary?.totalValueYen ?? 0}
      pnlSummary={summary}
      coverageNote={
        summary != null
          ? formatPnlCoverageNote(summary.eligibleCount, summary.scopedCount)
          : undefined
      }
      loading={loading}
    />
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
      {formatSignedYen(pnlYen)} · {formatReturnPct(returnPct)}
    </span>
  );
}
