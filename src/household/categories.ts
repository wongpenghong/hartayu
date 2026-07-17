import { getSupabase } from "@/lib/supabase";

export type Category = {
  id: string;
  household_id: string;
  name: string;
  kind: "expense" | "income";
  is_starter: boolean;
};

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

export async function fetchCategories(): Promise<Category[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, household_id, name, kind, is_starter")
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
): Promise<Category> {
  const nameError = validateCategoryName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .insert({
      household_id: householdId,
      name: name.trim(),
      kind,
      is_starter: false,
    })
    .select("id, household_id, name, kind, is_starter")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create category");
  }

  return data;
}

export async function renameCategory(
  categoryId: string,
  name: string,
): Promise<Category> {
  const nameError = validateCategoryName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .update({ name: name.trim() })
    .eq("id", categoryId)
    .eq("is_starter", false)
    .select("id, household_id, name, kind, is_starter")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to rename category");
  }

  return data;
}
