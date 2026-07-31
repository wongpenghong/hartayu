import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { fetchAssetClasses, type AssetClass } from "@/household/asset-classes";
import {
  createHolding,
  deleteHolding,
  fetchHoldings,
  updateHolding,
} from "@/household/holdings";
import {
  createBatchSnapshotSession,
  fetchHoldingSnapshots,
  fetchSnapshotSessions,
} from "@/household/snapshots";
import { breakdownColor } from "@/household/breakdown-colors";
import { DonutChart } from "@/components/DonutChart";
import { LineChart } from "@/components/LineChart";
import {
  PortfolioHoldingSheet,
  PortfolioSnapshotSheet,
  type SnapshotLineState,
} from "@/components/portfolio/PortfolioSheets";
import {
  EmptyState,
  ErrorNote,
  GroupCard,
  ListRow,
  PillTabs,
} from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import {
  allocationByAssetClass,
  allocationByHolding,
  holdingValueYen,
  latestSessionId,
  latestSnapshotsByHolding,
  portfolioTrendPoints,
} from "@/ledger/portfolio";
import type { Holding, HoldingSnapshot, SnapshotSession } from "@/ledger/portfolio";
import { formatYenCompact, parseYenInput, todayInTokyo } from "@/lib/format-yen";

type HoldingSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; holding: Holding };

export default function PortfolioPage() {
  const { household } = useAuth();
  const [assetClasses, setAssetClasses] = useState<AssetClass[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [sessions, setSessions] = useState<SnapshotSession[]>([]);
  const [snapshots, setSnapshots] = useState<HoldingSnapshot[]>([]);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [holdingSheet, setHoldingSheet] = useState<HoldingSheetMode>({ kind: "closed" });
  const [snapshotOpen, setSnapshotOpen] = useState(false);
  const [holdingName, setHoldingName] = useState("");
  const [holdingClassId, setHoldingClassId] = useState("");
  const [holdingQuantity, setHoldingQuantity] = useState("");
  const [holdingCostBasis, setHoldingCostBasis] = useState("");
  const [snapshotDate, setSnapshotDate] = useState(todayInTokyo());
  const [snapshotLines, setSnapshotLines] = useState<Record<string, SnapshotLineState>>({});
  const [busy, setBusy] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const assetClassNames = useMemo(
    () => new Map(assetClasses.map((row) => [row.id, row.name])),
    [assetClasses],
  );

  const latestSession = latestSessionId(sessions);
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

  const trendPoints = useMemo(() => {
    const filterId = classFilter === "all" ? null : classFilter;
    return portfolioTrendPoints(sessions, holdings, snapshots, filterId).map((row) => ({
      label: row.date.slice(5),
      value: row.totalYen,
    }));
  }, [classFilter, holdings, sessions, snapshots]);

  const donutSegments = useMemo(() => {
    if (!latestSession) {
      return [];
    }
    const rows =
      classFilter === "all"
        ? allocationByAssetClass(holdings, snapshots, latestSession)
        : allocationByHolding(holdings, snapshots, latestSession, classFilter);
    return rows.map((row, index) => ({
      id: row.id,
      label:
        classFilter === "all"
          ? (assetClassNames.get(row.id) ?? "Class")
          : (holdings.find((holding) => holding.id === row.id)?.name ?? "Holding"),
      value: row.totalYen,
      color: breakdownColor(index),
    }));
  }, [assetClassNames, classFilter, holdings, latestSession, snapshots]);

  const loadPortfolio = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextClasses, nextHoldings, nextSessions, nextSnapshots] = await Promise.all([
        fetchAssetClasses(),
        fetchHoldings(),
        fetchSnapshotSessions(),
        fetchHoldingSnapshots(),
      ]);
      setAssetClasses(nextClasses);
      setHoldings(nextHoldings);
      setSessions(nextSessions);
      setSnapshots(nextSnapshots);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load portfolio",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPortfolio();
  }, [loadPortfolio]);

  useRefreshOnFocus(loadPortfolio);

  function openAddHolding() {
    setHoldingName("");
    setHoldingClassId(assetClasses[0]?.id ?? "");
    setHoldingQuantity("");
    setHoldingCostBasis("");
    setSheetError(null);
    setHoldingSheet({ kind: "add" });
  }

  function openEditHolding(holding: Holding) {
    setHoldingName(holding.name);
    setHoldingClassId(holding.assetClassId);
    setHoldingQuantity(holding.quantity == null ? "" : String(holding.quantity));
    setHoldingCostBasis(
      holding.costBasisYen == null ? "" : String(holding.costBasisYen),
    );
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

    setBusy(true);
    setSheetError(null);
    try {
      if (holdingSheet.kind === "add") {
        const created = await createHolding({
          householdId: household.id,
          assetClassId: holdingClassId,
          name: holdingName,
          quantity,
          costBasisYen,
        });
        setHoldings((rows) => [...rows, created].sort((a, b) => a.name.localeCompare(b.name)));
      } else if (holdingSheet.kind === "edit") {
        const updated = await updateHolding(holdingSheet.holding.id, {
          assetClassId: holdingClassId,
          name: holdingName,
          quantity,
          costBasisYen,
        });
        setHoldings((rows) =>
          rows
            .map((row) => (row.id === updated.id ? updated : row))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      }
      setHoldingSheet({ kind: "closed" });
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
      setHoldings((rows) => rows.filter((row) => row.id !== holdingSheet.holding.id));
      setSnapshots((rows) =>
        rows.filter((row) => row.holdingId !== holdingSheet.holding.id),
      );
      setHoldingSheet({ kind: "closed" });
    } catch (caught) {
      setSheetError(caught instanceof Error ? caught.message : "Failed to delete holding");
    } finally {
      setBusy(false);
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
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">Portfolio</h1>
        <p className="mt-1 text-[15px] text-neutral-500">Investments tracked separately from cash</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        <PillTabs value={classFilter} onChange={setClassFilter} options={filterOptions} />

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
            />
          )}
        </section>

        <GroupCard
          title="Holdings"
          footer="Cost basis is stored for future P&L but hidden here."
        >
          <ListRow onClick={openAddHolding}>
            <span className="text-[17px] font-medium text-[#007aff]">+ Add holding</span>
          </ListRow>
          {holdings.length > 0 ? (
            <ListRow onClick={openSnapshotSheet}>
              <span className="text-[17px] font-medium text-[#007aff]">Update values</span>
            </ListRow>
          ) : null}
          {loading ? (
            <EmptyState message="Loading holdings…" />
          ) : visibleHoldings.length === 0 ? (
            <EmptyState message="No holdings in this group yet." />
          ) : (
            visibleHoldings.map((holding) => {
              const snapshot = latestByHolding.get(holding.id);
              const valueYen =
                snapshot != null ? holdingValueYen(holding, snapshot) : null;
              return (
                <ListRow key={holding.id} onClick={() => openEditHolding(holding)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">
                      {holding.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-neutral-500">
                      {assetClassNames.get(holding.assetClassId) ?? "Class"}
                      {holding.quantity != null ? ` · ${holding.quantity} units` : " · Total value"}
                    </span>
                  </span>
                  <span className="text-[15px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
                    {valueYen == null ? "—" : formatYenCompact(valueYen)}
                  </span>
                  <span className="text-[20px] text-neutral-300">›</span>
                </ListRow>
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
        busy={busy}
        error={sheetError}
        onClose={() => setHoldingSheet({ kind: "closed" })}
        onNameChange={setHoldingName}
        onAssetClassIdChange={setHoldingClassId}
        onQuantityChange={setHoldingQuantity}
        onCostBasisChange={setHoldingCostBasis}
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
    </>
  );
}
