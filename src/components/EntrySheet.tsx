import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/household/categories";
import { validateEntryDraft } from "@/household/entry-form";
import {
  createEntry,
  deleteEntry,
  updateEntry,
} from "@/household/entries";
import type { HouseholdMember } from "@/household/members";
import type { Pocket } from "@/household/pockets";
import type { Entry, EntryKind } from "@/ledger/types";
import {
  formatYenInput,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";
import {
  ErrorNote,
  Field,
  PillTabs,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
} from "@/components/NativeUI";

type EntrySheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
  onDeleted?: (entryId: string) => void;
  householdId: string;
  userId: string;
  entry: Entry | null;
  pockets: Pocket[];
  categories: Category[];
};

function activePockets(pockets: Pocket[]): Pocket[] {
  return pockets.filter((pocket) => !pocket.archived_at);
}

function defaultPocketId(pockets: Pocket[], userId: string): string {
  const active = activePockets(pockets);
  return (
    active.find((pocket) => pocket.primary_member_id === userId)?.id ??
    active[0]?.id ??
    ""
  );
}

function defaultCategoryId(
  categories: Category[],
  kind: EntryKind,
): string {
  return categories.find((category) => category.kind === kind)?.id ?? "";
}

function categoriesForKind(
  categories: Category[],
  kind: EntryKind,
): Category[] {
  return categories.filter((category) => category.kind === kind);
}

export function EntrySheet({
  open,
  onClose,
  onSaved,
  onDeleted,
  householdId,
  userId,
  entry,
  pockets,
  categories,
}: EntrySheetProps) {
  const editing = entry != null;
  const [kind, setKind] = useState<EntryKind>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [pocketId, setPocketId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [entryDate, setEntryDate] = useState(todayInTokyo());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visiblePockets = useMemo(() => activePockets(pockets), [pockets]);
  const visibleCategories = useMemo(
    () => categoriesForKind(categories, kind),
    [categories, kind],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (entry) {
      setKind(entry.kind);
      setAmountInput(formatYenInput(entry.amountYen));
      setPocketId(entry.pocketId);
      setCategoryId(entry.categoryId);
      setEntryDate(entry.entryDate);
      setNote(entry.note ?? "");
    } else {
      setKind("expense");
      setAmountInput("");
      setPocketId(defaultPocketId(pockets, userId));
      setCategoryId(defaultCategoryId(categories, "expense"));
      setEntryDate(todayInTokyo());
      setNote("");
    }

    setError(null);
  }, [categories, entry, open, pockets, userId]);

  function handleKindChange(nextKind: EntryKind) {
    setKind(nextKind);
    const nextCategories = categoriesForKind(categories, nextKind);
    if (!nextCategories.some((category) => category.id === categoryId)) {
      setCategoryId(nextCategories[0]?.id ?? "");
    }
  }

  async function handleSave() {
    const amountYen = parseYenInput(amountInput);
    const validationError = validateEntryDraft({
      kind,
      amountYen,
      pocketId,
      categoryId,
      entryDate,
      note,
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload = {
        kind,
        amountYen: amountYen!,
        pocketId,
        categoryId,
        entryDate,
        note,
      };

      const saved = editing
        ? await updateEntry(entry.id, payload)
        : await createEntry({
            householdId,
            memberId: userId,
            ...payload,
          });

      onSaved(saved);
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save entry");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!entry) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await deleteEntry(entry.id);
      onDeleted?.(entry.id);
      onClose();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to delete entry",
      );
    } finally {
      setBusy(false);
    }
  }

  const canSave =
    visiblePockets.length > 0 &&
    visibleCategories.length > 0 &&
    !busy;

  return (
    <SheetOverlay
      open={open}
      onClose={onClose}
      title={editing ? "Edit entry" : "Add entry"}
    >
      <PillTabs
        value={kind}
        onChange={handleKindChange}
        options={[
          { value: "expense", label: "Expense" },
          { value: "income", label: "Income" },
        ]}
      />

      <Field label="Amount">
        <input
          className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[28px] font-semibold tabular-nums outline-none ring-[#007aff] focus:ring-2"
          inputMode="numeric"
          autoComplete="off"
          placeholder="¥0"
          value={amountInput}
          onChange={(event) =>
            setAmountInput(event.target.value.replace(/[^\d¥,\s]/g, ""))
          }
          onBlur={() => {
            const parsed = parseYenInput(amountInput);
            if (parsed != null) {
              setAmountInput(formatYenInput(parsed));
            }
          }}
        />
      </Field>

      <Field label="Pocket">
        <SelectField value={pocketId} onChange={setPocketId} disabled={busy}>
          {visiblePockets.length === 0 ? (
            <option value="">Add a pocket in Settings</option>
          ) : (
            visiblePockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))
          )}
        </SelectField>
      </Field>

      <Field label="Category">
        <SelectField
          value={categoryId}
          onChange={setCategoryId}
          disabled={busy}
        >
          {visibleCategories.length === 0 ? (
            <option value="">No categories for this type</option>
          ) : (
            visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))
          )}
        </SelectField>
      </Field>

      <Field label="Date">
        <input
          className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[17px] outline-none ring-[#007aff] focus:ring-2"
          type="date"
          value={entryDate}
          onChange={(event) => setEntryDate(event.target.value)}
          disabled={busy}
        />
      </Field>

      <Field label="Note">
        <TextField
          value={note}
          onChange={setNote}
          placeholder="Optional"
          disabled={busy}
        />
      </Field>

      {error ? <ErrorNote message={error} /> : null}

      <PrimaryAction disabled={!canSave} onClick={() => void handleSave()}>
        {busy ? "Saving…" : editing ? "Save changes" : "Save entry"}
      </PrimaryAction>

      {editing ? (
        <PrimaryAction
          variant="destructive"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          {busy ? "Deleting…" : "Delete entry"}
        </PrimaryAction>
      ) : null}
    </SheetOverlay>
  );
}

export function memberNameForEntry(
  members: HouseholdMember[],
  memberId: string,
): string {
  return (
    members.find((member) => member.user_id === memberId)?.username ?? "Member"
  );
}

export function formatEntryDate(entryDate: string): string {
  const [year, month, day] = entryDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}
