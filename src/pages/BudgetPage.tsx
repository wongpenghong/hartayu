import { useCallback, useEffect, useMemo, useState } from "react";
import { formatRemainingBudget } from "@/household/entry-display";
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
import { fetchEntries } from "@/household/entries";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import {
  EmptyState,
  ErrorNote,
  Field,
  GroupCard,
  LimitProgressBar,
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
  formatYen,
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
  rows: BudgetRow[];
};

const BUDGET_PAGE_CACHE = "budget-page";

type BudgetPageCache = {
  entries: Awaited<ReturnType<typeof fetchEntries>>;
  categories: Category[];
};

function BudgetCategoryRow({
  category,
  spentYen,
  month,
  today,
  onEdit,
}: {
  category: Category;
  spentYen: number;
  month: ReturnType<typeof currentMonthInTokyo>;
  today: string;
  onEdit: (category: Category) => void;
}) {
  const budgetYen = category.monthly_limit_yen ?? 0;
  const remainingYen = budgetYen - spentYen;
  const over = remainingYen < 0;
  const pace = budgetPace(spentYen, budgetYen, month.year, month.month, today);

  return (
    <button
      type="button"
      onClick={() => onEdit(category)}
      className="w-full border-b border-[#ececee] px-4 py-4 text-left last:border-b-0 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[17px] font-medium">{category.name}</span>
        <span
          className={`text-[15px] font-semibold tabular-nums ${
            over ? "text-[#ff3b30]" : "text-neutral-700 dark:text-neutral-300"
          }`}
        >
          {formatYen(spentYen)} spent · {formatRemainingBudget(remainingYen)}
        </span>
      </div>
      <div className="mt-3">
        <LimitProgressBar spentYen={spentYen} limitYen={budgetYen} />
      </div>
      <p className="mt-2 text-[13px] text-neutral-500">
        {pace.daysLeft} days left · projecting {formatYen(pace.projectedSpendYen)} ·{" "}
        {formatYen(pace.dailyAllowanceYen)}/day available
      </p>
    </button>
  );
}

export default function BudgetPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const cached = getPageCache<BudgetPageCache>(BUDGET_PAGE_CACHE);
  const [entries, setEntries] = useState(cached?.entries ?? []);
  const [categories, setCategories] = useState<Category[]>(cached?.categories ?? []);
  const [loading, setLoading] = useState(!hasPageCache(BUDGET_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [budgetInput, setBudgetInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);

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
          rows: groupRows,
        });
      }
    }

    const otherRows = grouped.get("other");
    if (otherRows?.length) {
      nextSections.push({
        key: "other",
        title: budgetGroupLabel(null),
        rows: otherRows,
      });
    }

    return nextSections;
  }, [rows]);

  const today = useMemo(() => todayInTokyo(), []);

  const householdPace = useMemo(() => {
    if (rows.length === 0) {
      return null;
    }

    const limitYen = rows.reduce(
      (total, row) => total + (row.category.monthly_limit_yen ?? 0),
      0,
    );
    const spentYen = rows.reduce((total, row) => total + row.spentYen, 0);

    return budgetPace(spentYen, limitYen, month.year, month.month, today);
  }, [month.month, month.year, rows, today]);

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

  const unsetCategories = categories.filter(
    (category) => category.kind === "expense" && category.monthly_limit_yen == null,
  );

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

        {householdPace ? (
          <GroupCard title="Household pace">
            <div className="px-4 py-4 text-[15px] text-neutral-600 dark:text-neutral-300">
              <p>
                {householdPace.daysLeft} days left · projecting{" "}
                {formatYen(householdPace.projectedSpendYen)} ·{" "}
                {formatYen(householdPace.dailyAllowanceYen)}/day available
              </p>
            </div>
          </GroupCard>
        ) : null}

        {loading ? (
          <GroupCard title="This month">
            <EmptyState message="Loading budget…" />
          </GroupCard>
        ) : rows.length === 0 ? (
          <GroupCard title="This month">
            <EmptyState message="No budgets set yet. Add one below." />
          </GroupCard>
        ) : (
          sections.map((section) => (
            <GroupCard key={section.key} title={section.title}>
              {section.rows.map(({ category, spentYen }) => (
                <BudgetCategoryRow
                  key={category.id}
                  category={category}
                  spentYen={spentYen}
                  month={month}
                  today={today}
                  onEdit={openEditor}
                />
              ))}
            </GroupCard>
          ))
        )}

        {unsetCategories.length > 0 ? (
          <GroupCard title="Add budget">
            {unsetCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => openEditor(category)}
                className="flex w-full items-center justify-between border-b border-[#ececee] px-4 py-3.5 text-left last:border-b-0 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
              >
                <span className="text-[17px] font-medium">{category.name}</span>
                <span className="text-[15px] font-medium text-[#007aff]">Set budget</span>
              </button>
            ))}
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
