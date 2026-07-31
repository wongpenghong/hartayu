import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { EntryFilterToolbar } from "@/components/EntryFilterToolbar";
import { EntryList } from "@/components/EntryList";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { canEditEntry } from "@/household/attribution";
import { categoryEmojiById, categoryNameById } from "@/household/category-utils";
import { defaultEntryFilter } from "@/household/entry-filter";
import { fetchEntries } from "@/household/entries";
import { fetchHouseholdMembers } from "@/household/members";
import { fetchPockets } from "@/household/pockets";
import { pocketNameById } from "@/household/pocket-utils";
import { fetchCategories } from "@/household/categories";
import { EmptyState, ErrorNote, GroupCard } from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";
import { filterEntries, groupEntriesByDay } from "@/ledger/ledger";
import type { EntryFilter } from "@/ledger/types";

const ENTRIES_PAGE_CACHE = "entries-page";

type EntriesPageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  members: Awaited<ReturnType<typeof fetchHouseholdMembers>>;
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  pockets: Awaited<ReturnType<typeof fetchPockets>>;
};

export default function EntriesPage() {
  const { user } = useAuth();
  const { openEditEntry, registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<EntriesPageCache>(ENTRIES_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [members, setMembers] = useState(cached?.members ?? []);
  const [categories, setCategories] = useState(cached?.categories ?? []);
  const [pockets, setPockets] = useState(cached?.pockets ?? []);
  const [filter, setFilter] = useState<EntryFilter>(() => defaultEntryFilter());
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(!hasPageCache(ENTRIES_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadEntries = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
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
      setPageCache(ENTRIES_PAGE_CACHE, {
        entries: nextEntries,
        members: nextMembers,
        categories: nextCategories,
        pockets: nextPockets,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load entries",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEntries({ background: hasPageCache(ENTRIES_PAGE_CACHE) });
  }, [loadEntries]);

  useEffect(
    () => registerEntryChangeListener(() => void loadEntries({ background: true })),
    [loadEntries, registerEntryChangeListener],
  );

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
  const dayGroups = useMemo(
    () => groupEntriesByDay(filteredEntries),
    [filteredEntries],
  );
  const allDaysCollapsed =
    dayGroups.length > 0 &&
    dayGroups.every((group) => collapsedDates.has(group.date));

  function toggleDay(date: string) {
    setCollapsedDates((current) => {
      const next = new Set(current);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  function toggleAllDays() {
    if (allDaysCollapsed) {
      setCollapsedDates(new Set());
      return;
    }

    setCollapsedDates(new Set(dayGroups.map((group) => group.date)));
  }

  function resetFilters() {
    setFilter(defaultEntryFilter());
    setCollapsedDates(new Set());
  }

  useEffect(() => {
    setCollapsedDates(new Set());
  }, [filter]);

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Transactions
        </h1>
        <p className="mt-1 text-[15px] text-neutral-500">
          Full history. Tap yours or family entries to edit.
        </p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        <EntryFilterToolbar
          pockets={pockets}
          categories={categories}
          members={members}
          userId={user!.id}
          filter={filter}
          onChange={setFilter}
          onReset={resetFilters}
        />

        {dayGroups.length > 0 ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={toggleAllDays}
              className="text-[13px] font-medium text-[#007aff]"
            >
              {allDaysCollapsed ? "Open all" : "Collapse all"}
            </button>
          </div>
        ) : null}

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
              collapsedDates={collapsedDates}
              onToggleDay={toggleDay}
              onEditEntry={(entry) => {
                if (canEditEntry(entry, user?.id)) {
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
