import { getSupabase } from "@/lib/supabase";
import {
  normalizeBudgetCycleConfig,
  setBudgetCycleConfig,
  validateBudgetCycleConfig,
} from "@/lib/budget-cycle-config";

const householdSelect =
  "id, name, budget_cycle_start_day, budget_cycle_end_day";

export type HouseholdSummary = {
  id: string;
  name: string;
  budgetCycleStartDay: number;
  budgetCycleEndDay: number;
};

export async function fetchHousehold(): Promise<HouseholdSummary | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("households")
    .select(householdSelect)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  const normalized = normalizeBudgetCycleConfig(
    data.budget_cycle_start_day ?? 1,
    data.budget_cycle_end_day ?? 31,
  );

  return {
    id: data.id,
    name: data.name,
    budgetCycleStartDay: normalized.startDay,
    budgetCycleEndDay: normalized.endDay,
  };
}

export async function updateBudgetCycle(
  householdId: string,
  startDay: number,
  endDay: number,
): Promise<{ startDay: number; endDay: number }> {
  const configError = validateBudgetCycleConfig(startDay, endDay);
  if (configError) {
    throw new Error(configError);
  }

  const normalized = normalizeBudgetCycleConfig(startDay, endDay);

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("households")
    .update({
      budget_cycle_start_day: normalized.startDay,
      budget_cycle_end_day: normalized.endDay,
    })
    .eq("id", householdId)
    .select("budget_cycle_start_day, budget_cycle_end_day")
    .single();

  if (error) {
    throw error;
  }

  const config = {
    startDay: data.budget_cycle_start_day,
    endDay: data.budget_cycle_end_day,
  };
  setBudgetCycleConfig(config);
  return config;
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
