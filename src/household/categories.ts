import { normalizeEmoji, validateEmoji } from "@/household/emoji-utils";
import {
  isBudgetGroup,
  validateBudgetGroup,
  type BudgetGroup,
} from "@/household/budget-groups";
import { getSupabase } from "@/lib/supabase";

export type Category = {
  id: string;
  household_id: string;
  name: string;
  kind: "expense" | "income";
  is_starter: boolean;
  monthly_limit_yen: number | null;
  budget_group: BudgetGroup | null;
  emoji: string | null;
};

const categorySelect =
  "id, household_id, name, kind, is_starter, monthly_limit_yen, budget_group, emoji";

export function validateCategoryName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Category name is required.";
  }
  if (trimmed.length > 40) {
    return "Category name must be 40 characters or fewer.";
  }
  return null;
}

export function validateCategoryLimit(limitYen: number | null): string | null {
  if (limitYen == null) {
    return null;
  }
  if (!Number.isSafeInteger(limitYen) || limitYen <= 0) {
    return "Budget must be a positive whole yen amount.";
  }
  return null;
}

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select(categorySelect)
    .order("kind")
    .order("is_starter", { ascending: false })
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createCategory(
  householdId: string,
  name: string,
  kind: "expense" | "income",
  emoji: string | null = null,
  budgetGroup: BudgetGroup | null = null,
): Promise<Category> {
  const nameError = validateCategoryName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const emojiError = validateEmoji(emoji);
  if (emojiError) {
    throw new Error(emojiError);
  }

  const budgetGroupError = validateBudgetGroup(budgetGroup);
  if (budgetGroupError) {
    throw new Error(budgetGroupError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_id: householdId,
      name: name.trim(),
      kind,
      is_starter: false,
      emoji: normalizeEmoji(emoji),
      budget_group: kind === "expense" ? budgetGroup : null,
    })
    .select(categorySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create category");
  }

  return data;
}

export async function updateCategoryEmoji(
  categoryId: string,
  emoji: string | null,
): Promise<Category> {
  const emojiError = validateEmoji(emoji);
  if (emojiError) {
    throw new Error(emojiError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .update({ emoji: normalizeEmoji(emoji) })
    .eq("id", categoryId)
    .select(categorySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update category icon");
  }

  return data;
}

export async function updateCategoryBudgetGroup(
  categoryId: string,
  budgetGroup: BudgetGroup | null,
): Promise<Category> {
  const budgetGroupError = validateBudgetGroup(budgetGroup);
  if (budgetGroupError) {
    throw new Error(budgetGroupError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .update({ budget_group: budgetGroup })
    .eq("id", categoryId)
    .eq("kind", "expense")
    .select(categorySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update category budget group");
  }

  return data;
}

export async function renameCategory(
  categoryId: string,
  name: string,
  emoji?: string | null,
): Promise<Category> {
  const nameError = validateCategoryName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  if (emoji !== undefined) {
    const emojiError = validateEmoji(emoji);
    if (emojiError) {
      throw new Error(emojiError);
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .update({
      name: name.trim(),
      ...(emoji !== undefined ? { emoji: normalizeEmoji(emoji) } : {}),
    })
    .eq("id", categoryId)
    .eq("is_starter", false)
    .select(categorySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to rename category");
  }

  return data;
}

export async function updateCategoryLimit(
  categoryId: string,
  monthlyLimitYen: number | null,
): Promise<Category> {
  const limitError = validateCategoryLimit(monthlyLimitYen);
  if (limitError) {
    throw new Error(limitError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .update({ monthly_limit_yen: monthlyLimitYen })
    .eq("id", categoryId)
    .select(categorySelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update category budget");
  }

  return data;
}

export function categoryBudgetGroup(
  category: Pick<Category, "budget_group">,
): BudgetGroup | null {
  return isBudgetGroup(category.budget_group) ? category.budget_group : null;
}
