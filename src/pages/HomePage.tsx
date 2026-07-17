import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { fetchEntries } from "@/household/entries";
import { fetchPockets } from "@/household/pockets";
import { activePockets, pocketNameById, toLedgerPockets } from "@/household/pocket-utils";
import { netTone } from "@/household/entry-display";
import {
  balancesByPocket,
  householdBalance,
  monthlyTotals,
} from "@/ledger/ledger";
import {
  CategoryIcon,
  EmptyState,
  ErrorNote,
  GroupCard,
  ListRow,
  PocketIcon,
} from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { currentMonthInTokyo, formatYen } from "@/lib/format-yen";

export default function HomePage() {
  const { username, household, authError, signOut } = useAuth();
  const { registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [pockets, setPockets] = useState<Awaited<ReturnType<typeof fetchPockets>>>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const ledgerPockets = useMemo(() => toLedgerPockets(pockets), [pockets]);
  const totals = useMemo(
    () => monthlyTotals(entries, month.year, month.month),
    [entries, month.month, month.year],
  );
  const pocketBalances = useMemo(() => {
    const names = pocketNameById(pockets);
    return balancesByPocket(entries, ledgerPockets).map((balance) => ({
      ...balance,
      name: names.get(balance.pocketId) ?? "Pocket",
    }));
  }, [entries, ledgerPockets, pockets]);
  const allTimeHouseholdBalance = useMemo(
    () => householdBalance(entries, ledgerPockets),
    [entries, ledgerPockets],
  );

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextEntries, nextPockets] = await Promise.all([
        fetchEntries(),
        fetchPockets(),
      ]);
      setEntries(nextEntries);
      setPockets(nextPockets);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load dashboard",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => registerEntryChangeListener(loadDashboard), [
    loadDashboard,
    registerEntryChangeListener,
  ]);

  useRefreshOnFocus(loadDashboard);

  const visiblePockets = activePockets(pockets);

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-neutral-500">
              {month.label}
            </p>
            <h1 className="text-[34px] font-bold leading-tight tracking-tight">
              {household?.name ?? "Hartayu"}
            </h1>
            {username ? (
              <p className="mt-1 text-[15px] text-neutral-500">Hi, {username}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-600 shadow-sm"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {authError ? <ErrorNote message={authError} /> : null}
        {loadError ? <ErrorNote message={loadError} /> : null}

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
            Net this month
          </p>
          <p
            className={`mt-2 text-[40px] font-bold tracking-tight ${netTone(totals.netYen)}`}
          >
            {formatYen(totals.netYen)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3">
              <p className="text-[12px] font-medium text-neutral-500">Income</p>
              <p className="mt-1 text-[17px] font-semibold text-[#34c759]">
                {formatYen(totals.incomeYen)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3">
              <p className="text-[12px] font-medium text-neutral-500">Expense</p>
              <p className="mt-1 text-[17px] font-semibold text-[#ff3b30]">
                {formatYen(totals.expenseYen)}
              </p>
            </div>
          </div>
        </section>

        <GroupCard title="Categories">
          <Link to="/categories" className="block">
            <ListRow>
              <CategoryIcon kind="expense" />
              <span className="min-w-0 flex-1 text-[17px] font-medium">
                View this month&apos;s breakdown
              </span>
              <span className="text-[20px] text-neutral-300">›</span>
            </ListRow>
          </Link>
        </GroupCard>

        <GroupCard
          title="Pockets"
          footer={`All-time household balance across active pockets: ${formatYen(allTimeHouseholdBalance)}`}
        >
          {loading ? (
            <EmptyState message="Loading pockets…" />
          ) : visiblePockets.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-[15px] text-neutral-500">No pockets yet.</p>
              <Link
                to="/settings"
                className="mt-2 inline-block text-[15px] font-medium text-[#007aff]"
              >
                Add pockets in Settings
              </Link>
            </div>
          ) : (
            pocketBalances.map((pocket) => (
              <ListRow key={pocket.pocketId}>
                <PocketIcon name={pocket.name} />
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
                  {pocket.name}
                </span>
                <span
                  className={`text-[17px] font-semibold tabular-nums ${netTone(pocket.balanceYen)}`}
                >
                  {formatYen(pocket.balanceYen)}
                </span>
              </ListRow>
            ))
          )}
        </GroupCard>
      </main>
    </>
  );
}
