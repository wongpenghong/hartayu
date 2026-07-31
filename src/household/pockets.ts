import { normalizeEmoji, validateEmoji } from "@/household/emoji-utils";
import { getSupabase } from "@/lib/supabase";

export type Pocket = {
  id: string;
  household_id: string;
  name: string;
  primary_member_id: string | null;
  archived_at: string | null;
  emoji: string | null;
};

export function validatePocketName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Pocket name is required.";
  }
  if (trimmed.length > 40) {
    return "Pocket name must be 40 characters or fewer.";
  }
  return null;
}

export async function fetchPockets(): Promise<Pocket[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("accounts")
    .select("id, household_id, name, primary_member_id, archived_at, emoji")
    .order("archived_at", { ascending: true, nullsFirst: true })
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createPocket(
  householdId: string,
  name: string,
  primaryMemberId: string | null = null,
  emoji: string | null = null,
): Promise<Pocket> {
  const nameError = validatePocketName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const emojiError = validateEmoji(emoji);
  if (emojiError) {
    throw new Error(emojiError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      household_id: householdId,
      name: name.trim(),
      primary_member_id: primaryMemberId,
      emoji: normalizeEmoji(emoji),
    })
    .select("id, household_id, name, primary_member_id, archived_at, emoji")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create pocket");
  }

  return data;
}

export async function updatePocket(
  pocketId: string,
  updates: {
    name?: string;
    primary_member_id?: string | null;
    archived_at?: string | null;
    emoji?: string | null;
  },
): Promise<Pocket> {
  if (updates.name !== undefined) {
    const nameError = validatePocketName(updates.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  if (updates.emoji !== undefined) {
    const emojiError = validateEmoji(updates.emoji);
    if (emojiError) {
      throw new Error(emojiError);
    }
  }

  const payload = {
    ...updates,
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.emoji !== undefined ? { emoji: normalizeEmoji(updates.emoji) } : {}),
  };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("accounts")
    .update(payload)
    .eq("id", pocketId)
    .select("id, household_id, name, primary_member_id, archived_at, emoji")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update pocket");
  }

  return data;
}

export async function archivePocket(pocketId: string): Promise<Pocket> {
  return updatePocket(pocketId, { archived_at: new Date().toISOString() });
}

export async function unarchivePocket(pocketId: string): Promise<Pocket> {
  return updatePocket(pocketId, { archived_at: null });
}
