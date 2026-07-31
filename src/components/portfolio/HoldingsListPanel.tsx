import { useEffect, useMemo, useState } from "react";
import type { CollectibleMarketLink } from "@/household/collectible-market-links";
import { holdingShowsNoQuote } from "@/household/collectible-market-links";
import {
  filterAndSortHoldings,
  HOLDING_SORT_OPTIONS,
  HOLDING_STATUS_FILTER_OPTIONS,
  holdingSortLabel,
  paginateHoldingsPage,
  type HoldingListRow,
  type HoldingSortKey,
  type HoldingStatusFilter,
} from "@/household/holdings-list-display";
import type { PortfolioSelection } from "@/household/portfolio-selection";
import {
  hasPortfolioSelection,
  toggleHoldingSelection,
} from "@/household/portfolio-selection";
import { EmptyState, SheetOverlay } from "@/components/NativeUI";
import { HoldingPnlBadge } from "@/components/portfolio/PortfolioPnlSummary";
import { holdingPnl, holdingValueYen } from "@/ledger/portfolio";
import type { Holding, HoldingSnapshot } from "@/ledger/portfolio";
import { formatYen } from "@/lib/format-yen";

function StatusFilterTabs({
  value,
  onChange,
}: {
  value: HoldingStatusFilter;
  onChange: (value: HoldingStatusFilter) => void;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <div className="flex min-w-max gap-2">
        {HOLDING_STATUS_FILTER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${
              value === option.value
                ? "bg-[#007aff] text-white"
                : "bg-white text-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:text-neutral-300"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function HoldingsStatusFilter({
  value,
  onChange,
}: {
  value: HoldingStatusFilter;
  onChange: (value: HoldingStatusFilter) => void;
}) {
  return <StatusFilterTabs value={value} onChange={onChange} />;
}

export function HoldingsListPanel({
  holdings,
  assetClassNames,
  marketLinksByHolding,
  latestByHolding,
  selection,
  scopedHoldingIds,
  loading,
  statusFilter,
  onSelectionChange,
  onEditHolding,
}: {
  holdings: Holding[];
  assetClassNames: Map<string, string>;
  marketLinksByHolding: Map<string, CollectibleMarketLink>;
  latestByHolding: Map<string, HoldingSnapshot>;
  selection: PortfolioSelection;
  scopedHoldingIds: string[];
  loading: boolean;
  statusFilter: HoldingStatusFilter;
  onSelectionChange: (
    updater: (current: PortfolioSelection) => PortfolioSelection,
  ) => void;
  onEditHolding: (holding: Holding) => void;
}) {
  const [sortKey, setSortKey] = useState<HoldingSortKey>("value");
  const [page, setPage] = useState(1);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [holdings, statusFilter, sortKey]);

  const listRows = useMemo<HoldingListRow[]>(
    () =>
      holdings.map((holding) => {
        const snapshot = latestByHolding.get(holding.id);
        const link = marketLinksByHolding.get(holding.id);
        const pnl = holdingPnl(holding, snapshot);
        return {
          holding,
          valueYen: snapshot != null ? holdingValueYen(holding, snapshot) : null,
          pnlYen: pnl.pnlYen,
          returnPct: pnl.returnPct,
          noQuote: holdingShowsNoQuote(link, snapshot),
          missingCost: holding.costBasisYen == null,
          hasSnapshot: snapshot != null,
        };
      }),
    [holdings, latestByHolding, marketLinksByHolding],
  );

  const filteredRows = useMemo(
    () => filterAndSortHoldings(listRows, statusFilter, sortKey),
    [listRows, sortKey, statusFilter],
  );

  const { visible, page: currentPage, pageCount, hasPrev, hasNext } = useMemo(
    () => paginateHoldingsPage(filteredRows, page),
    [filteredRows, page],
  );

  return (
    <>
      <div className="border-b border-[#ececee] px-4 py-3 dark:border-neutral-800">
        <button
          type="button"
          onClick={() => setSortSheetOpen(true)}
          className="flex w-full items-center justify-between rounded-2xl bg-[#f2f2f7] px-3 py-2.5 text-left active:opacity-80 dark:bg-neutral-800"
        >
          <span className="text-[13px] font-medium text-neutral-500">Sort</span>
          <span className="text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
            {holdingSortLabel(sortKey)}
          </span>
        </button>
      </div>

      {loading ? (
        <EmptyState message="Loading holdings…" />
      ) : holdings.length === 0 ? (
        <EmptyState message="No holdings in this group yet." />
      ) : filteredRows.length === 0 ? (
        <EmptyState message="No holdings match this filter." />
      ) : (
        <>
          {visible.map((listRow) => {
            const { holding } = listRow;
            const link = marketLinksByHolding.get(holding.id);
            const isSelected =
              !hasPortfolioSelection(selection) ||
              scopedHoldingIds.includes(holding.id);
            const quantityLabel =
              holding.quantity != null
                ? ` · ${holding.quantity} units`
                : " · Total value";
            const costLabel =
              holding.costBasisYen != null
                ? ` · Cost ${formatYen(holding.costBasisYen)}`
                : "";

            return (
              <div
                key={holding.id}
                className={`flex w-full items-center gap-3 border-b border-[#ececee] px-4 py-3.5 last:border-b-0 dark:border-neutral-800${
                  isSelected ? "" : " opacity-40"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onSelectionChange((current) =>
                      toggleHoldingSelection(current, holding.id),
                    )
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left active:opacity-70"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">
                      {holding.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-neutral-500">
                      {assetClassNames.get(holding.assetClassId) ?? "Class"}
                      {quantityLabel}
                      {costLabel}
                      {link ? ` · ${link.collectibleCode}` : ""}
                    </span>
                  </span>
                  <span className="flex flex-col items-end gap-0.5">
                    {listRow.noQuote ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                        No quote
                      </span>
                    ) : (
                      <span className="text-[15px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
                        {listRow.valueYen == null ? "—" : formatYen(listRow.valueYen)}
                      </span>
                    )}
                    {!listRow.noQuote ? (
                      <HoldingPnlBadge
                        pnlYen={listRow.pnlYen}
                        returnPct={listRow.returnPct}
                      />
                    ) : null}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onEditHolding(holding)}
                  className="shrink-0 px-1 py-2 text-[20px] text-neutral-300 active:text-neutral-500"
                  aria-label={`Edit ${holding.name}`}
                >
                  ›
                </button>
              </div>
            );
          })}
          {pageCount > 1 ? (
            <div className="flex items-center justify-between border-t border-[#ececee] px-4 py-3 dark:border-neutral-800">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => setPage((value) => value - 1)}
                className="text-[15px] font-semibold text-[#007aff] disabled:text-neutral-300"
              >
                ‹ Prev
              </button>
              <span className="text-[13px] tabular-nums text-neutral-500">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setPage((value) => value + 1)}
                className="text-[15px] font-semibold text-[#007aff] disabled:text-neutral-300"
              >
                Next ›
              </button>
            </div>
          ) : null}
        </>
      )}

      <SheetOverlay
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title="Sort holdings"
      >
        <div className="overflow-hidden rounded-2xl bg-[#f2f2f7] dark:bg-neutral-800">
          {HOLDING_SORT_OPTIONS.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setSortKey(option.value);
                setSortSheetOpen(false);
              }}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:opacity-70${
                index > 0 ? " border-t border-[#ececee] dark:border-neutral-700" : ""
              }`}
            >
              <span className="text-[17px] font-medium">{option.label}</span>
              {sortKey === option.value ? (
                <span className="text-[15px] font-semibold text-[#007aff]">Selected</span>
              ) : null}
            </button>
          ))}
        </div>
      </SheetOverlay>
    </>
  );
}
