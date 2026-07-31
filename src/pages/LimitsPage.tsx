import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  updateCategoryLimit,
  type Category,
} from "@/household/categories";
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
  TextField,
} from "@/components/NativeUI";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { budgetPace, expenseTotalsByCategory } from "@/ledger/ledger";
import {
  currentMonthInTokyo,
  formatYen,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";

type LimitRow = {
  category: Category;
  spentYen: number;
};

export default function LimitsPage() {
  const { registerEntryChangeListener } = useEntrySheet();
  const [entries, setEntries] = useState<Awaited<ReturnType<typeof fetchEntries>>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [limitInput, setLimitInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const month = useMemo(() => currentMonthInTokyo(), []);

  const rows = useMemo((): LimitRow[] => {
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

  const loadLimits = useCallback(async () => {
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
        caught instanceof Error ? caught.message : "Failed to load limits",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLimits();
  }, [loadLimits]);

  useEffect(() => registerEntryChangeListener(loadLimits), [
    loadLimits,
    registerEntryChangeListener,
  ]);

  useRefreshOnFocus(loadLimits);

  function openEditor(category: Category) {
    setEditing(category);
    setLimitInput(
      category.monthly_limit_yen != null
        ? String(category.monthly_limit_yen)
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

    const parsed = limitInput.trim() ? parseYenInput(limitInput) : null;
    if (limitInput.trim() && parsed == null) {
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
        caught instanceof Error ? caught.message : "Failed to save limit",
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
          Payment limits
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

        <GroupCard title="Active limits">
          {loading ? (
            <EmptyState message="Loading limits…" />
          ) : rows.length === 0 ? (
            <EmptyState message="No limits set yet. Add one below." />
          ) : (
            rows.map(({ category, spentYen }) => {
              const limitYen = category.monthly_limit_yen ?? 0;
              const over = spentYen > limitYen;
              const pace = budgetPace(
                spentYen,
                limitYen,
                month.year,
                month.month,
                today,
              );

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => openEditor(category)}
                  className="w-full border-b border-[#ececee] px-4 py-4 text-left last:border-b-0 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[17px] font-medium">{category.name}</span>
                    <span
                      className={`text-[15px] font-semibold tabular-nums ${
                        over ? "text-[#ff3b30]" : "text-neutral-700 dark:text-neutral-300"
                      }`}
                    >
                      {formatYen(spentYen)}/{formatYen(limitYen)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <LimitProgressBar spentYen={spentYen} limitYen={limitYen} />
                  </div>
                  <p className="mt-2 text-[13px] text-neutral-500">
                    {pace.daysLeft} days left · projecting{" "}
                    {formatYen(pace.projectedSpendYen)} ·{" "}
                    {formatYen(pace.dailyAllowanceYen)}/day available
                  </p>
                </button>
              );
            })
          )}
        </GroupCard>

        {unsetCategories.length > 0 ? (
          <GroupCard title="Add limit">
            {unsetCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => openEditor(category)}
                className="flex w-full items-center justify-between border-b border-[#ececee] px-4 py-3.5 text-left last:border-b-0 active:bg-neutral-50 dark:border-neutral-800 dark:active:bg-neutral-800"
              >
                <span className="text-[17px] font-medium">{category.name}</span>
                <span className="text-[15px] font-medium text-[#007aff]">Set limit</span>
              </button>
            ))}
          </GroupCard>
        ) : null}
      </main>

      <SheetOverlay
        open={editing != null}
        onClose={closeEditor}
        title={editing ? `${editing.name} limit` : "Limit"}
      >
        <Field label="Monthly limit (yen)">
          <TextField
            value={limitInput}
            onChange={setLimitInput}
            placeholder="100000"
          />
        </Field>
        <p className="text-[14px] text-neutral-500">
          Leave blank to remove the limit.
        </p>
        {saveError ? <ErrorNote message={saveError} /> : null}
        <PrimaryAction disabled={busy} onClick={() => void handleSave()}>
          {busy ? "Saving…" : "Save"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}
