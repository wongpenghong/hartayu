import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import {
  fetchCategories,
  updateCategoryLimit,
  type Category,
} from "@/household/categories";
import {
  BUDGET_GROUP_ORDER,
  budgetGroupLabel,
  type BudgetGroup,
} from "@/household/budget-groups";
import {
  buildBudgetSections,
  categoryLimitOverAllocationWarning,
  fetchBudgetGroupLimits,
  updateBudgetGroupLimit,
  type BudgetGroupLimits,
} from "@/household/budget-group-limits";
import { budgetTotalsFromRows } from "@/household/budget-display";
import { fetchEntries } from "@/household/entries";
import { BudgetCategoryRow } from "@/components/BudgetCategoryRow";
import {
  BudgetGroupHeader,
} from "@/components/BudgetGroupHeader";
import { BudgetSection } from "@/components/BudgetSection";
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
import { currentBudgetCycleInTokyo } from "@/lib/budget-cycle";
import {
  formatYenDigits,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";

type EditorMode =
  | { kind: "closed" }
  | { kind: "category"; category: Category }
  | { kind: "group"; group: BudgetGroup };

const BUDGET_PAGE_CACHE = "budget-page";

type BudgetPageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  categories: Category[];
  groupLimits: BudgetGroupLimits;
};

const emptyGroupLimits = (): BudgetGroupLimits => ({
  needs: null,
  wants: null,
  savings: null,
});

export default function BudgetPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<BudgetPageCache>(BUDGET_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [groupLimits, setGroupLimits] = useState<BudgetGroupLimits>(
    cached?.groupLimits ?? emptyGroupLimits(),
  );
  const [loading, setLoading] = useState(!hasPageCache(BUDGET_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorMode>({ kind: "closed" });
  const [budgetInput, setBudgetInput] = useState("");
  const [showUnset, setShowUnset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { household } = useAuth();
  const month = useMemo(
    () => currentBudgetCycleInTokyo(),
    [household?.budgetCycleEndDay, household?.budgetCycleStartDay],
  );
  const today = useMemo(() => todayInTokyo(), []);

  const rows = useMemo(() => {
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

  const sections = useMemo(
    () => buildBudgetSections(rows, groupLimits),
    [groupLimits, rows],
  );

  const householdTotals = useMemo(
    () =>
      budgetTotalsFromRows(
        sections.map((section) => ({
          spentYen: section.spentYen,
          limitYen: section.limitYen,
        })),
      ),
    [sections],
  );

  const hasBudgetSetup =
    rows.length > 0 ||
    BUDGET_GROUP_ORDER.some((group) => groupLimits[group] != null);

  const householdPace = useMemo(() => {
    if (!hasBudgetSetup || householdTotals.limitYen <= 0) {
      return null;
    }

    return budgetPace(
      householdTotals.spentYen,
      householdTotals.limitYen,
      month.year,
      month.month,
      today,
    );
  }, [
    hasBudgetSetup,
    householdTotals.limitYen,
    householdTotals.spentYen,
    month.month,
    month.year,
    today,
  ]);

  const unsetCategories = categories.filter(
    (category) => category.kind === "expense" && category.monthly_limit_yen == null,
  );

  const allocationWarning = useMemo(() => {
    if (editor.kind !== "category") {
      return null;
    }

    const parsed = budgetInput.trim() ? parseYenInput(budgetInput) : null;
    if (budgetInput.trim() && parsed == null) {
      return null;
    }

    return categoryLimitOverAllocationWarning(
      editor.category,
      parsed,
      categories,
      groupLimits,
    );
  }, [budgetInput, categories, editor, groupLimits]);

  const loadBudget = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [nextEntries, nextCategories, nextGroupLimits] = await Promise.all([
        fetchEntries(),
        fetchCategories(),
        fetchBudgetGroupLimits(),
      ]);
      setEntries(nextEntries);
      setCategories(nextCategories);
      setGroupLimits(nextGroupLimits);
      setPageCache(BUDGET_PAGE_CACHE, {
        entries: nextEntries,
        categories: nextCategories,
        groupLimits: nextGroupLimits,
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

  function openCategoryEditor(category: Category) {
    setEditor({ kind: "category", category });
    setBudgetInput(
      category.monthly_limit_yen != null
        ? formatYenDigits(category.monthly_limit_yen)
        : "",
    );
    setSaveError(null);
  }

  function openGroupEditor(group: BudgetGroup) {
    setEditor({ kind: "group", group });
    setBudgetInput(
      groupLimits[group] != null ? formatYenDigits(groupLimits[group]!) : "",
    );
    setSaveError(null);
  }

  function closeEditor() {
    setEditor({ kind: "closed" });
    setSaveError(null);
  }

  async function handleSave() {
    if (editor.kind === "closed") {
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
      if (editor.kind === "category") {
        const updated = await updateCategoryLimit(editor.category.id, parsed);
        setCategories((current) =>
          current.map((row) => (row.id === updated.id ? updated : row)),
        );
      } else {
        const updated = await updateBudgetGroupLimit(editor.group, parsed);
        setGroupLimits(updated);
      }
      closeEditor();
    } catch (caught) {
      setSaveError(
        caught instanceof Error ? caught.message : "Failed to save budget",
      );
    } finally {
      setBusy(false);
    }
  }

  const editorTitle =
    editor.kind === "category"
      ? `${editor.category.name} budget`
      : editor.kind === "group"
        ? `${budgetGroupLabel(editor.group)} cap`
        : "Budget";

  const editorHint =
    editor.kind === "group"
      ? "Set the monthly envelope for this group. Leave blank to use the sum of category budgets."
      : "Leave blank to remove the budget.";

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Budget
        </h1>
        <p className="mt-1 text-[15px] text-neutral-500">{month.label}</p>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}

        {loading ? (
          <GroupCard title="This cycle">
            <EmptyState message="Loading budget…" />
          </GroupCard>
        ) : !hasBudgetSetup ? (
          <GroupCard title="This cycle">
            <EmptyState message="No budgets set yet. Add one below." />
          </GroupCard>
        ) : householdPace ? (
          <BudgetSummaryCard
            spentYen={householdTotals.spentYen}
            limitYen={householdTotals.limitYen}
            pace={householdPace}
          />
        ) : null}

        {!loading && hasBudgetSetup
          ? sections.map((section) => (
              <BudgetSection
                key={section.key}
                group={section.key}
                title={section.title}
              >
                {section.showGroupCap ? (
                  <BudgetGroupHeader
                    group={section.key as BudgetGroup}
                    spentYen={section.spentYen}
                    limitYen={section.limitYen}
                    overAllocationYen={section.overAllocationYen}
                    onEdit={() => openGroupEditor(section.key as BudgetGroup)}
                  />
                ) : null}
                {section.rows.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    {section.rows.map(({ category, spentYen }) => (
                      <BudgetCategoryRow
                        key={category.id}
                        category={category}
                        spentYen={spentYen}
                        group={section.key}
                        onEdit={openCategoryEditor}
                      />
                    ))}
                  </div>
                ) : null}
              </BudgetSection>
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
                    onClick={() => openCategoryEditor(category)}
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
        open={editor.kind !== "closed"}
        onClose={closeEditor}
        title={editorTitle}
      >
        <Field
          label={
            editor.kind === "group" ? "Monthly cap (yen)" : "Monthly budget (yen)"
          }
        >
          <YenAmountField value={budgetInput} onChange={setBudgetInput} />
        </Field>
        <p className="text-[14px] text-neutral-500">{editorHint}</p>
        {allocationWarning ? (
          <p className="text-[14px] font-medium text-[#ff9500]">
            {allocationWarning}
          </p>
        ) : null}
        {saveError ? <ErrorNote message={saveError} /> : null}
        <PrimaryAction disabled={busy} onClick={() => void handleSave()}>
          {busy ? "Saving…" : "Save"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}
