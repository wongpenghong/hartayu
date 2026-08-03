import { FAMILY_ATTRIBUTION_ID } from "@/household/attribution";
import { getSupabase } from "@/lib/supabase";
import {
  budgetCycleLabel,
  budgetCyclePeriodKey,
  currentBudgetCycleInTokyo,
} from "@/lib/budget-cycle";
import type { Bill } from "@/ledger/types";

export type BillRow = {
  id: string;
  household_id: string;
  name: string;
  amount_yen: number | null;
  due_day: number;
  category_id: string;
  default_pocket_id: string | null;
  default_attributed_member_id: string | null;
  last_paid_period: string | null;
  is_active: boolean;
  created_at: string;
};

const billSelect =
  "id, household_id, name, amount_yen, due_day, category_id, default_pocket_id, default_attributed_member_id, last_paid_period, is_active, created_at";

function mapBill(row: BillRow): Bill {
  return {
    id: row.id,
    name: row.name,
    amountYen: row.amount_yen,
    dueDay: row.due_day,
    categoryId: row.category_id,
    defaultPocketId: row.default_pocket_id,
    defaultAttributedMemberId: row.default_attributed_member_id,
    lastPaidPeriod: row.last_paid_period,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export function validateBillName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Bill name is required.";
  }
  if (trimmed.length > 40) {
    return "Bill name must be 40 characters or fewer.";
  }
  return null;
}

export function validateDueDay(dueDay: number | null): string | null {
  if (dueDay == null || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
    return "Due day must be between 1 and 31.";
  }
  return null;
}

export function validateBillAmount(amountYen: number | null): string | null {
  if (amountYen == null) {
    return null;
  }
  if (!Number.isSafeInteger(amountYen) || amountYen <= 0) {
    return "Amount must be a positive whole yen amount.";
  }
  return null;
}

export function currentPeriodInTokyo(now = new Date()): string {
  const { year, month } = currentBudgetCycleInTokyo(now);
  return budgetCyclePeriodKey(year, month);
}

export function isBillUnpaid(bill: Bill, period: string): boolean {
  return bill.isActive && bill.lastPaidPeriod !== period;
}

export function isBillOverdue(bill: Bill, todayJst: string): boolean {
  const day = Number(todayJst.slice(8, 10));
  return day > bill.dueDay;
}

export function unpaidBillsForPeriod(bills: Bill[], period: string): Bill[] {
  return bills
    .filter((bill) => isBillUnpaid(bill, period))
    .sort(
      (left, right) =>
        left.dueDay - right.dueDay || left.name.localeCompare(right.name),
    );
}

export function billPayNote(name: string, year: number, month: number): string {
  return `${name.trim()} ${budgetCycleLabel(year, month)}`;
}

export function billAttributionPickerValue(
  bill: Pick<Bill, "defaultAttributedMemberId">,
  userId: string,
): string {
  if (bill.defaultAttributedMemberId === null) {
    return FAMILY_ATTRIBUTION_ID;
  }

  return bill.defaultAttributedMemberId ?? userId;
}

export async function fetchBills(): Promise<Bill[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bills")
    .select(billSelect)
    .order("due_day")
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapBill);
}

export async function createBill(params: {
  householdId: string;
  name: string;
  amountYen?: number | null;
  dueDay: number;
  categoryId: string;
  defaultPocketId?: string | null;
  defaultAttributedMemberId?: string | null;
  isActive?: boolean;
}): Promise<Bill> {
  const nameError = validateBillName(params.name);
  if (nameError) {
    throw new Error(nameError);
  }

  const dueDayError = validateDueDay(params.dueDay);
  if (dueDayError) {
    throw new Error(dueDayError);
  }

  const amountError = validateBillAmount(params.amountYen ?? null);
  if (amountError) {
    throw new Error(amountError);
  }

  if (!params.categoryId.trim()) {
    throw new Error("Choose a category.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bills")
    .insert({
      household_id: params.householdId,
      name: params.name.trim(),
      amount_yen: params.amountYen ?? null,
      due_day: params.dueDay,
      category_id: params.categoryId,
      default_pocket_id: params.defaultPocketId ?? null,
      default_attributed_member_id: params.defaultAttributedMemberId ?? null,
      is_active: params.isActive ?? true,
    })
    .select(billSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create bill");
  }

  return mapBill(data);
}

export async function updateBill(
  billId: string,
  updates: {
    name?: string;
    amountYen?: number | null;
    dueDay?: number;
    categoryId?: string;
    defaultPocketId?: string | null;
    defaultAttributedMemberId?: string | null;
    lastPaidPeriod?: string | null;
    isActive?: boolean;
  },
): Promise<Bill> {
  if (updates.name !== undefined) {
    const nameError = validateBillName(updates.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  if (updates.dueDay !== undefined) {
    const dueDayError = validateDueDay(updates.dueDay);
    if (dueDayError) {
      throw new Error(dueDayError);
    }
  }

  if (updates.amountYen !== undefined) {
    const amountError = validateBillAmount(updates.amountYen);
    if (amountError) {
      throw new Error(amountError);
    }
  }

  const payload = {
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.amountYen !== undefined ? { amount_yen: updates.amountYen } : {}),
    ...(updates.dueDay !== undefined ? { due_day: updates.dueDay } : {}),
    ...(updates.categoryId !== undefined ? { category_id: updates.categoryId } : {}),
    ...(updates.defaultPocketId !== undefined
      ? { default_pocket_id: updates.defaultPocketId }
      : {}),
    ...(updates.defaultAttributedMemberId !== undefined
      ? { default_attributed_member_id: updates.defaultAttributedMemberId }
      : {}),
    ...(updates.lastPaidPeriod !== undefined
      ? { last_paid_period: updates.lastPaidPeriod }
      : {}),
    ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
  };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bills")
    .update(payload)
    .eq("id", billId)
    .select(billSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update bill");
  }

  return mapBill(data);
}

export async function deleteBill(billId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("bills").delete().eq("id", billId);

  if (error) {
    throw error;
  }
}

export async function markBillPaid(
  billId: string,
  period = currentPeriodInTokyo(),
): Promise<Bill> {
  return updateBill(billId, { lastPaidPeriod: period });
}
