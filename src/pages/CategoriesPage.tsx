import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { categoryNameById } from "@/household/category-utils";
import { fetchCategories } from "@/household/categories";
import { fetchEntries } from "@/household/entries";
import { entryAmountTone } from "@/household/entry-display";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import {
  CategoryIcon,
  EmptyState,
  ErrorNote,
  GroupCard,
  ListRow,
  PillTabs,
} from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { monthlyTotalsByCategory } from "@/ledger/ledger";
import type { EntryKind } from "@/ledger/types";
import { currentMonthInTokyo, formatYen } from "@/lib/format-yen";

export default function CategoriesPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof fetchCategories>>
  >([]);
  const [kindFilter, setKindFilter] = useState<EntryKind>("expense");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const totals = useMemo(
    () =>
      monthlyTotalsByCategory(entries, month.year, month.month).filter(
        (row) => row.kind === kindFilter,
      ),
    [entries, kindFilter, month.month, month.year],
  );
  const kindTotal = useMemo(
    () => totals.reduce((sum, row) => sum + row.totalYen, 0),
    [totals],
  );

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextEntries, nextCategories] = await Promise.all([
        fetchEntries(),
        fetchCategories(),
      ]);
      setEntries(nextEntries);
      setCategories(nextCategories);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load categories",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => registerEntryChangeListener(loadSummary), [
    loadSummary,
    registerEntryChangeListener,
  ]);

  useRefreshOnFocus(loadSummary);

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link
          to="/"
          className="inline-flex items-center text-[15px] font-medium text-[#007aff]"
        >
          ← Home
        </Link>
        <h1 className="mt-2 text-[34px] font-bold leading-tight tracking-tight">
          Categories
        </h1>
        <p className="mt-1 text-[15px] text-neutral-500">{month.label}</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        <PillTabs
          value={kindFilter}
          onChange={setKindFilter}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
          ]}
        />

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
          <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
            Total {kindFilter}
          </p>
          <p className={`mt-2 text-[34px] font-bold tracking-tight ${entryAmountTone(kindFilter)}`}>
            {formatYen(kindFilter === "expense" ? -kindTotal : kindTotal)}
          </p>
        </section>

        <GroupCard title={kindFilter === "expense" ? "Spending" : "Income"}>
          {loading ? (
            <EmptyState message="Loading categories…" />
          ) : totals.length === 0 ? (
            <EmptyState message={`No ${kindFilter} entries this month.`} />
          ) : (
            totals.map((row) => (
              <ListRow key={row.categoryId}>
                <CategoryIcon kind={row.kind} />
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
                  {categoriesById.get(row.categoryId) ?? "Category"}
                </span>
                <span
                  className={`text-[17px] font-semibold tabular-nums ${entryAmountTone(row.kind)}`}
                >
                  {formatYen(row.kind === "expense" ? -row.totalYen : row.totalYen)}
                </span>
              </ListRow>
            ))
          )}
        </GroupCard>
      </main>
    </>
  );
}
