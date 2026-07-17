import { getSupabase } from "@/lib/supabase";

export async function bootstrapOwnerHousehold(
  householdName = "Our household",
): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("bootstrap_owner_household", {
    household_name: householdName,
  });

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Household bootstrap returned no id");
  }

  return data;
}

export async function fetchHousehold(): Promise<{
  id: string;
  name: string;
} | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("households")
    .select("id, name")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function fetchStarterCategories(): Promise<
  { id: string; name: string; kind: "expense" | "income" }[]
> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, kind")
    .eq("is_starter", true)
    .order("kind")
    .order("name");

  if (error) {
    throw error;
  }

  return data ?? [];
}
