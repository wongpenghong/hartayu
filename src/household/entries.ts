import { getSupabase } from "@/lib/supabase";
import type { Entry, EntryKind } from "@/ledger/types";

type EntryRow = {
  id: string;
  account_id: string;
  category_id: string;
  member_id: string;
  kind: EntryKind;
  amount_yen: number;
  entry_date: string;
  note: string | null;
  created_at: string;
};

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    pocketId: row.account_id,
    categoryId: row.category_id,
    memberId: row.member_id,
    kind: row.kind,
    amountYen: row.amount_yen,
    entryDate: row.entry_date,
    note: row.note,
    createdAt: row.created_at,
  };
}

const entrySelect =
  "id, account_id, category_id, member_id, kind, amount_yen, entry_date, note, created_at";

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
  kind: EntryKind;
  amountYen: number;
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
      kind: params.kind,
      amount_yen: params.amountYen,
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

export async function updateEntry(
  entryId: string,
  updates: {
    kind: EntryKind;
    amountYen: number;
    pocketId: string;
    categoryId: string;
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
      account_id: updates.pocketId,
      category_id: updates.categoryId,
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

export async function deleteEntry(entryId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("entries").delete().eq("id", entryId);

  if (error) {
    throw error;
  }
}
