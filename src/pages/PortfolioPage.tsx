import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { canRefreshMarketPrices } from "@/auth/member-auth";
import { fetchAssetClasses, type AssetClass } from "@/household/asset-classes";
import {
  createHolding,
  createHoldingsBatch,
  deleteHolding,
  fetchHoldings,
  updateHolding,
} from "@/household/holdings";
import {
  clearHoldingDraft,
  loadHoldingDraft,
  saveHoldingDraft,
} from "@/household/holding-draft";
import {
  clearBulkAddDraft,
  loadBulkAddDraft,
  saveBulkAddDraft,
} from "@/household/holding-bulk-draft";
import {
  COLLECTIBLES_CLASS_NAME,
  deleteCollectibleMarketLink,
  fetchCollectibleMarketLinks,
  hasMarketLinkInput,
  holdingShowsNoQuote,
  isCollectiblesAssetClass,
  parseSnkrdunkProductId,
  refreshHouseholdMarketPrices,
  upsertCollectibleMarketLink,
  validateMarketLinkInput,
  type CollectibleMarketLink,
} from "@/household/collectible-market-links";
import {
  activeSelectionIds,
  hasPortfolioSelection,
  resolveScopedHoldingIds,
  toggleDonutSelection,
  toggleHoldingSelection,
  type PortfolioSelection,
} from "@/household/portfolio-selection";
import {
  emptyBulkRow,
  findDuplicateInQueue,
  queueItemFromForm,
  validateBulkRow,
  type BulkHoldingQueueItem,
  type BulkRowForm,
} from "@/household/holding-bulk-queue";
import {
  createBatchSnapshotSession,
  fetchHoldingSnapshots,
  fetchSnapshotSessions,
} from "@/household/snapshots";
import { breakdownColor } from "@/household/breakdown-colors";
import { DonutChart } from "@/components/DonutChart";
import { LineChart } from "@/components/LineChart";
import {
  PortfolioBulkAddSheet,
  PortfolioHoldingSheet,
  PortfolioSnapshotSheet,
  type SnapshotLineState,
} from "@/components/portfolio/PortfolioSheets";
import {
  EmptyState,
  ErrorNote,
  GroupCard,
  ListRow,
  PageBackLink,
  PillTabs,
} from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";
import {
  allocationByAssetClassLatest,
  allocationByHoldingLatest,
  holdingPnl,
  holdingValueYen,
  holdingsNeedCostBasisHint,
  latestSnapshotsByHolding,
  portfolioPnlSummary,
  portfolioTrendSessionPoints,
} from "@/ledger/portfolio";
import type { Holding, HoldingSnapshot, SnapshotSession } from "@/ledger/portfolio";
import { formatYen, parseYenInput, todayInTokyo } from "@/lib/format-yen";
import type { ConditionGrade } from "@/market/snkrdunk";
import {
  HoldingPnlBadge,
  PortfolioPnlSummaryCard,
} from "@/components/portfolio/PortfolioPnlSummary";

type HoldingSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; holding: Holding };

const PORTFOLIO_PAGE_CACHE = "portfolio-page";

type PortfolioPageCache = {
  assetClasses: AssetClass[];
  holdings: Holding[];
  marketLinks: CollectibleMarketLink[];
  sessions: SnapshotSession[];
  snapshots: HoldingSnapshot[];
};

export default function PortfolioPage() {
  const { household, username } = useAuth();
  const cached = getPageCache<PortfolioPageCache>(PORTFOLIO_PAGE_CACHE);
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>(cached?.assetClasses ?? []);
  const [holdings, setHoldings] = useState<Holding[]>(cached?.holdings ?? []);
  const [marketLinks, setMarketLinks] = useState<CollectibleMarketLink[]>(
    cached?.marketLinks ?? [],
  );
  const [sessions, setSessions] = useState<SnapshotSession[]>(cached?.sessions ?? []);
  const [snapshots, setSnapshots] = useState<HoldingSnapshot[]>(cached?.snapshots ?? []);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selection, setSelection] = useState<PortfolioSelection>({ kind: "none" });
  const [loading, setLoading] = useState(!hasPageCache(PORTFOLIO_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [holdingSheet, setHoldingSheet] = useState<HoldingSheetMode>({ kind: "closed" });
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [holdingName, setHoldingName] = useState("");
  const [holdingClassId, setHoldingClassId] = useState("");
  const [holdingQuantity, setHoldingQuantity] = useState("");
  const [holdingCostBasis, setHoldingCostBasis] = useState("");
  const [collectibleCode, setCollectibleCode] = useState("");
  const [snkrdunkProductId, setSnkrdunkProductId] = useState("");
  const [conditionGrade, setConditionGrade] = useState<ConditionGrade | "">("");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const [snapshotDate, setSnapshotDate] = useState(todayInTokyo());
  const [snapshotLines, setSnapshotLines] = useState<Record<string, SnapshotLineState>>({});
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkQueue, setBulkQueue] = useState<BulkHoldingQueueItem[]>([]);
  const [bulkRow, setBulkRow] = useState<BulkRowForm>({
    name: "",
    assetClassId: "",
    quantity: "",
    costBasis: "",
    collectibleCode: "",
    snkrdunkProductId: "",
    conditionGrade: "",
  });
  const [draftRestored, setDraftRestored] = useState(false);
  const [bulkDraftRestored, setBulkDraftRestored] = useState(false);

  const assetClassNames = useMemo(
    () => new Map(assetClasses.map((row) => [row.id, row.name])),
    [assetClasses],
  );

  const marketLinksByHolding = useMemo(
    () => new Map(marketLinks.map((row) => [row.holdingId, row])),
    [marketLinks],
  );

  const hasMarketLinks = marketLinks.length > 0;
  const showMarketRefresh = hasMarketLinks && canRefreshMarketPrices(username);

  const latestByHolding = useMemo(
    () => latestSnapshotsByHolding(sessions, snapshots),
    [sessions, snapshots],
  );

  const visibleHoldings = useMemo(
    () =>
      classFilter === "all"
        ? holdings
        : holdings.filter((holding) => holding.assetClassId === classFilter),
    [classFilter, holdings],
  );

  const scopedHoldingIds = useMemo(
    () => resolveScopedHoldingIds(holdings, classFilter, selection),
    [classFilter, holdings, selection],
  );

  const scopedHoldingIdSet = useMemo(
    () => (hasPortfolioSelection(selection) ? new Set(scopedHoldingIds) : null),
    [scopedHoldingIds, selection],
  );

  const trendPoints = useMemo(() => {
    const filterId = hasPortfolioSelection(selection)
      ? null
      : classFilter === "all"
        ? null
        : classFilter;
    return portfolioTrendSessionPoints(
      sessions,
      holdings,
      snapshots,
      filterId,
      scopedHoldingIdSet,
    ).map((row) => ({
      date: row.date,
      label: row.label,
      caption: row.caption,
      value: row.value,
    }));
  }, [classFilter, holdings, scopedHoldingIdSet, selection, sessions, snapshots]);

  const donutSegments = useMemo(() => {
    const rows =
      classFilter === "all"
        ? allocationByAssetClassLatest(holdings, sessions, snapshots)
        : allocationByHoldingLatest(holdings, sessions, snapshots, classFilter);
    return rows.map((row, index) => ({
      id: row.id,
      label:
        classFilter === "all"
          ? (assetClassNames.get(row.id) ?? "Class")
          : (holdings.find((holding) => holding.id === row.id)?.name ?? "Holding"),
      value: row.totalYen,
      color: breakdownColor(index),
    }));
  }, [assetClassNames, classFilter, holdings, sessions, snapshots]);

  const pnlSummary = useMemo(() => {
    const filterId = hasPortfolioSelection(selection)
      ? null
      : classFilter === "all"
        ? null
        : classFilter;
    return portfolioPnlSummary(holdings, sessions, snapshots, filterId, scopedHoldingIdSet);
  }, [classFilter, holdings, scopedHoldingIdSet, selection, sessions, snapshots]);

  const showCostBasisHint = useMemo(() => {
    const filterId = hasPortfolioSelection(selection)
      ? null
      : classFilter === "all"
        ? null
        : classFilter;
    return holdingsNeedCostBasisHint(
      holdings,
      sessions,
      snapshots,
      filterId,
      scopedHoldingIdSet,
    );
  }, [classFilter, holdings, scopedHoldingIdSet, selection, sessions, snapshots]);

  const collectiblesClassId = useMemo(
    () => assetClasses.find((row) => row.name === COLLECTIBLES_CLASS_NAME)?.id ?? "",
    [assetClasses],
  );

  const bulkDuplicateWarning = useMemo(
    () => findDuplicateInQueue(bulkQueue, bulkRow),
    [bulkQueue, bulkRow],
  );

  const loadPortfolio = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [nextClasses, nextHoldings, nextSessions, nextSnapshots, nextMarketLinks] =
        await Promise.all([
        fetchAssetClasses(),
        fetchHoldings(),
        fetchSnapshotSessions(),
        fetchHoldingSnapshots(),
        fetchCollectibleMarketLinks(),
      ]);
      setAssetClasses(nextClasses);
      setHoldings(nextHoldings);
      setSessions(nextSessions);
      setSnapshots(nextSnapshots);
      setMarketLinks(nextMarketLinks);
      setPageCache(PORTFOLIO_PAGE_CACHE, {
        assetClasses: nextClasses,
        holdings: nextHoldings,
        marketLinks: nextMarketLinks,
        sessions: nextSessions,
        snapshots: nextSnapshots,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load portfolio",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPortfolio({ background: hasPageCache(PORTFOLIO_PAGE_CACHE) });
  }, [loadPortfolio]);

  useEffect(() => {
    setSelection({ kind: "none" });
  }, [classFilter]);

  useRefreshOnFocus(loadPortfolio);

  useEffect(() => {
    if (draftRestored || loading || assetClasses.length === 0) {
      return;
    }

    const draft = loadHoldingDraft();
    if (!draft) {
      setDraftRestored(true);
      return;
    }

    setHoldingName(draft.name);
    setHoldingClassId(draft.assetClassId);
    setHoldingQuantity(draft.quantity);
    setHoldingCostBasis(draft.costBasis);
    setCollectibleCode(draft.collectibleCode);
    setSnkrdunkProductId(draft.snkrdunkProductId);
    setConditionGrade(draft.conditionGrade);
    setSheetError(null);

    if (draft.mode === "edit" && draft.holdingId) {
      const holding = holdings.find((row) => row.id === draft.holdingId);
      if (holding) {
        setHoldingSheet({ kind: "edit", holding });
      } else {
        setHoldingSheet({ kind: "add" });
      }
    } else {
      setHoldingSheet({ kind: "add" });
    }

    setDraftRestored(true);
  }, [assetClasses.length, draftRestored, holdings, loading]);

  useEffect(() => {
    if (bulkDraftRestored || loading || assetClasses.length === 0) {
      return;
    }

    const draft = loadBulkAddDraft();
    if (!draft) {
      setBulkDraftRestored(true);
      return;
    }

    setBulkQueue(draft.queue);
    setBulkRow(draft.row);
    setSheetError(null);
    setBulkOpen(true);
    setBulkDraftRestored(true);
  }, [assetClasses.length, bulkDraftRestored, loading]);

  useEffect(() => {
    if (holdingSheet.kind === "closed") {
      return;
    }

    saveHoldingDraft({
      mode: holdingSheet.kind === "edit" ? "edit" : "add",
      holdingId: holdingSheet.kind === "edit" ? holdingSheet.holding.id : undefined,
      name: holdingName,
      assetClassId: holdingClassId,
      quantity: holdingQuantity,
      costBasis: holdingCostBasis,
      collectibleCode,
      snkrdunkProductId,
      conditionGrade,
    });
  }, [
    collectibleCode,
    conditionGrade,
    holdingClassId,
    holdingCostBasis,
    holdingName,
    holdingQuantity,
    holdingSheet,
    snkrdunkProductId,
  ]);

  useEffect(() => {
    if (!bulkOpen) {
      return;
    }

    saveBulkAddDraft({ queue: bulkQueue, row: bulkRow });
  }, [bulkOpen, bulkQueue, bulkRow]);

  function closeHoldingSheet() {
    clearHoldingDraft();
    setHoldingSheet({ kind: "closed" });
    setSheetError(null);
  }

  function resetMarketLinkFields(link?: CollectibleMarketLink) {
    setCollectibleCode(link?.collectibleCode ?? "");
    setSnkrdunkProductId(
      link?.snkrdunkProductId == null ? "" : String(link.snkrdunkProductId),
    );
    setConditionGrade(link?.conditionGrade ?? "");
  }

  function openAddHolding() {
    setHoldingName("");
    setHoldingClassId(assetClasses[0]?.id ?? "");
    setHoldingQuantity("");
    setHoldingCostBasis("");
    resetMarketLinkFields();
    setSheetError(null);
    setHoldingSheet({ kind: "add" });
  }

  function openBulkAdd() {
    const sticky = {
      assetClassId: collectiblesClassId || assetClasses[0]?.id || "",
      conditionGrade: "" as ConditionGrade | "",
    };
    setBulkQueue([]);
    setBulkRow(emptyBulkRow(sticky));
    setSheetError(null);
    setBulkOpen(true);
  }

  function closeBulkAdd() {
    clearBulkAddDraft();
    setBulkOpen(false);
    setBulkQueue([]);
    setSheetError(null);
  }

  function openEditHolding(holding: Holding) {
    setHoldingName(holding.name);
    setHoldingClassId(holding.assetClassId);
    setHoldingQuantity(holding.quantity == null ? "" : String(holding.quantity));
    setHoldingCostBasis(
      holding.costBasisYen == null ? "" : String(holding.costBasisYen),
    );
    resetMarketLinkFields(marketLinksByHolding.get(holding.id));
    setSheetError(null);
    setHoldingSheet({ kind: "edit", holding });
  }

  function openSnapshotSheet() {
    const prior = latestSnapshotsByHolding(sessions, snapshots);
    const lines: Record<string, SnapshotLineState> = {};
    for (const holding of holdings) {
      lines[holding.id] = {
        unitPriceInput: "",
        totalValueInput: "",
        skipped: prior.has(holding.id),
      };
    }
    setSnapshotDate(todayInTokyo());
    setSnapshotLines(lines);
    setSheetError(null);
    setSnapshotOpen(true);
  }

  async function handleSaveHolding() {
    if (!household) {
      return;
    }

    const quantity =
      holdingQuantity.trim() === "" ? null : Number.parseFloat(holdingQuantity);
    const costBasisYen = parseYenInput(holdingCostBasis);
    const showMarketLink = isCollectiblesAssetClass(holdingClassId, assetClassNames);
    const marketLinkError = showMarketLink
      ? validateMarketLinkInput({
          collectibleCode,
          snkrdunkProductId,
          conditionGrade,
        })
      : null;

    if (marketLinkError) {
      setSheetError(marketLinkError);
      return;
    }

    setBusy(true);
    setSheetError(null);
    try {
      let savedHoldingId: string;
      if (holdingSheet.kind === "add") {
        const created = await createHolding({
          householdId: household.id,
          assetClassId: holdingClassId,
          name: holdingName,
          quantity,
          costBasisYen,
        });
        savedHoldingId = created.id;
        setHoldings((rows) => [...rows, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (holdingSheet.kind === "edit") {
        const updated = await updateHolding(holdingSheet.holding.id, {
          assetClassId: holdingClassId,
          name: holdingName,
          quantity,
          costBasisYen,
        });
        savedHoldingId = updated.id;
        setHoldings((rows) =>
          rows
            .map((row) => (row.id === updated.id ? updated : row))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } else {
        return;
      }

      const wantsMarketLink =
        showMarketLink &&
        hasMarketLinkInput({ collectibleCode, snkrdunkProductId, conditionGrade });
      if (wantsMarketLink) {
        const savedLink = await upsertCollectibleMarketLink({
          holdingId: savedHoldingId,
          collectibleCode,
          snkrdunkProductId: parseSnkrdunkProductId(snkrdunkProductId)!,
          conditionGrade: conditionGrade as ConditionGrade,
        });
        setMarketLinks((rows) => {
          const next = rows.filter((row) => row.holdingId !== savedHoldingId);
          return [...next, savedLink];
        });
      } else {
        await deleteCollectibleMarketLink(savedHoldingId);
        setMarketLinks((rows) => rows.filter((row) => row.holdingId !== savedHoldingId));
      }

      setHoldingSheet({ kind: "closed" });
      clearHoldingDraft();
    } catch (caught) {
      setSheetError(caught instanceof Error ? caught.message : "Failed to save holding");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteHolding() {
    if (holdingSheet.kind !== "edit") {
      return;
    }

    setBusy(true);
    setSheetError(null);
    try {
      await deleteHolding(holdingSheet.holding.id);
      await deleteCollectibleMarketLink(holdingSheet.holding.id);
      setHoldings((rows) => rows.filter((row) => row.id !== holdingSheet.holding.id));
      setMarketLinks((rows) =>
        rows.filter((row) => row.holdingId !== holdingSheet.holding.id),
      );
      setSnapshots((rows) =>
        rows.filter((row) => row.holdingId !== holdingSheet.holding.id),
      );
      setHoldingSheet({ kind: "closed" });
      clearHoldingDraft();
    } catch (caught) {
      setSheetError(caught instanceof Error ? caught.message : "Failed to delete holding");
    } finally {
      setBusy(false);
    }
  }

  function handleBulkAddAnother() {
    const error = validateBulkRow(bulkRow);
    if (error) {
      setSheetError(error);
      return;
    }
    if (bulkDuplicateWarning) {
      setSheetError("This code, grade, and product ID are already in the queue.");
      return;
    }

    const item = queueItemFromForm(bulkRow);
    if (!item) {
      setSheetError("Complete all fields before adding to the queue.");
      return;
    }

    setBulkQueue((rows) => [...rows, item]);
    setBulkRow(
      emptyBulkRow({
        assetClassId: bulkRow.assetClassId,
        conditionGrade: bulkRow.conditionGrade,
      }),
    );
    setSheetError(null);
  }

  async function handleBulkSaveAll() {
    if (!household || bulkQueue.length === 0) {
      return;
    }

    setBusy(true);
    setSheetError(null);
    try {
      const result = await createHoldingsBatch({
        householdId: household.id,
        rows: bulkQueue,
      });
      setHoldings((rows) =>
        [...rows, ...result.holdings].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setMarketLinks((rows) => [...rows, ...result.marketLinks]);
      closeBulkAdd();
    } catch (caught) {
      setSheetError(caught instanceof Error ? caught.message : "Failed to save holdings");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefreshMarketPrices() {
    if (!household) {
      return;
    }

    setRefreshBusy(true);
    setRefreshError(null);
    try {
      await refreshHouseholdMarketPrices(household.id);
      await loadPortfolio({ background: true });
    } catch (caught) {
      setRefreshError(
        caught instanceof Error ? caught.message : "Failed to refresh market prices",
      );
    } finally {
      setRefreshBusy(false);
    }
  }

  async function handleSaveSnapshot() {
    if (!household) {
      return;
    }

    setBusy(true);
    setSheetError(null);
    try {
      const prior = latestSnapshotsByHolding(sessions, snapshots);
      const quantityById = new Map(
        holdings.map((holding) => [holding.id, holding.quantity != null]),
      );
      const result = await createBatchSnapshotSession({
        householdId: household.id,
        asOfDate: snapshotDate,
        holdingsQuantityById: quantityById,
        priorSnapshotsByHolding: prior,
        lines: holdings.map((holding) => {
          const line = snapshotLines[holding.id] ?? {
            unitPriceInput: "",
            totalValueInput: "",
            skipped: true,
          };
          return {
            holdingId: holding.id,
            skipped: line.skipped,
            unitPriceYen: parseYenInput(line.unitPriceInput),
            totalValueYen: parseYenInput(line.totalValueInput),
          };
        }),
      });
      setSessions((rows) =>
        [...rows, result.session].sort((a, b) => a.asOfDate.localeCompare(b.asOfDate)),
      );
      setSnapshots((rows) => [...rows, ...result.snapshots]);
      setSnapshotOpen(false);
    } catch (caught) {
      setSheetError(
        caught instanceof Error ? caught.message : "Failed to save snapshot session",
      );
    } finally {
      setBusy(false);
    }
  }

  const filterOptions = [
    { value: "all", label: "All" },
    ...assetClasses.map((row) => ({ value: row.id, label: row.name })),
  ];

  const holdingSheetMode =
    holdingSheet.kind === "closed"
      ? "closed"
      : holdingSheet.kind === "add"
        ? "add"
        : "edit";

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Portfolio</h1>
        <p className="mt-1 text-[15px] text-neutral-500">Investments tracked separately from cash</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}
        {refreshError ? <ErrorNote message={refreshError} /> : null}

        <PillTabs
          value={classFilter}
          onChange={setClassFilter}
          options={filterOptions}
        />

        {hasPortfolioSelection(selection) ? (
          <button
            type="button"
            onClick={() => setSelection({ kind: "none" })}
            className="self-start rounded-full bg-[#007aff]/10 px-3 py-1.5 text-[13px] font-semibold text-[#007aff] active:opacity-70"
          >
            Clear selection ({scopedHoldingIds.length})
          </button>
        ) : null}

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="mb-4 text-[17px] font-semibold">Total trend</p>
          {loading ? (
            <EmptyState message="Loading portfolio…" />
          ) : (
            <LineChart points={trendPoints} />
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="mb-4 text-[17px] font-semibold">
            {classFilter === "all" ? "Allocation by class" : "Allocation by holding"}
          </p>
          {loading ? (
            <EmptyState message="Loading allocation…" />
          ) : (
            <DonutChart
              segments={donutSegments}
              centerLabel="Portfolio"
              emptyLabel="Add holdings and snapshot values to see allocation."
              selectedIds={
                hasPortfolioSelection(selection) ? activeSelectionIds(selection) : undefined
              }
              onSegmentClick={(segmentId) =>
                setSelection((current) => toggleDonutSelection(current, classFilter, segmentId))
              }
            />
          )}
        </section>

        <PortfolioPnlSummaryCard summary={pnlSummary} loading={loading} />

        <GroupCard
          title="Holdings"
          footer={
            showCostBasisHint
              ? "Add cost basis on holdings to see unrealized P&L."
              : undefined
          }
        >
          <ListRow onClick={openAddHolding}>
            <span className="text-[17px] font-medium text-[#007aff]">+ Add holding</span>
          </ListRow>
          {collectiblesClassId ? (
            <ListRow onClick={openBulkAdd}>
              <span className="text-[17px] font-medium text-[#007aff]">
                + Bulk add collectibles
              </span>
            </ListRow>
          ) : null}
          {holdings.length > 0 ? (
            <ListRow onClick={openSnapshotSheet}>
              <span className="text-[17px] font-medium text-[#007aff]">Update values</span>
            </ListRow>
          ) : null}
          {showMarketRefresh ? (
            <ListRow onClick={() => void handleRefreshMarketPrices()}>
              <span className="text-[17px] font-medium text-[#007aff]">
                {refreshBusy ? "Refreshing prices…" : "Refresh prices"}
              </span>
            </ListRow>
          ) : null}
          {loading ? (
            <EmptyState message="Loading holdings…" />
          ) : visibleHoldings.length === 0 ? (
            <EmptyState message="No holdings in this group yet." />
          ) : (
            visibleHoldings.map((holding) => {
              const snapshot = latestByHolding.get(holding.id);
              const link = marketLinksByHolding.get(holding.id);
              const valueYen =
                snapshot != null ? holdingValueYen(holding, snapshot) : null;
              const pnl = holdingPnl(holding, snapshot);
              const noQuote = holdingShowsNoQuote(link, snapshot);
              const isSelected =
                !hasPortfolioSelection(selection) || scopedHoldingIds.includes(holding.id);
              const quantityLabel =
                holding.quantity != null ? ` · ${holding.quantity} units` : " · Total value";
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
                      setSelection((current) => toggleHoldingSelection(current, holding.id))
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
                      {noQuote ? (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[12px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                          No quote
                        </span>
                      ) : (
                        <span className="text-[15px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
                          {valueYen == null ? "—" : formatYen(valueYen)}
                        </span>
                      )}
                      {!noQuote ? (
                        <HoldingPnlBadge pnlYen={pnl.pnlYen} returnPct={pnl.returnPct} />
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditHolding(holding)}
                    className="shrink-0 px-1 py-2 text-[20px] text-neutral-300 active:text-neutral-500"
                    aria-label={`Edit ${holding.name}`}
                  >
                    ›
                  </button>
                </div>
              );
            })
          )}
        </GroupCard>
      </main>

      <PortfolioHoldingSheet
        mode={holdingSheetMode}
        assetClasses={assetClasses}
        name={holdingName}
        assetClassId={holdingClassId}
        quantity={holdingQuantity}
        costBasis={holdingCostBasis}
        showMarketLinkFields={isCollectiblesAssetClass(holdingClassId, assetClassNames)}
        collectibleCode={collectibleCode}
        snkrdunkProductId={snkrdunkProductId}
        conditionGrade={conditionGrade}
        busy={busy}
        error={sheetError}
        onClose={closeHoldingSheet}
        onNameChange={setHoldingName}
        onAssetClassIdChange={setHoldingClassId}
        onQuantityChange={setHoldingQuantity}
        onCostBasisChange={setHoldingCostBasis}
        onCollectibleCodeChange={setCollectibleCode}
        onSnkrdunkProductIdChange={setSnkrdunkProductId}
        onConditionGradeChange={setConditionGrade}
        onSave={() => void handleSaveHolding()}
        onDelete={() => void handleDeleteHolding()}
      />

      <PortfolioSnapshotSheet
        open={snapshotOpen}
        holdings={holdings}
        assetClassNames={assetClassNames}
        snapshotDate={snapshotDate}
        snapshotLines={snapshotLines}
        busy={busy}
        error={sheetError}
        onClose={() => setSnapshotOpen(false)}
        onDateChange={setSnapshotDate}
        onLineChange={(holdingId, line) =>
          setSnapshotLines((rows) => ({ ...rows, [holdingId]: line }))
        }
        onSave={() => void handleSaveSnapshot()}
      />

      <PortfolioBulkAddSheet
        open={bulkOpen}
        assetClasses={assetClasses}
        collectiblesClassId={collectiblesClassId}
        assetClassId={bulkRow.assetClassId}
        conditionGrade={bulkRow.conditionGrade}
        name={bulkRow.name}
        quantity={bulkRow.quantity}
        costBasis={bulkRow.costBasis}
        collectibleCode={bulkRow.collectibleCode}
        snkrdunkProductId={bulkRow.snkrdunkProductId}
        queue={bulkQueue}
        duplicateWarning={bulkDuplicateWarning}
        busy={busy}
        error={sheetError}
        onClose={closeBulkAdd}
        onAssetClassIdChange={(value) =>
          setBulkRow((row) => ({ ...row, assetClassId: value }))
        }
        onConditionGradeChange={(value) =>
          setBulkRow((row) => ({ ...row, conditionGrade: value }))
        }
        onNameChange={(value) => setBulkRow((row) => ({ ...row, name: value }))}
        onQuantityChange={(value) => setBulkRow((row) => ({ ...row, quantity: value }))}
        onCostBasisChange={(value) => setBulkRow((row) => ({ ...row, costBasis: value }))}
        onCollectibleCodeChange={(value) =>
          setBulkRow((row) => ({ ...row, collectibleCode: value }))
        }
        onSnkrdunkProductIdChange={(value) =>
          setBulkRow((row) => ({ ...row, snkrdunkProductId: value }))
        }
        onAddAnother={handleBulkAddAnother}
        onSaveAll={() => void handleBulkSaveAll()}
      />
    </>
  );
}
