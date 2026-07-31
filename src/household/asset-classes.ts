import { getSupabase } from "@/lib/supabase";

export type AssetClass = {
  id: string;
  household_id: string;
  name: string;
  is_starter: boolean;
};

export function validateAssetClassName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Asset class name is required.";
  }
  if (trimmed.length > 40) {
    return "Asset class name must be 40 characters or fewer.";
  }
  return null;
}

export async function fetchAssetClasses(): Promise<AssetClass[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("asset_classes")
    .select("id, household_id, name, is_starter")
    .order("is_starter", { ascending: false })
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createAssetClass(
  householdId: string,
  name: string,
): Promise<AssetClass> {
  const nameError = validateAssetClassName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("asset_classes")
    .insert({
      household_id: householdId,
      name: name.trim(),
      is_starter: false,
    })
    .select("id, household_id, name, is_starter")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create asset class");
  }

  return data;
}

export async function renameAssetClass(
  assetClassId: string,
  name: string,
): Promise<AssetClass> {
  const nameError = validateAssetClassName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("asset_classes")
    .update({ name: name.trim() })
    .eq("id", assetClassId)
    .eq("is_starter", false)
    .select("id, household_id, name, is_starter")
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to rename asset class");
  }

  return data;
}

export async function deleteAssetClass(assetClassId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("asset_classes")
    .delete()
    .eq("id", assetClassId)
    .eq("is_starter", false);

  if (error) {
    throw error;
  }
}
