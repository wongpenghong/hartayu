import { useCallback, useEffect, useMemo, useState } from "react";
import { FAMILY_ATTRIBUTION_ID } from "@/household/attribution";
import { categoryNameById } from "@/household/category-utils";
import { breakdownColor } from "@/household/breakdown-colors";
import { fetchCategories } from "@/household/categories";
import { fetchEntries } from "@/household/entries";
import { fetchHouseholdMembers } from "@/household/members";
import { memberName } from "@/household/member-utils";
import { fetchPockets } from "@/household/pockets";
import { pocketNameById } from "@/household/pocket-utils";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { DonutChart, type DonutSegment } from "@/components/DonutChart";
import { EmptyState, ErrorNote, PageBackLink, PillTabs } from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import {
  expenseTotalsByCategory,
  expenseTotalsByMember,
  expenseTotalsByPocket,
  expenseTotalsByRecentMonths,
  incomeTotalsByCategory,
  incomeTotalsByMember,
  incomeTotalsByPocket,
  incomeTotalsByRecentMonths,
} from "@/ledger/ledger";
import type { EntryKind } from "@/ledger/types";
import { currentMonthInTokyo, formatMonthLabel } from "@/lib/format-yen";

type BreakdownDimension = "category" | "pocket" | "user" | "month";

export default function AnalysisPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [categories, setCategories] = useState<
    Awaited<ReturnType<typeof fetchCategories>>
  >([]);
  const [pockets, setPockets] = useState<Awaited<ReturnType<typeof fetchPockets>>>([]);
  const [members, setMembers] = useState<
    Awaited<ReturnType<typeof fetchHouseholdMembers>>
  >([]);
  const [kindFilter, setKindFilter] = useState<EntryKind>("expense");
  const [dimension, setDimension] = useState<BreakdownDimension>("category");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const pocketsById = useMemo(() => pocketNameById(pockets), [pockets]);

  const segments = useMemo((): DonutSegment[] => {
    const totalsByCategory =
      kindFilter === "expense" ? expenseTotalsByCategory : incomeTotalsByCategory;
    const totalsByPocket =
      kindFilter === "expense" ? expenseTotalsByPocket : incomeTotalsByPocket;
    const totalsByMember =
      kindFilter === "expense" ? expenseTotalsByMember : incomeTotalsByMember;
    const totalsByRecentMonths =
      kindFilter === "expense"
        ? expenseTotalsByRecentMonths
        : incomeTotalsByRecentMonths;

    if (dimension === "category") {
      return totalsByCategory(entries, month.year, month.month).map(
        (row, index) => ({
          id: row.id,
          label: categoriesById.get(row.id) ?? "Category",
          value: row.totalYen,
          color: breakdownColor(index),
        }),
      );
    }

    if (dimension === "pocket") {
      return totalsByPocket(entries, month.year, month.month).map(
        (row, index) => ({
          id: row.id,
          label: pocketsById.get(row.id) ?? "Pocket",
          value: row.totalYen,
          color: breakdownColor(index),
        }),
      );
    }

    if (dimension === "user") {
      return totalsByMember(entries, month.year, month.month).map(
        (row, index) => ({
          id: row.id,
          label:
            row.id === FAMILY_ATTRIBUTION_ID
              ? "Family"
              : memberName(members, row.id),
          value: row.totalYen,
          color: breakdownColor(index),
        }),
      );
    }

    return totalsByRecentMonths(entries, month.year, month.month)
      .filter((row) => row.totalYen > 0)
      .map((row, index) => ({
        id: row.id,
        label: formatMonthLabel(row.year, row.month),
        value: row.totalYen,
        color: breakdownColor(index),
      }));
  }, [
    categoriesById,
    dimension,
    entries,
    kindFilter,
    members,
    month.month,
    month.year,
    pocketsById,
  ]);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextEntries, nextCategories, nextPockets, nextMembers] =
        await Promise.all([
          fetchEntries(),
          fetchCategories(),
          fetchPockets(),
          fetchHouseholdMembers(),
        ]);
      setEntries(nextEntries);
      setCategories(nextCategories);
      setPockets(nextPockets);
      setMembers(nextMembers);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load analysis",
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
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Analysis
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

        <PillTabs
          value={dimension}
          onChange={setDimension}
          options={[
            { value: "category", label: "Category" },
            { value: "pocket", label: "Pocket" },
            { value: "user", label: "User" },
            { value: "month", label: "Month" },
          ]}
        />

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="mb-4 text-[17px] font-semibold">
            {kindFilter === "expense" ? "Expense breakdown" : "Income breakdown"}
          </p>
          {loading ? (
            <EmptyState message="Loading analysis…" />
          ) : (
            <DonutChart
              segments={segments}
              centerLabel={
                kindFilter === "expense" ? "Total spent" : "Total earned"
              }
            />
          )}
        </section>
      </main>
    </>
  );
}
