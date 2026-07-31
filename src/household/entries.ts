import { getSupabase } from "@/lib/supabase";
import type { Entry, EntryKind } from "@/ledger/types";

type EntryRow = {
  id: string;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  member_id: string;
  attributed_member_id: string | null;
  kind: EntryKind;
  amount_yen: number;
  foreign_amount_idr: number | null;
  entry_date: string;
  note: string | null;
  created_at: string;
};

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    pocketId: row.account_id,
    toPocketId: row.to_account_id,
    categoryId: row.category_id,
    memberId: row.member_id,
    attributedMemberId: row.attributed_member_id,
    kind: row.kind,
    amountYen: row.amount_yen,
    foreignAmountIdr: row.foreign_amount_idr,
    entryDate: row.entry_date,
    note: row.note,
    createdAt: row.created_at,
  };
}

const entrySelect =
  "id, account_id, to_account_id, category_id, member_id, attributed_member_id, kind, amount_yen, foreign_amount_idr, entry_date, note, created_at";

export async function fetchEntries(): Promise<Entry[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("entries")
    .select(entrySelect)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapEntry);
}

function normalizeNote(note?: string | null): string | null {
  const trimmed = note?.trim();
  return trimmed ? trimmed : null;
}

export async function createEntry(params: {
  householdId: string;
  memberId: string;
  attributedMemberId: string | null;
  kind: Exclude<EntryKind, "transfer">;
  amountYen: number;
  foreignAmountIdr?: number | null;
  pocketId: string;
  categoryId: string;
  entryDate: string;
  note?: string | null;
}): Promise<Entry> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("entries")
    .insert({
      household_id: params.householdId,
      member_id: params.memberId,
      attributed_member_id: params.attributedMemberId,
      kind: params.kind,
      amount_yen: params.amountYen,
      foreign_amount_idr: params.foreignAmountIdr ?? null,
      account_id: params.pocketId,
      category_id: params.categoryId,
      entry_date: params.entryDate,
      note: normalizeNote(params.note),
    })
    .select(entrySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create entry");
  }

  return mapEntry(data);
}

export async function createTransfer(params: {
  householdId: string;
  memberId: string;
  amountYen: number;
  fromPocketId: string;
  toPocketId: string;
  entryDate: string;
  note?: string | null;
}): Promise<Entry> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("entries")
    .insert({
      household_id: params.householdId,
      member_id: params.memberId,
      attributed_member_id: params.memberId,
      kind: "transfer",
      amount_yen: params.amountYen,
      foreign_amount_idr: null,
      account_id: params.fromPocketId,
      to_account_id: params.toPocketId,
      category_id: null,
      entry_date: params.entryDate,
      note: normalizeNote(params.note),
    })
    .select(entrySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create transfer");
  }

  return mapEntry(data);
}

export async function updateEntry(
  entryId: string,
  updates: {
    kind: Exclude<EntryKind, "transfer">;
    amountYen: number;
    foreignAmountIdr: number | null;
    pocketId: string;
    categoryId: string;
    attributedMemberId: string | null;
    entryDate: string;
    note?: string | null;
  },
): Promise<Entry> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("entries")
    .update({
      kind: updates.kind,
      amount_yen: updates.amountYen,
      foreign_amount_idr: updates.foreignAmountIdr,
      account_id: updates.pocketId,
      category_id: updates.categoryId,
      attributed_member_id: updates.attributedMemberId,
      entry_date: updates.entryDate,
      note: normalizeNote(updates.note),
    })
    .eq("id", entryId)
    .select(entrySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update entry");
  }

  return mapEntry(data);
}

export async function updateTransfer(
  entryId: string,
  updates: {
    amountYen: number;
    fromPocketId: string;
    toPocketId: string;
    entryDate: string;
    note?: string | null;
  },
): Promise<Entry> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("entries")
    .update({
      kind: "transfer",
      amount_yen: updates.amountYen,
      foreign_amount_idr: null,
      account_id: updates.fromPocketId,
      to_account_id: updates.toPocketId,
      category_id: null,
      entry_date: updates.entryDate,
      note: normalizeNote(updates.note),
    })
    .eq("id", entryId)
    .select(entrySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update transfer");
  }

  return mapEntry(data);
}

export async function deleteEntry(entryId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("entries").delete().eq("id", entryId);

  if (error) {
    throw error;
  }
}
