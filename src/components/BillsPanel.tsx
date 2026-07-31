import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import {
  FAMILY_ATTRIBUTION_ID,
  partnerMember,
} from "@/household/attribution";
import type { Category } from "@/household/categories";
import { categoriesForKind } from "@/household/category-utils";
import {
  createBill,
  deleteBill,
  updateBill,
  validateBillAmount,
} from "@/household/bills";
import type { Bill } from "@/ledger/types";
import type { Pocket } from "@/household/pockets";
import { activePockets } from "@/household/pocket-utils";
import {
  formatYenDigits,
  parseYenInput,
} from "@/lib/format-yen";
import {
  CheckboxField,
  EmptyState,
  ErrorNote,
  Field,
  GroupCard,
  ListRow,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
  YenAmountField,
} from "@/components/NativeUI";

type BillSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; bill: Bill };

export function BillsPanel({
  bills,
  categories,
  pockets,
  members,
  loading,
  onChange,
}: {
  bills: Bill[];
  categories: Category[];
  pockets: Pocket[];
  members: Awaited<ReturnType<typeof import("@/household/members").fetchHouseholdMembers>>;
  loading: boolean;
  onChange: (bills: Bill[]) => void;
}) {
  const { household, user } = useAuth();
  const [sheet, setSheet] = useState<BillSheetMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dueDayInput, setDueDayInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [defaultPocketId, setDefaultPocketId] = useState("");
  const [defaultAttribution, setDefaultAttribution] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expenseCategories = categoriesForKind(categories, "expense");
  const visiblePockets = activePockets(pockets);
  const partner = user ? partnerMember(members, user.id) : undefined;
  const activeBills = bills.filter((bill) => bill.isActive);
  const inactiveBills = bills.filter((bill) => !bill.isActive);

  const attributionOptions = [
    { value: user?.id ?? "", label: "Me" },
    ...(partner ? [{ value: partner.user_id, label: partner.username }] : []),
    { value: FAMILY_ATTRIBUTION_ID, label: "Family" },
  ];

  function openAdd() {
    setName("");
    setAmountInput("");
    setDueDayInput("");
    setCategoryId(expenseCategories[0]?.id ?? "");
    setDefaultPocketId("");
    setDefaultAttribution(user?.id ?? "");
    setIsActive(true);
    setError(null);
    setSheet({ kind: "add" });
  }

  function openEdit(bill: Bill) {
    setName(bill.name);
    setAmountInput(bill.amountYen != null ? formatYenDigits(bill.amountYen) : "");
    setDueDayInput(String(bill.dueDay));
    setCategoryId(bill.categoryId);
    setDefaultPocketId(bill.defaultPocketId ?? "");
    setDefaultAttribution(
      bill.defaultAttributedMemberId === null
        ? FAMILY_ATTRIBUTION_ID
        : (bill.defaultAttributedMemberId ?? user?.id ?? ""),
    );
    setIsActive(bill.isActive);
    setError(null);
    setSheet({ kind: "edit", bill });
  }

  function closeSheet() {
    setSheet({ kind: "closed" });
    setError(null);
  }

  function defaultAttributedMemberIdFromPicker(): string | null {
    if (defaultAttribution === FAMILY_ATTRIBUTION_ID) {
      return null;
    }
    return defaultAttribution || null;
  }

  async function handleSave() {
    if (!household) {
      return;
    }

    const dueDay = Number(dueDayInput);
    const amountYen = amountInput.trim() ? parseYenInput(amountInput) : null;
    if (amountInput.trim() && amountYen == null) {
      setError(validateBillAmount(0));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      if (sheet.kind === "add") {
        const created = await createBill({
          householdId: household.id,
          name,
          amountYen,
          dueDay,
          categoryId,
          defaultPocketId: defaultPocketId || null,
          defaultAttributedMemberId: defaultAttributedMemberIdFromPicker(),
          isActive,
        });
        onChange([...bills, created]);
      } else if (sheet.kind === "edit") {
        const updated = await updateBill(sheet.bill.id, {
          name,
          amountYen,
          dueDay,
          categoryId,
          defaultPocketId: defaultPocketId || null,
          defaultAttributedMemberId: defaultAttributedMemberIdFromPicker(),
          isActive,
        });
        onChange(bills.map((row) => (row.id === updated.id ? updated : row)));
      }
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save bill");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (sheet.kind !== "edit") {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await deleteBill(sheet.bill.id);
      onChange(bills.filter((row) => row.id !== sheet.bill.id));
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to delete bill");
    } finally {
      setBusy(false);
    }
  }

  const sheetOpen = sheet.kind !== "closed";

  function renderBillRow(bill: Bill, inactive = false) {
    const category = expenseCategories.find((row) => row.id === bill.categoryId);
    return (
      <ListRow key={bill.id} onClick={() => openEdit(bill)}>
        <div className={`min-w-0 flex-1 ${inactive ? "opacity-60" : ""}`}>
          <p className="truncate text-[17px] font-medium">{bill.name}</p>
          <p className="mt-0.5 text-[13px] text-neutral-500">
            Due day {bill.dueDay}
            {category ? ` · ${category.name}` : ""}
            {inactive ? " · Inactive" : ""}
          </p>
        </div>
        <span className="text-[20px] text-neutral-300">›</span>
      </ListRow>
    );
  }

  return (
    <>
      <GroupCard title="Active bills" footer="Monthly reminders on Home until marked paid.">
        <ListRow onClick={openAdd}>
          <span className="text-[17px] font-medium text-[#007aff]">+ Add bill</span>
        </ListRow>
        {loading ? (
          <EmptyState message="Loading bills…" />
        ) : (
          activeBills.map((bill) => renderBillRow(bill))
        )}
      </GroupCard>

      {inactiveBills.length > 0 ? (
        <GroupCard title="Inactive">
          {inactiveBills.map((bill) => renderBillRow(bill, true))}
        </GroupCard>
      ) : null}

      {error && !sheetOpen ? <ErrorNote message={error} /> : null}

      <SheetOverlay
        open={sheetOpen}
        onClose={closeSheet}
        title={sheet.kind === "edit" ? "Edit bill" : "Add bill"}
      >
        <Field label="Name">
          <TextField value={name} onChange={setName} placeholder="Rent" />
        </Field>
        <Field label="Amount (optional)">
          <YenAmountField value={amountInput} onChange={setAmountInput} />
        </Field>
        <Field label="Due day">
          <TextField
            value={dueDayInput}
            onChange={setDueDayInput}
            inputMode="numeric"
            placeholder="25"
          />
        </Field>
        <Field label="Category">
          <SelectField value={categoryId} onChange={setCategoryId} disabled={busy}>
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Default pocket">
          <SelectField
            value={defaultPocketId}
            onChange={setDefaultPocketId}
            disabled={busy}
          >
            <option value="">Choose on pay</option>
            {visiblePockets.map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Default attribution">
          <SelectField
            value={defaultAttribution}
            onChange={setDefaultAttribution}
            disabled={busy}
          >
            {attributionOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectField>
        </Field>
        {sheet.kind === "edit" ? (
          <Field label="Status">
            <CheckboxField
              checked={isActive}
              onChange={setIsActive}
              label="Active"
            />
          </Field>
        ) : null}
        {error ? <ErrorNote message={error} /> : null}
        <PrimaryAction disabled={busy} onClick={() => void handleSave()}>
          Save
        </PrimaryAction>
        {sheet.kind === "edit" ? (
          <PrimaryAction
            variant="destructive"
            disabled={busy}
            onClick={() => void handleDelete()}
          >
            Delete bill
          </PrimaryAction>
        ) : null}
      </SheetOverlay>
    </>
  );
}
