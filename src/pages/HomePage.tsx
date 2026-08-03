import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { BillsDueSummary } from "@/components/BillsDueSummary";
import { HomeGlanceSummary } from "@/components/HomeGlanceSummary";
import { RemainingBudgetSummary } from "@/components/RemainingBudgetSummary";
import { PocketsSummary } from "@/components/PocketsSummary";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { GoalsSummary } from "@/components/GoalsSummary";
import { categoryNameById } from "@/household/category-utils";
import { fetchCategories } from "@/household/categories";
import {
  billAttributionPickerValue,
  billPayNote,
  currentPeriodInTokyo,
  fetchBills,
  markBillPaid,
  unpaidBillsForPeriod,
} from "@/household/bills";
import { fetchEntries } from "@/household/entries";
import { fetchGoalContributions, fetchGoals } from "@/household/goals";
import { fetchPockets } from "@/household/pockets";
import { fetchHoldings } from "@/household/holdings";
import {
  fetchHoldingSnapshots,
  fetchSnapshotSessions,
} from "@/household/snapshots";
import {
  portfolioPnlSummary,
  portfolioTotalValueLatest,
  portfolioValuedHoldingCount,
} from "@/ledger/portfolio";
import type { Holding, HoldingSnapshot, SnapshotSession } from "@/ledger/portfolio";
import { activePockets, defaultPocketId, toLedgerPockets } from "@/household/pocket-utils";
import {
  balancesByPocket,
  householdBalance,
  monthlyTotals,
  remainingBudgetByCategory,
} from "@/ledger/ledger";
import type { Bill } from "@/ledger/types";
import { ErrorNote } from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";
import { currentBudgetCycleInTokyo } from "@/lib/budget-cycle";

const HOME_PAGE_CACHE = "home-page";

type HomePageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  goals: Awaited<ReturnType<typeof fetchGoals>>;
  contributions: Awaited<ReturnType<typeof fetchGoalContributions>>;
  pockets: Awaited<ReturnType<typeof fetchPockets>>;
  bills: Bill[];
  holdings: Holding[];
  snapshotSessions: SnapshotSession[];
  holdingSnapshots: HoldingSnapshot[];
};

export default function HomePage() {
  const { username, household, user, authError } = useAuth();
  const { openAddEntryWithDraft, registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<HomePageCache>(HOME_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [categories, setCategories] = useState(cached?.categories ?? []);
  const [goals, setGoals] = useState(cached?.goals ?? []);
  const [contributions, setContributions] = useState(cached?.contributions ?? []);
  const [pockets, setPockets] = useState(cached?.pockets ?? []);
  const [holdings, setHoldings] = useState<Holding[]>(cached?.holdings ?? []);
  const [snapshotSessions, setSnapshotSessions] = useState<SnapshotSession[]>(
    cached?.snapshotSessions ?? [],
  );
  const [holdingSnapshots, setHoldingSnapshots] = useState<HoldingSnapshot[]>(
    cached?.holdingSnapshots ?? [],
  );
  const [bills, setBills] = useState<Bill[]>(cached?.bills ?? []);
  const [busyBillId, setBusyBillId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasPageCache(HOME_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);

  const month = useMemo(
    () => currentBudgetCycleInTokyo(),
    [household?.budgetCycleEndDay, household?.budgetCycleStartDay],
  );
  const currentPeriod = useMemo(
    () => currentPeriodInTokyo(),
    [household?.budgetCycleEndDay, household?.budgetCycleStartDay],
  );
  const unpaidBills = useMemo(
    () => unpaidBillsForPeriod(bills, currentPeriod),
    [bills, currentPeriod],
  );
  const totals = useMemo(
    () => monthlyTotals(entries, month.year, month.month),
    [entries, month.month, month.year],
  );
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const budgetRows = useMemo(
    () =>
      remainingBudgetByCategory(entries, categories, month.year, month.month, 100),
    [categories, entries, month.month, month.year],
  );
  const activePocketList = useMemo(() => activePockets(pockets), [pockets]);
  const pocketBalances = useMemo(
    () => balancesByPocket(entries, toLedgerPockets(pockets)),
    [entries, pockets],
  );
  const pocketBalanceYen = useMemo(
    () => householdBalance(entries, toLedgerPockets(pockets)),
    [entries, pockets],
  );
  const portfolioTotalYen = useMemo(
    () => portfolioTotalValueLatest(holdings, snapshotSessions, holdingSnapshots),
    [holdingSnapshots, holdings, snapshotSessions],
  );
  const portfolioPnl = useMemo(
    () => portfolioPnlSummary(holdings, snapshotSessions, holdingSnapshots),
    [holdingSnapshots, holdings, snapshotSessions],
  );
  const portfolioValuedCount = useMemo(
    () => portfolioValuedHoldingCount(holdings, snapshotSessions, holdingSnapshots),
    [holdingSnapshots, holdings, snapshotSessions],
  );

  const loadDashboard = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [
        nextEntries,
        nextCategories,
        nextGoals,
        nextContributions,
        nextPockets,
        nextBills,
        nextHoldings,
        nextSnapshotSessions,
        nextHoldingSnapshots,
      ] = await Promise.all([
        fetchEntries(),
        fetchCategories(),
        fetchGoals(),
        fetchGoalContributions(),
        fetchPockets(),
        fetchBills(),
        fetchHoldings(),
        fetchSnapshotSessions(),
        fetchHoldingSnapshots(),
      ]);
      setEntries(nextEntries);
      setCategories(nextCategories);
      setGoals(nextGoals);
      setContributions(nextContributions);
      setPockets(nextPockets);
      setBills(nextBills);
      setHoldings(nextHoldings);
      setSnapshotSessions(nextSnapshotSessions);
      setHoldingSnapshots(nextHoldingSnapshots);
      setPageCache(HOME_PAGE_CACHE, {
        entries: nextEntries,
        categories: nextCategories,
        goals: nextGoals,
        contributions: nextContributions,
        pockets: nextPockets,
        bills: nextBills,
        holdings: nextHoldings,
        snapshotSessions: nextSnapshotSessions,
        holdingSnapshots: nextHoldingSnapshots,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard({ background: hasPageCache(HOME_PAGE_CACHE) });
  }, [loadDashboard]);

  useEffect(
    () => registerEntryChangeListener(() => void loadDashboard({ background: true })),
    [loadDashboard, registerEntryChangeListener],
  );

  useRefreshOnFocus(loadDashboard);

  function handlePayBill(bill: Bill) {
    if (!user) {
      return;
    }

    openAddEntryWithDraft(
      {
        kind: "expense",
        categoryId: bill.categoryId,
        amountYen: bill.amountYen ?? undefined,
        pocketId: bill.defaultPocketId ?? defaultPocketId(pockets, user.id),
        note: billPayNote(bill.name, month.year, month.month),
        attribution: billAttributionPickerValue(bill, user.id),
      },
      { billId: bill.id },
    );
  }

  async function handleAlreadyLogged(bill: Bill) {
    setBusyBillId(bill.id);
    try {
      const updated = await markBillPaid(bill.id, currentPeriod);
      setBills((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to mark bill paid",
      );
    } finally {
      setBusyBillId(null);
    }
  }

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-[13px] font-medium text-neutral-500">{month.label}</p>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          {household?.name ?? "Hartayu"}
        </h1>
        {username ? (
          <p className="mt-1 text-[15px] text-neutral-500">Hi, {username}</p>
        ) : null}
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {authError ? <ErrorNote message={authError} /> : null}
        {loadError ? <ErrorNote message={loadError} /> : null}

        <HomeGlanceSummary totals={totals} pocketBalanceYen={pocketBalanceYen} />

        <RemainingBudgetSummary
          rows={budgetRows}
          categoryNameById={categoriesById}
          loading={loading}
        />

        <BillsDueSummary
          bills={unpaidBills}
          categories={categories}
          loading={loading}
          onPay={handlePayBill}
          onAlreadyLogged={(bill) => void handleAlreadyLogged(bill)}
          busyBillId={busyBillId}
        />

        <GoalsSummary
          goals={goals}
          contributions={contributions}
          loading={loading}
        />

        <PocketsSummary
          pockets={activePocketList}
          balances={pocketBalances}
          loading={loading}
        />

        <PortfolioSummary
          totalValueYen={portfolioTotalYen}
          holdingCount={holdings.length}
          valuedHoldingCount={portfolioValuedCount}
          pnlSummary={portfolioPnl}
          loading={loading}
        />
      </main>
    </>
  );
}
