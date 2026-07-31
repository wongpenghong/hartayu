import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import {
  goalMonthlyPace,
  progressByGoal,
} from "@/household/goal-display";
import {
  createGoal,
  createGoalContribution,
  createGoalWithdrawal,
  deleteGoal,
  fetchGoalContributions,
  fetchGoals,
  updateGoal,
} from "@/household/goals";
import type { Goal, GoalContribution } from "@/ledger/types";
import type { Pocket } from "@/household/pockets";
import { fetchPockets } from "@/household/pockets";
import { activePockets } from "@/household/pocket-utils";
import {
  formatYen,
  formatYenDigits,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";
import {
  DateField,
  EmojiField,
  EmptyState,
  ErrorNote,
  Field,
  GoalIcon,
  GroupCard,
  LimitProgressBar,
  ListRow,
  PageBackLink,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
  YenAmountField,
} from "@/components/NativeUI";
import { useRefreshOnFocus, type RefreshOptions } from "@/hooks/useRefreshOnFocus";
import { getPageCache, hasPageCache, setPageCache } from "@/lib/page-cache";

const GOALS_PAGE_CACHE = "goals-page";

type GoalsPageCache = {
  goals: Goal[];
  contributions: GoalContribution[];
  pockets: Pocket[];
};

type GoalSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "detail"; goal: Goal }
  | { kind: "edit"; goal: Goal }
  | { kind: "contribute"; goal: Goal }
  | { kind: "withdraw"; goal: Goal };

export default function GoalsPage() {
  const { household, user } = useAuth();
  const cached = getPageCache<GoalsPageCache>(GOALS_PAGE_CACHE);
  const [goals, setGoals] = useState(cached?.goals ?? []);
  const [contributions, setContributions] = useState(cached?.contributions ?? []);
  const [pockets, setPockets] = useState(cached?.pockets ?? []);
  const [sheet, setSheet] = useState<GoalSheetMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedPocketId, setLinkedPocketId] = useState("");
  const [emoji, setEmoji] = useState("");
  const [contributionInput, setContributionInput] = useState("");
  const [contributionDate, setContributionDate] = useState(todayInTokyo());
  const [contributionNote, setContributionNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasPageCache(GOALS_PAGE_CACHE));
  const [loadError, setLoadError] = useState<string | null>(null);

  const visiblePockets = activePockets(pockets);
  const progressRows = progressByGoal(goals, contributions);
  const progressById = useMemo(
    () => new Map(progressRows.map((row) => [row.goalId, row])),
    [progressRows],
  );
  const today = todayInTokyo();

  const loadGoals = useCallback(async (options?: RefreshOptions) => {
    if (!options?.background) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [nextGoals, nextContributions, nextPockets] = await Promise.all([
        fetchGoals(),
        fetchGoalContributions(),
        fetchPockets(),
      ]);
      setGoals(nextGoals);
      setContributions(nextContributions);
      setPockets(nextPockets);
      setPageCache(GOALS_PAGE_CACHE, {
        goals: nextGoals,
        contributions: nextContributions,
        pockets: nextPockets,
      });
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load goals",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadGoals({ background: hasPageCache(GOALS_PAGE_CACHE) });
  }, [loadGoals]);

  useRefreshOnFocus(loadGoals);

  function openAdd() {
    setName("");
    setTargetInput("");
    setTargetDate("");
    setLinkedPocketId("");
    setEmoji("");
    setError(null);
    setSheet({ kind: "add" });
  }

  function openDetail(goal: Goal) {
    setError(null);
    setSheet({ kind: "detail", goal });
  }

  function openEdit(goal: Goal) {
    setName(goal.name);
    setTargetInput(formatYenDigits(goal.targetAmountYen));
    setTargetDate(goal.targetDate ?? "");
    setLinkedPocketId(goal.linkedPocketId ?? "");
    setEmoji(goal.emoji ?? "");
    setError(null);
    setSheet({ kind: "edit", goal });
  }

  function openContribute(goal: Goal) {
    setContributionInput("");
    setContributionDate(todayInTokyo());
    setContributionNote("");
    setError(null);
    setSheet({ kind: "contribute", goal });
  }

  function openWithdraw(goal: Goal) {
    setContributionInput("");
    setContributionDate(todayInTokyo());
    setContributionNote("");
    setError(null);
    setSheet({ kind: "withdraw", goal });
  }

  function closeSheet() {
    setSheet({ kind: "closed" });
    setError(null);
  }

  async function handleSaveGoal() {
    if (!household) {
      return;
    }

    const targetAmountYen = parseYenInput(targetInput);
    if (targetAmountYen == null) {
      setError("Enter a positive target amount in yen.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (sheet.kind === "add") {
        const created = await createGoal({
          householdId: household.id,
          name,
          targetAmountYen,
          targetDate: targetDate || null,
          linkedPocketId: linkedPocketId || null,
          emoji,
        });
        setGoals([created, ...goals]);
      } else if (sheet.kind === "edit") {
        const updated = await updateGoal(sheet.goal.id, {
          name,
          targetAmountYen,
          targetDate: targetDate || null,
          linkedPocketId: linkedPocketId || null,
          emoji,
        });
        setGoals(goals.map((row) => (row.id === updated.id ? updated : row)));
      }
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save goal");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGoal() {
    if (sheet.kind !== "edit" && sheet.kind !== "detail") {
      return;
    }

    const goalId = sheet.goal.id;
    setBusy(true);
    setError(null);

    try {
      await deleteGoal(goalId);
      setGoals(goals.filter((row) => row.id !== goalId));
      setContributions(contributions.filter((row) => row.goalId !== goalId));
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete goal");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveContribution() {
    if (!household || !user || sheet.kind !== "contribute") {
      return;
    }

    const amountYen = parseYenInput(contributionInput);
    if (amountYen == null) {
      setError("Enter a positive amount in yen.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const created = await createGoalContribution({
        householdId: household.id,
        goalId: sheet.goal.id,
        memberId: user.id,
        amountYen,
        contributionDate,
        note: contributionNote,
      });
      setContributions([created, ...contributions]);
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to add contribution",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveWithdrawal() {
    if (!household || !user || sheet.kind !== "withdraw") {
      return;
    }

    const amountYen = parseYenInput(contributionInput);
    if (amountYen == null) {
      setError("Enter a positive amount in yen.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const created = await createGoalWithdrawal({
        householdId: household.id,
        goalId: sheet.goal.id,
        memberId: user.id,
        amountYen,
        contributionDate,
        note: contributionNote,
      });
      setContributions([created, ...contributions]);
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to withdraw",
      );
    } finally {
      setBusy(false);
    }
  }

  const formSheetOpen =
    sheet.kind === "add" || sheet.kind === "edit";
  const movementSheetOpen =
    sheet.kind === "contribute" || sheet.kind === "withdraw";
  const detailOpen = sheet.kind === "detail";
  const detailGoal = sheet.kind === "detail" ? sheet.goal : null;
  const detailProgress = detailGoal ? progressById.get(detailGoal.id) : null;
  const detailPace =
    detailGoal != null
      ? goalMonthlyPace(detailGoal, contributions, today)
      : null;

  return (
    <>
      <header className="px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <PageBackLink to="/more" label="More" />
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Goals
        </h1>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        {loadError ? <ErrorNote message={loadError} /> : null}
        {error && sheet.kind === "closed" ? <ErrorNote message={error} /> : null}

        <GroupCard footer="Track savings toward named targets. Contributions do not affect expense net.">
          <ListRow onClick={openAdd}>
            <span className="text-[17px] font-medium text-[#007aff]">+ Add goal</span>
          </ListRow>
          {loading ? (
            <EmptyState message="Loading goals…" />
          ) : goals.length === 0 ? (
            <EmptyState message="No savings goals yet." />
          ) : (
            goals.map((goal) => {
              const progress = progressById.get(goal.id);
              return (
                <ListRow key={goal.id} onClick={() => openDetail(goal)}>
                  <GoalIcon name={goal.name} emoji={goal.emoji} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-medium">
                      {goal.name}
                    </span>
                    <span className="mt-0.5 block text-[13px] text-neutral-500">
                      {progress
                        ? `${formatYen(progress.savedYen)} of ${formatYen(goal.targetAmountYen)}`
                        : formatYen(goal.targetAmountYen)}
                      {goal.targetDate ? ` · by ${goal.targetDate}` : ""}
                    </span>
                  </span>
                  {progress ? (
                    <span className="text-[15px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
                      {progress.progressPercent}%
                    </span>
                  ) : null}
                  <span className="text-[20px] text-neutral-300">›</span>
                </ListRow>
              );
            })
          )}
        </GroupCard>
      </main>

      <SheetOverlay
        open={detailOpen}
        onClose={closeSheet}
        title={detailGoal?.name ?? "Goal"}
      >
        {detailGoal && detailProgress ? (
          <>
            <div className="flex items-center gap-3">
              <GoalIcon name={detailGoal.name} emoji={detailGoal.emoji} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] text-neutral-500">
                  {formatYen(detailProgress.savedYen)} of{" "}
                  {formatYen(detailGoal.targetAmountYen)}
                </p>
                <p className="mt-1 text-[28px] font-bold tabular-nums">
                  {detailProgress.progressPercent}%
                </p>
              </div>
            </div>
            <div className="mt-4">
              <LimitProgressBar
                spentYen={detailProgress.savedYen}
                limitYen={detailGoal.targetAmountYen}
              />
            </div>
            <p className="mt-4 text-[14px] text-neutral-500">
              {detailPace == null
                ? "Set a target date to see monthly pace."
                : detailPace === 0
                  ? "Target reached."
                  : `Monthly pace · ${formatYen(detailPace)}/mo`}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <PrimaryAction
                disabled={busy}
                onClick={() => openContribute(detailGoal)}
              >
                Add
              </PrimaryAction>
              <PrimaryAction
                variant="secondary"
                disabled={busy}
                onClick={() => openWithdraw(detailGoal)}
              >
                Withdraw
              </PrimaryAction>
            </div>
            <PrimaryAction
              variant="secondary"
              disabled={busy}
              onClick={() => openEdit(detailGoal)}
            >
              Edit goal
            </PrimaryAction>
            <PrimaryAction
              variant="destructive"
              disabled={busy}
              onClick={() => void handleDeleteGoal()}
            >
              {busy ? "Deleting…" : "Delete goal"}
            </PrimaryAction>
          </>
        ) : null}
      </SheetOverlay>

      <SheetOverlay
        open={formSheetOpen}
        onClose={closeSheet}
        title={sheet.kind === "add" ? "New goal" : "Edit goal"}
      >
        <Field label="Icon">
          <EmojiField value={emoji} onChange={setEmoji} disabled={busy} />
        </Field>
        <Field label="Name">
          <TextField value={name} onChange={setName} placeholder="Holiday 2027" />
        </Field>
        <Field label="Target amount">
          <YenAmountField value={targetInput} onChange={setTargetInput} />
        </Field>
        <Field label="Target date">
          <DateField value={targetDate} onChange={setTargetDate} disabled={busy} />
        </Field>
        <Field label="Linked pocket">
          <SelectField
            value={linkedPocketId}
            onChange={setLinkedPocketId}
            disabled={busy}
          >
            <option value="">None</option>
            {visiblePockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.emoji ? `${pocket.emoji} ` : ""}
                {pocket.name}
              </option>
            ))}
          </SelectField>
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        <PrimaryAction
          disabled={busy || !name.trim() || !targetInput.trim()}
          onClick={() => void handleSaveGoal()}
        >
          {busy ? "Saving…" : "Save"}
        </PrimaryAction>
        {sheet.kind === "edit" ? (
          <PrimaryAction
            variant="destructive"
            disabled={busy}
            onClick={() => void handleDeleteGoal()}
          >
            {busy ? "Deleting…" : "Delete goal"}
          </PrimaryAction>
        ) : null}
      </SheetOverlay>

      <SheetOverlay
        open={movementSheetOpen}
        onClose={closeSheet}
        title={sheet.kind === "withdraw" ? "Withdraw from goal" : "Add to goal"}
      >
        <Field label="Amount">
          <YenAmountField
            value={contributionInput}
            onChange={setContributionInput}
          />
        </Field>
        <Field label="Date">
          <DateField
            value={contributionDate}
            onChange={setContributionDate}
            disabled={busy}
          />
        </Field>
        <Field label="Note">
          <TextField
            value={contributionNote}
            onChange={setContributionNote}
            placeholder="Optional"
            disabled={busy}
          />
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        <PrimaryAction
          disabled={busy || !contributionInput.trim()}
          onClick={() =>
            void (sheet.kind === "withdraw"
              ? handleSaveWithdrawal()
              : handleSaveContribution())
          }
        >
          {busy ? "Saving…" : sheet.kind === "withdraw" ? "Withdraw" : "Save contribution"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}
