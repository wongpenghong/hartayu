import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { RecentTransactions } from "@/components/RecentTransactions";
import {
  SpendingTrendCard,
  type SpendingPeriod,
} from "@/components/SpendingTrendCard";
import { categoryNameById } from "@/household/category-utils";
import { fetchCategories } from "@/household/categories";
import { fetchEntries } from "@/household/entries";
import { fetchHouseholdMembers } from "@/household/members";
import { fetchPockets } from "@/household/pockets";
import { pocketNameById } from "@/household/pocket-utils";
import { netTone } from "@/household/entry-display";
import {
  expenseTotalForDate,
  expenseTotalForDateRange,
  monthlyTotals,
  recentEntries,
  trendPercent,
} from "@/ledger/ledger";
import { ErrorNote } from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import {
  currentMonthInTokyo,
  currentWeekRangeInTokyo,
  formatYen,
  previousWeekRangeInTokyo,
  todayInTokyo,
  yesterdayInTokyo,
} from "@/lib/format-yen";

export default function HomePage() {
  const { username, household, user, authError, signOut } = useAuth();
  const { openEditEntry, registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [pockets, setPockets] = useState<Awaited<ReturnType<typeof fetchPockets>>>([]);
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof fetchCategories>>
  >([]);
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof fetchHouseholdMembers>>
  >([]);
  const [spendingPeriod, setSpendingPeriod] = useState<SpendingPeriod>("daily");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const totals = useMemo(
    () => monthlyTotals(entries, month.year, month.month),
    [entries, month.month, month.year],
  );
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const pocketsById = useMemo(() => pocketNameById(pockets), [pockets]);
  const recent = useMemo(() => recentEntries(entries, 5), [entries]);

  const spending = useMemo(() => {
    if (spendingPeriod === "daily") {
      const today = todayInTokyo();
      const yesterday = yesterdayInTokyo();
      const current = expenseTotalForDate(entries, today);
      const previous = expenseTotalForDate(entries, yesterday);
      return { amountYen: current, trend: trendPercent(current, previous) };
    }

    const currentRange = currentWeekRangeInTokyo();
    const previousRange = previousWeekRangeInTokyo();
    const current = expenseTotalForDateRange(
      entries,
      currentRange.start,
      currentRange.end,
    );
    const previous = expenseTotalForDateRange(
      entries,
      previousRange.start,
      previousRange.end,
    );
    return { amountYen: current, trend: trendPercent(current, previous) };
  }, [entries, spendingPeriod]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextEntries, nextPockets, nextCategories, nextMembers] =
        await Promise.all([
          fetchEntries(),
          fetchPockets(),
          fetchCategories(),
          fetchHouseholdMembers(),
        ]);
      setEntries(nextEntries);
      setPockets(nextPockets);
      setCategories(nextCategories);
      setMembers(nextMembers);
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
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-600 shadow-sm dark:bg-neutral-900 dark:text-neutral-300 dark:shadow-none"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {authError ? <ErrorNote message={authError} /> : null}
        {loadError ? <ErrorNote message={loadError} /> : null}

        <SpendingTrendCard
          period={spendingPeriod}
          onPeriodChange={setSpendingPeriod}
          amountYen={spending.amountYen}
          trendPercent={spending.trend}
          loading={loading}
        />

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
            Net this month
          </p>
          <p
            className={`mt-2 text-[40px] font-bold tracking-tight ${netTone(totals.netYen)}`}
          >
            {formatYen(totals.netYen)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
              <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Income</p>
              <p className="mt-1 text-[17px] font-semibold text-[#34c759]">
                {formatYen(totals.incomeYen)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
              <p className="text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Expense</p>
              <p className="mt-1 text-[17px] font-semibold text-[#ff3b30]">
                {formatYen(totals.expenseYen)}
              </p>
            </div>
          </div>
        </section>

        <RecentTransactions
          entries={recent}
          members={members}
          categoryNameById={categoriesById}
          pocketNameById={pocketsById}
          currentUserId={user?.id}
          onEditEntry={(entry) => {
            if (entry.memberId === user?.id) {
              openEditEntry(entry);
            }
          }}
          loading={loading}
        />
      </main>
    </>
  );
}
