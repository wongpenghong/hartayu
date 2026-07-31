import { useNavigate } from "react-router-dom";
import type { PortfolioPnlSummary } from "@/ledger/portfolio";
import { formatPortfolioSummaryNote } from "@/lib/portfolio-display";
import { PortfolioHeroCard } from "@/components/portfolio/PortfolioHeroCard";

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

  if (!loading && holdingCount === 0) {
    return null;
  }

  return (
    <PortfolioHeroCard
      title="Total portfolio"
      totalValueYen={totalValueYen}
      pnlSummary={pnlSummary}
      coverageNote={formatPortfolioSummaryNote(
        valuedHoldingCount,
        holdingCount,
        pnlSummary,
      )}
      loading={loading}
      onClick={() => navigate("/portfolio")}
    />
  );
}
