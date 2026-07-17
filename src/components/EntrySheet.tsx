import { useEffect, useMemo, useState } from "react";
import type { Category } from "@/household/categories";
import {
  categoriesForKind,
  defaultCategoryId,
} from "@/household/category-utils";
import { validateEntryDraft } from "@/household/entry-form";
import {
  createEntry,
  deleteEntry,
  updateEntry,
} from "@/household/entries";
import type { Pocket } from "@/household/pockets";
import { activePockets, defaultPocketId } from "@/household/pocket-utils";
import type { Entry, EntryKind } from "@/ledger/types";
import {
  formatYenInput,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";
import {
  formatIdrInput,
  parseIdrInput,
} from "@/lib/format-idr";
import {
  DateField,
  ErrorNote,
  Field,
  IdrAmountField,
  PillTabs,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
  YenAmountField,
} from "@/components/NativeUI";

type EntrySheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  householdId: string;
  userId: string;
  entry: Entry | null;
  pockets: Pocket[];
  categories: Category[];
};

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
  const [foreignAmountInput, setForeignAmountInput] = useState("");
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
      setForeignAmountInput(
        entry.foreignAmountIdr != null
          ? formatIdrInput(entry.foreignAmountIdr)
          : "",
      );
      setPocketId(entry.pocketId);
      setCategoryId(entry.categoryId);
      setEntryDate(entry.entryDate);
      setNote(entry.note ?? "");
    } else {
      setKind("expense");
      setAmountInput("");
      setForeignAmountInput("");
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
    const trimmedForeignInput = foreignAmountInput.trim();
    const foreignAmountIdr = trimmedForeignInput
      ? parseIdrInput(trimmedForeignInput)
      : null;

    if (trimmedForeignInput && foreignAmountIdr == null) {
      setError("Enter a positive amount in IDR.");
      return;
    }

    const validationError = validateEntryDraft({
      kind,
      amountYen,
      foreignAmountIdr,
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
        foreignAmountIdr,
        pocketId,
        categoryId,
        entryDate,
        note,
      };

      if (editing) {
        await updateEntry(entry.id, payload);
      } else {
        await createEntry({
          householdId,
          memberId: userId,
          ...payload,
        });
      }

      onSaved();
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
      onDeleted?.();
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
        <YenAmountField
          value={amountInput}
          onChange={(value) => setAmountInput(value.replace(/[^\d¥,\s]/g, ""))}
          onBlur={() => {
            const parsed = parseYenInput(amountInput);
            if (parsed != null) {
              setAmountInput(formatYenInput(parsed));
            }
          }}
        />
      </Field>

      <Field label="Foreign amount (IDR)">
        <IdrAmountField
          value={foreignAmountInput}
          onChange={(value) =>
            setForeignAmountInput(value.replace(/[^\dRp.,\s]/gi, ""))
          }
          onBlur={() => {
            const parsed = parseIdrInput(foreignAmountInput);
            if (parsed != null) {
              setForeignAmountInput(formatIdrInput(parsed));
            }
          }}
          disabled={busy}
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
        <DateField
          value={entryDate}
          onChange={setEntryDate}
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
