import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import {
  EntrySheet,
  formatEntryDate,
  memberNameForEntry,
} from "@/components/EntrySheet";
import { fetchCategories, type Category } from "@/household/categories";
import { fetchEntries } from "@/household/entries";
import { fetchHouseholdMembers, type HouseholdMember } from "@/household/members";
import { fetchPockets, type Pocket as StoredPocket } from "@/household/pockets";
import {
  balancesByPocket,
  householdBalance,
  monthlyTotals,
} from "@/ledger/ledger";
import type { Entry, Pocket } from "@/ledger/types";
import {
  BottomTabBar,
  CategoryIcon,
  EmptyState,
  ErrorNote,
  GroupCard,
  ListRow,
  MemberChip,
  NativeScaffold,
  PocketIcon,
} from "@/components/NativeUI";
import { currentMonthInTokyo, formatYen } from "@/lib/format-yen";

function toLedgerPockets(pockets: StoredPocket[]): Pocket[] {
  return pockets
    .filter((pocket) => !pocket.archived_at)
    .map((pocket) => ({
      id: pocket.id,
      archivedAt: pocket.archived_at,
    }));
}

function netTone(netYen: number): string {
  if (netYen > 0) {
    return "text-[#34c759]";
  }
  if (netYen < 0) {
    return "text-[#ff3b30]";
  }
  return "text-neutral-900";
}

function entryAmountTone(kind: Entry["kind"]): string {
  return kind === "income" ? "text-[#34c759]" : "text-[#ff3b30]";
}

export default function HomePage() {
  const { username, user, household, authError, signOut } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [storedPockets, setStoredPockets] = useState<StoredPocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entrySheetOpen, setEntrySheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const ledgerPockets = useMemo(
    () => toLedgerPockets(storedPockets),
    [storedPockets],
  );

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name])),
    [categories],
  );

  const pocketNameById = useMemo(
    () => new Map(storedPockets.map((pocket) => [pocket.id, pocket.name])),
    [storedPockets],
  );

  const totals = useMemo(
    () => monthlyTotals(entries, month.year, month.month),
    [entries, month.month, month.year],
  );

  const pocketBalances = useMemo(() => {
    const balances = balancesByPocket(entries, ledgerPockets);
    const nameById = new Map(
      storedPockets.map((pocket) => [pocket.id, pocket.name]),
    );
    return balances.map((balance) => ({
      ...balance,
      name: nameById.get(balance.pocketId) ?? "Pocket",
    }));
  }, [entries, ledgerPockets, storedPockets]);

  const allTimeHouseholdBalance = useMemo(
    () => householdBalance(entries, ledgerPockets),
    [entries, ledgerPockets],
  );

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
      setStoredPockets(nextPockets);
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

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void loadDashboard();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadDashboard]);

  function openAddEntry() {
    setEditingEntry(null);
    setEntrySheetOpen(true);
  }

  function openEditEntry(entry: Entry) {
    if (entry.memberId !== user?.id) {
      return;
    }
    setEditingEntry(entry);
    setEntrySheetOpen(true);
  }

  function closeEntrySheet() {
    setEntrySheetOpen(false);
    setEditingEntry(null);
  }

  function handleEntrySaved() {
    void loadDashboard();
  }

  function handleEntryDeleted() {
    void loadDashboard();
  }

  const activePockets = storedPockets.filter((pocket) => !pocket.archived_at);

  return (
    <NativeScaffold>
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

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
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

        <GroupCard
          title="Pockets"
          footer={`All-time household balance across active pockets: ${formatYen(allTimeHouseholdBalance)}`}
        >
          {loading ? (
            <EmptyState message="Loading pockets…" />
          ) : activePockets.length === 0 ? (
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

        <GroupCard title="Recent">
          {loading ? (
            <EmptyState message="Loading entries…" />
          ) : entries.length === 0 ? (
            <EmptyState message="No entries yet. Tap + to log one." />
          ) : (
            entries.map((entry) => {
              const categoryName =
                categoryNameById.get(entry.categoryId) ?? "Category";
              const pocketName =
                pocketNameById.get(entry.pocketId) ?? "Pocket";
              const canEdit = entry.memberId === user?.id;

              return (
                <ListRow
                  key={entry.id}
                  onClick={canEdit ? () => openEditEntry(entry) : undefined}
                >
                  <CategoryIcon kind={entry.kind} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">
                      {categoryName}
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-neutral-500">
                      {pocketName}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-400">
                      <span>{formatEntryDate(entry.entryDate)}</span>
                      <MemberChip
                        label={memberNameForEntry(members, entry.memberId)}
                      />
                    </span>
                  </span>
                  <span
                    className={`text-[17px] font-semibold tabular-nums ${entryAmountTone(entry.kind)}`}
                  >
                    {formatYen(
                      entry.kind === "expense"
                        ? -entry.amountYen
                        : entry.amountYen,
                    )}
                  </span>
                  {canEdit ? (
                    <span className="text-[20px] text-neutral-300">›</span>
                  ) : null}
                </ListRow>
              );
            })
          )}
        </GroupCard>
      </main>

      {household && user ? (
        <EntrySheet
          open={entrySheetOpen}
          onClose={closeEntrySheet}
          onSaved={handleEntrySaved}
          onDeleted={handleEntryDeleted}
          householdId={household.id}
          userId={user.id}
          entry={editingEntry}
          pockets={storedPockets}
          categories={categories}
        />
      ) : null}

      <BottomTabBar onAddEntry={openAddEntry} />
    </NativeScaffold>
  );
}
