import { useCallback, useEffect, useMemo, useState } from "react";
import { FAMILY_ATTRIBUTION_ID } from "@/household/attribution";
import {
  analysisQuickSummary,
  formatSavingsRatio,
  incomeExpenseChartPoints,
  monthPickerOptions,
} from "@/household/analysis-display";
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
import { IncomeExpenseChart } from "@/components/IncomeExpenseChart";
import {
  EmptyState,
  ErrorNote,
  Field,
  PageBackLink,
  PillTabs,
  SelectField,
} from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";
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
import {
  currentMonthInTokyo,
  formatMonthLabel,
  formatYen,
  todayInTokyo,
} from "@/lib/format-yen";

type BreakdownDimension = "category" | "pocket" | "user" | "month";

const ANALYSIS_PAGE_CACHE = "analysis-page";

type AnalysisPageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  categories: Awaited<ReturnType<typeof fetchCategories>>;
  pockets: Awaited<ReturnType<typeof fetchPockets>>;
  members: Awaited<ReturnType<typeof fetchHouseholdMembers>>;
};

export default function AnalysisPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<AnalysisPageCache>(ANALYSIS_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [categories, setCategories] = useState(cached?.categories ?? []);
  const [pockets, setPockets] = useState(cached?.pockets ?? []);
  const [members, setMembers] = useState(cached?.members ?? []);
  const [kindFilter, setKindFilter] = useState<EntryKind>("expense");
  const [dimension, setDimension] = useState<BreakdownDimension>("category");
  const [loading, setLoading] = useState(!hasPageCache(ANALYSIS_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);

  const currentMonth = useMemo(() => currentMonthInTokyo(), []);
  const [selectedMonthValue, setSelectedMonthValue] = useState(
    `${currentMonth.year}-${String(currentMonth.month).padStart(2, "0")}`,
  );
  const selectedMonth = useMemo(() => {
    const [year, month] = selectedMonthValue.split("-").map(Number);
    return { year, month, label: formatMonthLabel(year, month) };
  }, [selectedMonthValue]);
  const monthOptions = useMemo(
    () => monthPickerOptions(currentMonth.year, currentMonth.month),
    [currentMonth.month, currentMonth.year],
  );
  const categoriesById = useMemo(
    () => categoryNameById(categories),
    [categories],
  );
  const pocketsById = useMemo(() => pocketNameById(pockets), [pockets]);
  const chartPoints = useMemo(
    () =>
      incomeExpenseChartPoints(
        entries,
        currentMonth.year,
        currentMonth.month,
      ),
    [currentMonth.month, currentMonth.year, entries],
  );
  const quickSummary = useMemo(
    () =>
      analysisQuickSummary(
        entries,
        selectedMonth.year,
        selectedMonth.month,
        todayInTokyo(),
      ),
    [entries, selectedMonth.month, selectedMonth.year],
  );

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
      return totalsByCategory(
        entries,
        selectedMonth.year,
        selectedMonth.month,
      ).map((row, index) => ({
        id: row.id,
        label: categoriesById.get(row.id) ?? "Category",
        value: row.totalYen,
        color: breakdownColor(index),
      }));
    }

    if (dimension === "pocket") {
      return totalsByPocket(entries, selectedMonth.year, selectedMonth.month).map(
        (row, index) => ({
          id: row.id,
          label: pocketsById.get(row.id) ?? "Pocket",
          value: row.totalYen,
          color: breakdownColor(index),
        }),
      );
    }

    if (dimension === "user") {
      return totalsByMember(entries, selectedMonth.year, selectedMonth.month).map(
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

    return totalsByRecentMonths(
      entries,
      selectedMonth.year,
      selectedMonth.month,
    )
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
    pocketsById,
    selectedMonth.month,
    selectedMonth.year,
  ]);

  const loadSummary = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
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
      setPageCache(ANALYSIS_PAGE_CACHE, {
        entries: nextEntries,
        categories: nextCategories,
        pockets: nextPockets,
        members: nextMembers,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load analysis",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary({ background: hasPageCache(ANALYSIS_PAGE_CACHE) });
  }, [loadSummary]);

  useEffect(
    () => registerEntryChangeListener(() => void loadSummary({ background: true })),
    [loadSummary, registerEntryChangeListener],
  );

  useRefreshOnFocus(loadSummary);

  const topCategoryName = quickSummary.topExpenseCategoryId
    ? categoriesById.get(quickSummary.topExpenseCategoryId) ?? "Category"
    : "—";

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Analysis
        </h1>
        <div className="mt-3">
          <Field label="Month">
            <SelectField
              value={selectedMonthValue}
              onChange={setSelectedMonthValue}
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="mb-4 text-[17px] font-semibold">Income vs expense</p>
          <p className="mb-4 text-[13px] text-neutral-500">Last 6 months</p>
          {loading ? (
            <EmptyState message="Loading analysis…" />
          ) : (
            <IncomeExpenseChart points={chartPoints} />
          )}
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          <p className="mb-4 text-[17px] font-semibold">Quick summary</p>
          <p className="mb-4 text-[13px] text-neutral-500">{selectedMonth.label}</p>
          {loading ? (
            <EmptyState message="Loading summary…" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
                <p className="text-[12px] font-medium text-neutral-500">Avg daily spend</p>
                <p className="mt-1 text-[17px] font-semibold tabular-nums">
                  {formatYen(quickSummary.avgDailySpendYen)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
                <p className="text-[12px] font-medium text-neutral-500">Top category</p>
                <p className="mt-1 truncate text-[17px] font-semibold">{topCategoryName}</p>
                <p className="mt-0.5 text-[13px] tabular-nums text-neutral-500">
                  {formatYen(quickSummary.topExpenseCategoryYen)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
                <p className="text-[12px] font-medium text-neutral-500">Savings</p>
                <p
                  className={`mt-1 text-[17px] font-semibold tabular-nums ${
                    quickSummary.savingsYen >= 0
                      ? "text-[#34c759]"
                      : "text-[#ff3b30]"
                  }`}
                >
                  {formatYen(quickSummary.savingsYen)}
                </p>
              </div>
              <div className="rounded-2xl bg-[#f2f2f7] px-3 py-3 dark:bg-neutral-800">
                <p className="text-[12px] font-medium text-neutral-500">Savings ratio</p>
                <p className="mt-1 text-[17px] font-semibold tabular-nums">
                  {formatSavingsRatio(quickSummary.savingsRatio)}
                </p>
              </div>
            </div>
          )}
        </section>

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
