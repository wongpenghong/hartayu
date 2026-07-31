import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "@/household/categories";
import {
  attributedMemberIdFromPicker,
  attributionPickerValue,
  FAMILY_ATTRIBUTION_ID,
  partnerMember,
} from "@/household/attribution";
import type { HouseholdMember } from "@/household/members";
import {
  categoriesForKind,
  defaultCategoryId,
} from "@/household/category-utils";
import {
  validateEntryDraft,
  validateTransferDraft,
  entryDraftAmountYen,
  type EntryDraftPrefill,
} from "@/household/entry-form";
import {
  expensePocketBalanceWarning,
  netTone,
  pocketBalanceForEntryForm,
} from "@/household/entry-display";
import {
  createEntry,
  createTransfer,
  deleteEntry,
  updateEntry,
  updateTransfer,
} from "@/household/entries";
import { markBillPaid } from "@/household/bills";
import type { Pocket } from "@/household/pockets";
import { activePockets, defaultPocketId } from "@/household/pocket-utils";
import type { Entry, EntryKind } from "@/ledger/types";
import { recentCategoryIds } from "@/ledger/ledger";
import {
  formatYen,
  formatYenDigits,
  parseYenInput,
  todayInTokyo,
} from "@/lib/format-yen";
import {
  formatIdrDigits,
  parseIdrInput,
} from "@/lib/format-idr";
import {
  formatExchangeRateInput,
  parseExchangeRateInput,
} from "@/lib/format-idr-rate";
import {
  CategoryChip,
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

type SheetKind = EntryKind;

type EntrySheetProps = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  onDeleted?: () => void;
  householdId: string;
  userId: string;
  members: HouseholdMember[];
  entry: Entry | null;
  draft?: EntryDraftPrefill | null;
  billId?: string | null;
  pockets: Pocket[];
  categories: Category[];
  entries: Entry[];
};

export function EntrySheet({
  open,
  onClose,
  onSaved,
  onDeleted,
  householdId,
  userId,
  members,
  entry,
  draft = null,
  billId = null,
  pockets,
  categories,
  entries,
}: EntrySheetProps) {
  const editing = entry != null;
  const amountRef = useRef<HTMLInputElement>(null);
  const yenTouchedRef = useRef(false);
  const [kind, setKind] = useState<SheetKind>("expense");
  const [amountInput, setAmountInput] = useState("");
  const [foreignAmountInput, setForeignAmountInput] = useState("");
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [pocketId, setPocketId] = useState("");
  const [toPocketId, setToPocketId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [entryDate, setEntryDate] = useState(todayInTokyo());
  const [note, setNote] = useState("");
  const [attribution, setAttribution] = useState(userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partner = useMemo(
    () => partnerMember(members, userId),
    [members, userId],
  );
  const visiblePockets = useMemo(() => activePockets(pockets), [pockets]);
  const visibleCategories = useMemo(
    () => (kind === "transfer" ? [] : categoriesForKind(categories, kind)),
    [categories, kind],
  );
  const attributionOptions = useMemo(() => {
    const options = [{ value: userId, label: "Me" }];
    if (partner) {
      options.push({ value: partner.user_id, label: partner.username });
    }
    options.push({ value: FAMILY_ATTRIBUTION_ID, label: "Family" });
    return options;
  }, [partner, userId]);
  const recentCategories = useMemo(() => {
    if (kind === "transfer") {
      return [];
    }

    const recentIds = recentCategoryIds(entries, kind, 5);
    const byId = new Map(visibleCategories.map((category) => [category.id, category]));

    return recentIds
      .map((id) => byId.get(id))
      .filter((category): category is Category => category != null);
  }, [entries, kind, visibleCategories]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (entry) {
      setKind(entry.kind);
      setAmountInput(formatYenDigits(entry.amountYen));
      setForeignAmountInput(
        entry.foreignAmountIdr != null
          ? formatIdrDigits(entry.foreignAmountIdr)
          : "",
      );
      setExchangeRateInput(
        entry.exchangeRateIdrToJpy != null
          ? formatExchangeRateInput(entry.exchangeRateIdrToJpy)
          : "",
      );
      yenTouchedRef.current = false;
      setPocketId(entry.pocketId);
      setToPocketId(entry.toPocketId ?? "");
      setCategoryId(entry.categoryId ?? "");
      setEntryDate(entry.entryDate);
      setNote(entry.note ?? "");
      setAttribution(attributionPickerValue(entry, userId));
    } else {
      setKind(draft?.kind ?? "expense");
      setAmountInput(
        draft?.amountYen != null ? formatYenDigits(draft.amountYen) : "",
      );
      setForeignAmountInput("");
      setExchangeRateInput("");
      yenTouchedRef.current = Boolean(draft?.amountYen != null);
      const defaultPocket = defaultPocketId(pockets, userId);
      setPocketId(draft?.pocketId ?? defaultPocket);
      setToPocketId(
        visiblePockets.find((pocket) => pocket.id !== (draft?.pocketId ?? defaultPocket))
          ?.id ?? "",
      );
      setCategoryId(
        draft?.categoryId ?? defaultCategoryId(categories, draft?.kind ?? "expense"),
      );
      setEntryDate(draft?.entryDate ?? todayInTokyo());
      setNote(draft?.note ?? "");
      setAttribution(draft?.attribution ?? userId);
    }

    setError(null);
  }, [categories, draft, entry, open, pockets, userId, visiblePockets]);

  useEffect(() => {
    if (!open || kind === "transfer" || yenTouchedRef.current) {
      return;
    }

    const foreignAmountIdr = parseIdrInput(foreignAmountInput);
    const exchangeRateIdrToJpy = parseExchangeRateInput(exchangeRateInput);
    if (foreignAmountIdr == null || exchangeRateIdrToJpy == null) {
      return;
    }

    const derivedAmountYen = entryDraftAmountYen({
      kind,
      amountYen: null,
      foreignAmountIdr,
      exchangeRateIdrToJpy,
      pocketId,
      categoryId,
      entryDate,
      note,
    });

    if (derivedAmountYen != null) {
      setAmountInput(formatYenDigits(derivedAmountYen));
    }
  }, [exchangeRateInput, foreignAmountInput, kind, open]);

  const destinationPockets = visiblePockets.filter((pocket) => pocket.id !== pocketId);
  const pocketBalanceById = useMemo(() => {
    const balances = new Map<string, number>();
    for (const pocket of visiblePockets) {
      balances.set(
        pocket.id,
        pocketBalanceForEntryForm(entries, pocket.id, entry),
      );
    }
    return balances;
  }, [entries, entry, visiblePockets]);

  const selectedPocketBalanceYen = pocketId
    ? (pocketBalanceById.get(pocketId) ?? null)
    : null;
  const draftAmountYen = parseYenInput(amountInput);
  const expenseBalanceWarning =
    kind === "expense" && selectedPocketBalanceYen != null
      ? expensePocketBalanceWarning(selectedPocketBalanceYen, draftAmountYen)
      : null;

  function pocketOptionLabel(pocket: Pocket): string {
    const balanceYen = pocketBalanceById.get(pocket.id) ?? 0;
    const prefix = pocket.emoji ? `${pocket.emoji} ` : "";
    return `${prefix}${pocket.name} · ${formatYen(balanceYen)}`;
  }

  function PocketBalanceHint({ balanceYen }: { balanceYen: number }) {
    return (
      <p className={`mt-2 text-[13px] font-medium ${netTone(balanceYen)}`}>
        Balance {formatYen(balanceYen)}
      </p>
    );
  }

  function pickDestinationPocket(fromPocketId: string): string {
    return (
      visiblePockets.find((pocket) => pocket.id !== fromPocketId)?.id ?? ""
    );
  }

  function handleFromPocketChange(nextFromPocketId: string) {
    setPocketId(nextFromPocketId);
    setToPocketId((current) => {
      if (current && current !== nextFromPocketId) {
        return current;
      }
      return pickDestinationPocket(nextFromPocketId);
    });
  }

  function handleKindChange(nextKind: SheetKind) {
    setKind(nextKind);
    if (nextKind === "transfer") {
      setToPocketId((current) => {
        if (current && current !== pocketId) {
          return current;
        }
        return pickDestinationPocket(pocketId);
      });
      return;
    }

    const nextCategories = categoriesForKind(categories, nextKind);
    if (!nextCategories.some((category) => category.id === categoryId)) {
      setCategoryId(nextCategories[0]?.id ?? "");
    }
  }

  useEffect(() => {
    if (!open || kind !== "transfer") {
      return;
    }

    const toIsValid = destinationPockets.some((pocket) => pocket.id === toPocketId);
    if (!toIsValid) {
      setToPocketId(destinationPockets[0]?.id ?? "");
    }
  }, [destinationPockets, kind, open, toPocketId]);

  function selectCategory(nextCategoryId: string, focusAmount = false) {
    setCategoryId(nextCategoryId);
    if (focusAmount) {
      requestAnimationFrame(() => amountRef.current?.focus());
    }
  }

  async function handleSave() {
    const amountYen = parseYenInput(amountInput);

    if (kind === "transfer") {
      const validationError = validateTransferDraft({
        amountYen,
        fromPocketId: pocketId,
        toPocketId,
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
          amountYen: amountYen!,
          fromPocketId: pocketId,
          toPocketId,
          entryDate,
          note,
        };

        if (editing) {
          await updateTransfer(entry.id, payload);
        } else {
          await createTransfer({
            householdId,
            memberId: userId,
            ...payload,
          });
        }

        onSaved();
        onClose();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to save transfer");
      } finally {
        setBusy(false);
      }

      return;
    }

    const trimmedForeignInput = foreignAmountInput.trim();
    const foreignAmountIdr = trimmedForeignInput
      ? parseIdrInput(trimmedForeignInput)
      : null;
    const trimmedRateInput = exchangeRateInput.trim();
    const exchangeRateIdrToJpy = trimmedRateInput
      ? parseExchangeRateInput(trimmedRateInput)
      : null;

    if (trimmedForeignInput && foreignAmountIdr == null) {
      setError("Enter a positive amount in IDR.");
      return;
    }

    if (trimmedRateInput && exchangeRateIdrToJpy == null) {
      setError("Enter a positive exchange rate.");
      return;
    }

    const draft = {
      kind,
      amountYen,
      foreignAmountIdr,
      exchangeRateIdrToJpy,
      pocketId,
      categoryId,
      entryDate,
      note,
    };
    const validationError = validateEntryDraft(draft);

    if (validationError) {
      setError(validationError);
      return;
    }

    const resolvedAmountYen = entryDraftAmountYen(draft);
    if (resolvedAmountYen == null) {
      setError("Enter an amount in yen, or IDR with an exchange rate.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const payload = {
        kind,
        amountYen: resolvedAmountYen,
        foreignAmountIdr,
        exchangeRateIdrToJpy,
        pocketId,
        categoryId,
        attributedMemberId: attributedMemberIdFromPicker(attribution),
        entryDate,
        note,
      };

      if (editing) {
        await updateEntry(entry.id, payload);
      } else {
        await createEntry({
          householdId,
          memberId: userId,
          billId,
          ...payload,
        });
        if (billId) {
          await markBillPaid(billId);
        }
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
    visiblePockets.length >= (kind === "transfer" ? 2 : 1) &&
    (kind === "transfer" || visibleCategories.length > 0) &&
    !busy;

  return (
    <SheetOverlay
      open={open}
      onClose={onClose}
      title={
        editing
          ? entry?.kind === "transfer"
            ? "Edit transfer"
            : "Edit entry"
          : kind === "transfer"
            ? "Add transfer"
            : "Add entry"
      }
    >
      {!editing ? (
        <PillTabs
          value={kind}
          onChange={handleKindChange}
          options={[
            { value: "expense", label: "Expense" },
            { value: "income", label: "Income" },
            { value: "transfer", label: "Transfer" },
          ]}
        />
      ) : null}

      {kind === "transfer" ? (
        <>
          <Field label="From pocket">
            <SelectField
              value={pocketId}
              onChange={handleFromPocketChange}
              disabled={busy}
            >
              {visiblePockets.length === 0 ? (
                <option value="">Add a pocket in Settings</option>
              ) : (
                visiblePockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocketOptionLabel(pocket)}
                  </option>
                ))
              )}
            </SelectField>
            {selectedPocketBalanceYen != null ? (
              <PocketBalanceHint balanceYen={selectedPocketBalanceYen} />
            ) : null}
          </Field>

          <Field label="To pocket">
            <SelectField value={toPocketId} onChange={setToPocketId} disabled={busy}>
              {destinationPockets.length === 0 ? (
                <option value="">Choose another pocket</option>
              ) : (
                destinationPockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocketOptionLabel(pocket)}
                  </option>
                ))
              )}
            </SelectField>
          </Field>
        </>
      ) : (
        <>
          <Field label="Category">
            {!editing && recentCategories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentCategories.map((category) => (
                  <CategoryChip
                    key={category.id}
                    label={category.name}
                    emoji={category.emoji}
                    selected={categoryId === category.id}
                    disabled={busy}
                    onClick={() => selectCategory(category.id, true)}
                  />
                ))}
              </div>
            ) : null}
            <SelectField
              value={categoryId}
              onChange={(value) => selectCategory(value)}
              disabled={busy}
            >
              {visibleCategories.length === 0 ? (
                <option value="">No categories for this type</option>
              ) : (
                visibleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji ? `${category.emoji} ` : ""}
                    {category.name}
                  </option>
                ))
              )}
            </SelectField>
          </Field>

          <Field label="Pocket">
            <SelectField value={pocketId} onChange={setPocketId} disabled={busy}>
              {visiblePockets.length === 0 ? (
                <option value="">Add a pocket in Settings</option>
              ) : (
                visiblePockets.map((pocket) => (
                  <option key={pocket.id} value={pocket.id}>
                    {pocketOptionLabel(pocket)}
                  </option>
                ))
              )}
            </SelectField>
            {selectedPocketBalanceYen != null ? (
              <PocketBalanceHint balanceYen={selectedPocketBalanceYen} />
            ) : null}
            {expenseBalanceWarning ? (
              <p className="mt-2 text-[13px] font-medium text-[#ff3b30]">
                {expenseBalanceWarning}
              </p>
            ) : null}
          </Field>

          <Field label="For">
            <PillTabs
              value={attribution}
              onChange={setAttribution}
              options={attributionOptions}
            />
          </Field>
        </>
      )}

      <Field label="Amount">
        <YenAmountField
          ref={amountRef}
          value={amountInput}
          onChange={(value) => {
            yenTouchedRef.current = true;
            setAmountInput(value);
          }}
        />
      </Field>

      {kind !== "transfer" ? (
        <>
          <Field label="Foreign amount (IDR)">
            <IdrAmountField
              value={foreignAmountInput}
              onChange={setForeignAmountInput}
              disabled={busy}
            />
          </Field>
          <Field label="Exchange rate (¥ per IDR)">
            <TextField
              value={exchangeRateInput}
              onChange={setExchangeRateInput}
              placeholder="0.0095"
              disabled={busy}
            />
          </Field>
        </>
      ) : null}

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
        {busy
          ? "Saving…"
          : editing
            ? "Save changes"
            : kind === "transfer"
              ? "Save transfer"
              : "Save entry"}
      </PrimaryAction>

      {editing ? (
        <PrimaryAction
          variant="destructive"
          disabled={busy}
          onClick={() => void handleDelete()}
        >
          {busy ? "Deleting…" : entry?.kind === "transfer" ? "Delete transfer" : "Delete entry"}
        </PrimaryAction>
      ) : null}
    </SheetOverlay>
  );
}
