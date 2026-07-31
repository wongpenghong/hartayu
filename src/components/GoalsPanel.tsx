import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import { progressByGoal } from "@/household/goal-display";
import {
  createGoal,
  createGoalContribution,
  deleteGoal,
  updateGoal,
} from "@/household/goals";
import type { Goal, GoalContribution } from "@/ledger/types";
import type { Pocket } from "@/household/pockets";
import { activePockets } from "@/household/pocket-utils";
import {
  formatYen,
  formatYenInput,
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
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
  YenAmountField,
} from "@/components/NativeUI";

type GoalSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; goal: Goal }
  | { kind: "contribute"; goal: Goal };

export function GoalsPanel({
  goals,
  contributions,
  pockets,
  loading,
  onGoalsChange,
  onContributionsChange,
}: {
  goals: Goal[];
  contributions: GoalContribution[];
  pockets: Pocket[];
  loading: boolean;
  onGoalsChange: (goals: Goal[]) => void;
  onContributionsChange: (contributions: GoalContribution[]) => void;
}) {
  const { household, user } = useAuth();
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

  const visiblePockets = activePockets(pockets);
  const progressRows = progressByGoal(goals, contributions);
  const progressById = new Map(progressRows.map((row) => [row.goalId, row]));

  function openAdd() {
    setName("");
    setTargetInput("");
    setTargetDate("");
    setLinkedPocketId("");
    setEmoji("");
    setError(null);
    setSheet({ kind: "add" });
  }

  function openEdit(goal: Goal) {
    setName(goal.name);
    setTargetInput(formatYenInput(goal.targetAmountYen));
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
        onGoalsChange([created, ...goals]);
      } else if (sheet.kind === "edit") {
        const updated = await updateGoal(sheet.goal.id, {
          name,
          targetAmountYen,
          targetDate: targetDate || null,
          linkedPocketId: linkedPocketId || null,
          emoji,
        });
        onGoalsChange(goals.map((row) => (row.id === updated.id ? updated : row)));
      }
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save goal");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteGoal() {
    if (sheet.kind !== "edit") {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await deleteGoal(sheet.goal.id);
      onGoalsChange(goals.filter((row) => row.id !== sheet.goal.id));
      onContributionsChange(
        contributions.filter((row) => row.goalId !== sheet.goal.id),
      );
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
      onContributionsChange([created, ...contributions]);
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to add contribution",
      );
    } finally {
      setBusy(false);
    }
  }

  const sheetOpen = sheet.kind !== "closed";

  return (
    <>
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
              <div
                key={goal.id}
                className="border-b border-[#ececee] px-4 py-4 last:border-b-0 dark:border-neutral-800"
              >
                <div className="flex items-start gap-3">
                  <GoalIcon name={goal.name} emoji={goal.emoji} />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => openEdit(goal)}
                      className="block w-full text-left"
                    >
                      <p className="truncate text-[17px] font-medium">{goal.name}</p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {progress
                          ? `${formatYen(progress.savedYen)} of ${formatYen(goal.targetAmountYen)}`
                          : formatYen(goal.targetAmountYen)}
                        {goal.targetDate ? ` · by ${goal.targetDate}` : ""}
                      </p>
                    </button>
                    {progress ? (
                      <div className="mt-3">
                        <LimitProgressBar
                          spentYen={progress.savedYen}
                          limitYen={progress.targetAmountYen}
                        />
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => openContribute(goal)}
                    className="shrink-0 text-[15px] font-medium text-[#007aff] disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>
            );
          })
        )}
      </GroupCard>

      {error && !sheetOpen ? <ErrorNote message={error} /> : null}

      <SheetOverlay
        open={sheetOpen && (sheet.kind === "add" || sheet.kind === "edit")}
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
          <YenAmountField
            value={targetInput}
            onChange={(value) => setTargetInput(value.replace(/[^\d¥,\s]/g, ""))}
            onBlur={() => {
              const parsed = parseYenInput(targetInput);
              if (parsed != null) {
                setTargetInput(formatYenInput(parsed));
              }
            }}
          />
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
        open={sheetOpen && sheet.kind === "contribute"}
        onClose={closeSheet}
        title="Add to goal"
      >
        <Field label="Amount">
          <YenAmountField
            value={contributionInput}
            onChange={(value) =>
              setContributionInput(value.replace(/[^\d¥,\s]/g, ""))
            }
            onBlur={() => {
              const parsed = parseYenInput(contributionInput);
              if (parsed != null) {
                setContributionInput(formatYenInput(parsed));
              }
            }}
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
          onClick={() => void handleSaveContribution()}
        >
          {busy ? "Saving…" : "Save contribution"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}
