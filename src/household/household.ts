import { getSupabase } from "@/lib/supabase";

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
