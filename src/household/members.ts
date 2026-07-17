import { getSupabase } from "@/lib/supabase";

export type HouseholdMember = {
  user_id: string;
  username: string;
};

export async function fetchHouseholdMembers(): Promise<HouseholdMember[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("list_household_members");

  if (error) {
    throw error;
  }

  return data ?? [];
}
