import type { PortfolioPnlSummary } from "@/ledger/portfolio";
import { EmptyState } from "@/components/NativeUI";
import { formatYen } from "@/lib/format-yen";
import {
  formatReturnPct,
  formatSignedYen,
  pnlBarClass,
  pnlTextClass,
  pnlTone,
  portfolioValueRatio,
} from "@/lib/portfolio-display";

function PortfolioTrendIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-neutral-400"
    >
      <path
        d="M4 16l5-5 4 4 7-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 6h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PortfolioHeroCardBody({
  title,
  totalValueYen,
  pnlSummary,
  coverageNote,
  showChevron,
}: {
  title: string;
  totalValueYen: number;
  pnlSummary: PortfolioPnlSummary | null;
  coverageNote?: string;
  showChevron?: boolean;
}) {
  const tone = pnlSummary != null ? pnlTone(pnlSummary.totalPnlYen) : "na";
  const toneClass = pnlTextClass(tone);
  const barFill =
    pnlSummary != null
      ? portfolioValueRatio(
          pnlSummary.totalCostBasisYen,
          pnlSummary.totalValueYen,
        )
      : 0;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PortfolioTrendIcon />
          <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
            {title}
          </p>
        </div>
        {showChevron ? (
          <span className="text-[20px] text-neutral-300">›</span>
        ) : null}
      </div>

      <p className="mt-2 text-[40px] font-bold tracking-tight tabular-nums text-neutral-900 dark:text-neutral-100">
        {totalValueYen > 0 ? formatYen(totalValueYen) : "—"}
      </p>

      {pnlSummary != null ? (
        <>
          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
              Return
            </p>
            <p className={`text-[15px] font-semibold tabular-nums ${toneClass}`}>
              {formatReturnPct(pnlSummary.returnPct)}
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#ececee] dark:bg-neutral-800">
            <div
              className={`h-full rounded-full transition-[width] ${pnlBarClass(tone)}`}
              style={{ width: `${barFill * 100}%` }}
            />
          </div>
          <div className="mt-4 flex items-stretch border-t border-[#ececee] pt-4 dark:border-neutral-800">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
                Total cost
              </p>
              <p className="mt-1 text-[17px] font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                {formatYen(pnlSummary.totalCostBasisYen)}
              </p>
            </div>
            <div className="mx-4 w-px self-stretch bg-[#ececee] dark:bg-neutral-800" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
                Profit / loss
              </p>
              <p className={`mt-1 text-[17px] font-bold tabular-nums ${toneClass}`}>
                {formatSignedYen(pnlSummary.totalPnlYen)}
              </p>
            </div>
          </div>
        </>
      ) : null}

      {coverageNote ? (
        <p className="mt-3 text-[13px] text-neutral-500">{coverageNote}</p>
      ) : null}
    </>
  );
}

const cardClassName =
  "rounded-3xl bg-white p-5 text-left shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none";

export function PortfolioHeroCard({
  title,
  totalValueYen,
  pnlSummary,
  coverageNote,
  loading,
  onClick,
}: {
  title: string;
  totalValueYen: number;
  pnlSummary: PortfolioPnlSummary | null;
  coverageNote?: string;
  loading?: boolean;
  onClick?: () => void;
}) {
  if (loading) {
    return (
      <section className={cardClassName}>
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          {title}
        </p>
        <EmptyState message="Loading portfolio…" />
      </section>
    );
  }

  const body = (
    <PortfolioHeroCardBody
      title={title}
      totalValueYen={totalValueYen}
      pnlSummary={pnlSummary}
      coverageNote={coverageNote}
      showChevron={onClick != null}
    />
  );

  if (onClick != null) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClassName} w-full active:opacity-80`}
      >
        {body}
      </button>
    );
  }

  return <section className={cardClassName}>{body}</section>;
}
