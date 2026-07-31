export type BudgetGroup = "needs" | "wants" | "savings";

export const BUDGET_GROUP_ORDER: BudgetGroup[] = ["needs", "wants", "savings"];

export const BUDGET_GROUP_LABELS: Record<BudgetGroup, string> = {
  needs: "Needs",
  wants: "Wants",
  savings: "Savings",
};

export function isBudgetGroup(value: string | null | undefined): value is BudgetGroup {
  return value === "needs" || value === "wants" || value === "savings";
}

export function validateBudgetGroup(value: string | null): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (!isBudgetGroup(value)) {
    return "Choose Needs, Wants, Savings, or leave blank.";
  }

  return null;
}

export function budgetGroupLabel(group: BudgetGroup | null): string {
  if (group == null) {
    return "Other";
  }

  return BUDGET_GROUP_LABELS[group];
}
