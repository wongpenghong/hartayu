import { normalizeEmoji, validateEmoji } from "@/household/emoji-utils";
import { getSupabase } from "@/lib/supabase";
import type { Goal, GoalContribution } from "@/ledger/types";

export type GoalRow = {
  id: string;
  household_id: string;
  name: string;
  target_amount_yen: number;
  target_date: string | null;
  linked_account_id: string | null;
  emoji: string | null;
  created_at: string;
};

export type GoalContributionRow = {
  id: string;
  goal_id: string;
  household_id: string;
  member_id: string;
  amount_yen: number;
  contribution_date: string;
  note: string | null;
  created_at: string;
};

function mapGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    targetAmountYen: row.target_amount_yen,
    targetDate: row.target_date,
    linkedPocketId: row.linked_account_id,
    emoji: row.emoji,
    createdAt: row.created_at,
  };
}

function mapContribution(row: GoalContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    memberId: row.member_id,
    amountYen: row.amount_yen,
    contributionDate: row.contribution_date,
    note: row.note,
    createdAt: row.created_at,
  };
}

const goalSelect =
  "id, household_id, name, target_amount_yen, target_date, linked_account_id, emoji, created_at";

const contributionSelect =
  "id, goal_id, household_id, member_id, amount_yen, contribution_date, note, created_at";

export function validateGoalName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Goal name is required.";
  }
  if (trimmed.length > 40) {
    return "Goal name must be 40 characters or fewer.";
  }
  return null;
}

export function validateGoalTarget(targetAmountYen: number | null): string | null {
  if (targetAmountYen == null || !Number.isSafeInteger(targetAmountYen)) {
    return "Enter a positive target amount in yen.";
  }
  if (targetAmountYen <= 0) {
    return "Enter a positive target amount in yen.";
  }
  return null;
}

export function validateContributionAmount(amountYen: number | null): string | null {
  if (amountYen == null || !Number.isSafeInteger(amountYen) || amountYen <= 0) {
    return "Enter a positive amount in yen.";
  }
  return null;
}

export async function fetchGoals(): Promise<Goal[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goals")
    .select(goalSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapGoal);
}

export async function fetchGoalContributions(): Promise<GoalContribution[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goal_contributions")
    .select(contributionSelect)
    .order("contribution_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapContribution);
}

export async function createGoal(params: {
  householdId: string;
  name: string;
  targetAmountYen: number;
  targetDate?: string | null;
  linkedPocketId?: string | null;
  emoji?: string | null;
}): Promise<Goal> {
  const nameError = validateGoalName(params.name);
  if (nameError) {
    throw new Error(nameError);
  }

  const targetError = validateGoalTarget(params.targetAmountYen);
  if (targetError) {
    throw new Error(targetError);
  }

  const emojiError = validateEmoji(params.emoji);
  if (emojiError) {
    throw new Error(emojiError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goals")
    .insert({
      household_id: params.householdId,
      name: params.name.trim(),
      target_amount_yen: params.targetAmountYen,
      target_date: params.targetDate ?? null,
      linked_account_id: params.linkedPocketId ?? null,
      emoji: normalizeEmoji(params.emoji),
    })
    .select(goalSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create goal");
  }

  return mapGoal(data);
}

export async function updateGoal(
  goalId: string,
  updates: {
    name?: string;
    targetAmountYen?: number;
    targetDate?: string | null;
    linkedPocketId?: string | null;
    emoji?: string | null;
  },
): Promise<Goal> {
  if (updates.name !== undefined) {
    const nameError = validateGoalName(updates.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  if (updates.targetAmountYen !== undefined) {
    const targetError = validateGoalTarget(updates.targetAmountYen);
    if (targetError) {
      throw new Error(targetError);
    }
  }

  if (updates.emoji !== undefined) {
    const emojiError = validateEmoji(updates.emoji);
    if (emojiError) {
      throw new Error(emojiError);
    }
  }

  const payload = {
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.targetAmountYen !== undefined
      ? { target_amount_yen: updates.targetAmountYen }
      : {}),
    ...(updates.targetDate !== undefined ? { target_date: updates.targetDate } : {}),
    ...(updates.linkedPocketId !== undefined
      ? { linked_account_id: updates.linkedPocketId }
      : {}),
    ...(updates.emoji !== undefined
      ? { emoji: normalizeEmoji(updates.emoji) }
      : {}),
  };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goals")
    .update(payload)
    .eq("id", goalId)
    .select(goalSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update goal");
  }

  return mapGoal(data);
}

export async function deleteGoal(goalId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("goals").delete().eq("id", goalId);

  if (error) {
    throw error;
  }
}

export async function createGoalContribution(params: {
  householdId: string;
  goalId: string;
  memberId: string;
  amountYen: number;
  contributionDate: string;
  note?: string | null;
}): Promise<GoalContribution> {
  const amountError = validateContributionAmount(params.amountYen);
  if (amountError) {
    throw new Error(amountError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("goal_contributions")
    .insert({
      household_id: params.householdId,
      goal_id: params.goalId,
      member_id: params.memberId,
      amount_yen: params.amountYen,
      contribution_date: params.contributionDate,
      note: params.note?.trim() ? params.note.trim() : null,
    })
    .select(contributionSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to add contribution");
  }

  return mapContribution(data);
}

export async function deleteGoalContribution(contributionId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("goal_contributions")
    .delete()
    .eq("id", contributionId);

  if (error) {
    throw error;
  }
}
