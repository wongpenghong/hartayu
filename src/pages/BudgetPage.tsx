import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  updateCategoryLimit,
  categoryBudgetGroup,
  type Category,
} from "@/household/categories";
import {
  BUDGET_GROUP_ORDER,
  budgetGroupLabel,
  type BudgetGroup,
} from "@/household/budget-groups";
import { formatBudgetSectionTitle } from "@/household/budget-display";
import { fetchEntries } from "@/household/entries";
import { BudgetCategoryRow } from "@/components/BudgetCategoryRow";
import { BudgetSummaryCard } from "@/components/BudgetSummaryCard";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import {
  EmptyState,
  ErrorNote,
  Field,
  GroupCard,
  PageBackLink,
  PrimaryAction,
  SheetOverlay,
  YenAmountField,
} from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";
import { budgetPace, expenseTotalsByCategory } from "@/ledger/ledger";
import {
  currentMonthInTokyo,
  formatYenDigits,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";

type BudgetRow = {
  category: Category;
  spentYen: number;
};

type BudgetSection = {
  key: BudgetGroup | "other";
  title: string;
  spentYen: number;
  limitYen: number;
  rows: BudgetRow[];
};

const BUDGET_PAGE_CACHE = "budget-page";

type BudgetPageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  categories: Category[];
};

export default function BudgetPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<BudgetPageCache>(BUDGET_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!hasPageCache(BUDGET_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [showUnset, setShowUnset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);
  const today = useMemo(() => todayInTokyo(), []);

  const rows = useMemo((): BudgetRow[] => {
    const spentByCategory = new Map(
      expenseTotalsByCategory(entries, month.year, month.month).map((row) => [
        row.id,
        row.totalYen,
      ]),
    );

    return categories
      .filter((category) => category.kind === "expense")
      .map((category) => ({
        category,
        spentYen: spentByCategory.get(category.id) ?? 0,
      }))
      .filter((row) => row.category.monthly_limit_yen != null)
      .sort((left, right) => right.spentYen - left.spentYen);
  }, [categories, entries, month.month, month.year]);

  const sections = useMemo((): BudgetSection[] => {
    const grouped = new Map<BudgetGroup | "other", BudgetRow[]>();

    for (const row of rows) {
      const group = categoryBudgetGroup(row.category) ?? "other";
      const bucket = grouped.get(group) ?? [];
      bucket.push(row);
      grouped.set(group, bucket);
    }

    const nextSections: BudgetSection[] = [];

    for (const group of BUDGET_GROUP_ORDER) {
      const groupRows = grouped.get(group);
      if (groupRows?.length) {
        nextSections.push({
          key: group,
          title: budgetGroupLabel(group),
          spentYen: groupRows.reduce((total, row) => total + row.spentYen, 0),
          limitYen: groupRows.reduce(
            (total, row) => total + (row.category.monthly_limit_yen ?? 0),
            0,
          ),
          rows: groupRows,
        });
      }
    }

    const otherRows = grouped.get("other");
    if (otherRows?.length) {
      nextSections.push({
        key: "other",
        title: budgetGroupLabel(null),
        spentYen: otherRows.reduce((total, row) => total + row.spentYen, 0),
        limitYen: otherRows.reduce(
          (total, row) => total + (row.category.monthly_limit_yen ?? 0),
          0,
        ),
        rows: otherRows,
      });
    }

    return nextSections;
  }, [rows]);

  const householdTotals = useMemo(() => {
    const limitYen = rows.reduce(
      (total, row) => total + (row.category.monthly_limit_yen ?? 0),
      0,
    );
    const spentYen = rows.reduce((total, row) => total + row.spentYen, 0);

    return { limitYen, spentYen };
  }, [rows]);

  const householdPace = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    return budgetPace(
      householdTotals.spentYen,
      householdTotals.limitYen,
      month.year,
      month.month,
      today,
    );
  }, [householdTotals, month.month, month.year, rows.length, today]);

  const unsetCategories = categories.filter(
    (category) => category.kind === "expense" && category.monthly_limit_yen == null,
  );

  const loadBudget = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [nextEntries, nextCategories] = await Promise.all([
        fetchEntries(),
        fetchCategories(),
      ]);
      setEntries(nextEntries);
      setCategories(nextCategories);
      setPageCache(BUDGET_PAGE_CACHE, {
        entries: nextEntries,
        categories: nextCategories,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load budget",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBudget({ background: hasPageCache(BUDGET_PAGE_CACHE) });
  }, [loadBudget]);

  useEffect(
    () => registerEntryChangeListener(() => void loadBudget({ background: true })),
    [loadBudget, registerEntryChangeListener],
  );

  useRefreshOnFocus(loadBudget);

  function openEditor(category: Category) {
    setEditing(category);
    setBudgetInput(
      category.monthly_limit_yen != null
        ? formatYenDigits(category.monthly_limit_yen)
        : "",
    );
    setSaveError(null);
  }

  function closeEditor() {
    setEditing(null);
    setSaveError(null);
  }

  async function handleSave() {
    if (!editing) {
      return;
    }

    const parsed = budgetInput.trim() ? parseYenInput(budgetInput) : null;
    if (budgetInput.trim() && parsed == null) {
      setSaveError("Enter a valid yen amount.");
      return;
    }

    setBusy(true);
    setSaveError(null);
    try {
      const updated = await updateCategoryLimit(editing.id, parsed);
      setCategories((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      closeEditor();
    } catch (caught) {
      setSaveError(
        caught instanceof Error ? caught.message : "Failed to save budget",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Budget
        </h1>
        <p className="mt-1 text-[15px] text-neutral-500">{month.label}</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        {loading ? (
          <GroupCard title="This month">
            <EmptyState message="Loading budget…" />
          </GroupCard>
        ) : rows.length === 0 ? (
          <GroupCard title="This month">
            <EmptyState message="No budgets set yet. Add one below." />
          </GroupCard>
        ) : householdPace ? (
          <BudgetSummaryCard
            spentYen={householdTotals.spentYen}
            limitYen={householdTotals.limitYen}
            pace={householdPace}
          />
        ) : null}

        {!loading && rows.length > 0
          ? sections.map((section) => (
              <GroupCard
                key={section.key}
                title={formatBudgetSectionTitle(
                  section.title,
                  section.spentYen,
                  section.limitYen,
                )}
              >
                {section.rows.map(({ category, spentYen }) => (
                  <BudgetCategoryRow
                    key={category.id}
                    category={category}
                    spentYen={spentYen}
                    onEdit={openEditor}
                  />
                ))}
              </GroupCard>
            ))
          : null}

        {unsetCategories.length > 0 ? (
          <GroupCard>
            <button
              type="button"
              onClick={() => setShowUnset((current) => !current)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-neutral-50 dark:active:bg-neutral-800"
            >
              <span className="text-[17px] font-medium">
                {unsetCategories.length} categor
                {unsetCategories.length === 1 ? "y" : "ies"} without budget
              </span>
              <span className="text-[15px] font-medium text-[#007aff]">
                {showUnset ? "Hide" : "Show"}
              </span>
            </button>
            {showUnset
              ? unsetCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => openEditor(category)}
                    className="flex w-full items-center justify-between border-t border-[#ececee] px-4 py-3.5 text-left active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
                  >
                    <span className="text-[17px] font-medium">{category.name}</span>
                    <span className="text-[15px] font-medium text-[#007aff]">
                      Set budget
                    </span>
                  </button>
                ))
              : null}
          </GroupCard>
        ) : null}
      </main>

      <SheetOverlay
        open={editing != null}
        onClose={closeEditor}
        title={editing ? `${editing.name} budget` : "Budget"}
      >
        <Field label="Monthly budget (yen)">
          <YenAmountField value={budgetInput} onChange={setBudgetInput} />
        </Field>
        <p className="text-[14px] text-neutral-500">
          Leave blank to remove the budget.
        </p>
        {saveError ? <ErrorNote message={saveError} /> : null}
        <PrimaryAction disabled={busy} onClick={() => void handleSave()}>
          {busy ? "Saving…" : "Save"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}
