import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { EntryFilters } from "@/components/EntryFilters";
import { EntryList } from "@/components/EntryList";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { categoryEmojiById, categoryNameById } from "@/household/category-utils";
import { fetchEntries } from "@/household/entries";
import { fetchHouseholdMembers } from "@/household/members";
import { fetchPockets } from "@/household/pockets";
import { pocketNameById } from "@/household/pocket-utils";
import { fetchCategories } from "@/household/categories";
import { EmptyState, ErrorNote, GroupCard } from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { filterEntries } from "@/ledger/ledger";
import type { EntryFilter } from "@/ledger/types";

export default function EntriesPage() {
  const { user } = useAuth();
  const { openEditEntry, registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [members, setMembers] = useState<Awaited<ReturnType<typeof fetchHouseholdMembers>>>([]);
  const [categories, setCategories] = useState<Awaited<ReturnType<typeof fetchCategories>>>([]);
  const [pockets, setPockets] = useState<Awaited<ReturnType<typeof fetchPockets>>>([]);
  const [filter, setFilter] = useState<EntryFilter>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextEntries, nextMembers, nextCategories, nextPockets] =
        await Promise.all([
          fetchEntries(),
          fetchHouseholdMembers(),
          fetchCategories(),
          fetchPockets(),
        ]);
      setEntries(nextEntries);
      setMembers(nextMembers);
      setCategories(nextCategories);
      setPockets(nextPockets);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load entries",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => registerEntryChangeListener(loadEntries), [
    loadEntries,
    registerEntryChangeListener,
  ]);

  useRefreshOnFocus(loadEntries);

  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const categoryEmojisById = useMemo(
    () => categoryEmojiById(categories),
    [categories],
  );
  const pocketsById = useMemo(() => pocketNameById(pockets), [pockets]);
  const filteredEntries = useMemo(
    () => filterEntries(entries, filter),
    [entries, filter],
  );

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Transactions
        </h1>
        <p className="mt-1 text-[15px] text-neutral-500">
          Full history. Tap yours to edit.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        <EntryFilters
          pockets={pockets}
          categories={categories}
          filter={filter}
          onChange={setFilter}
        />

        <GroupCard>
          {loading ? (
            <EmptyState message="Loading entries…" />
          ) : filteredEntries.length === 0 ? (
            <EmptyState message="No entries match these filters." />
          ) : (
            <EntryList
              entries={filteredEntries}
              members={members}
              categoryNameById={categoriesById}
              categoryEmojiById={categoryEmojisById}
              pocketNameById={pocketsById}
              currentUserId={user?.id}
              groupByDay
              onEditEntry={(entry) => {
                if (entry.memberId === user?.id) {
                  openEditEntry(entry);
                }
              }}
            />
          )}
        </GroupCard>
      </main>
    </>
  );
}
