import {
  BUDGET_GROUP_ORDER,
  budgetGroupLabel,
  type BudgetGroup,
} from "@/household/budget-groups";
import { categoryBudgetGroup, validateCategoryLimit, type Category } from "@/household/categories";
import { formatYen } from "@/lib/format-yen";
import { getSupabase } from "@/lib/supabase";

type BudgetGroupLimitPatch = {
  needs_monthly_limit_yen?: number | null;
  wants_monthly_limit_yen?: number | null;
  savings_monthly_limit_yen?: number | null;
};

export type BudgetGroupLimits = Record<BudgetGroup, number | null>;

const emptyBudgetGroupLimits = (): BudgetGroupLimits => ({
  needs: null,
  wants: null,
  savings: null,
});

const budgetGroupLimitSelect =
  "needs_monthly_limit_yen, wants_monthly_limit_yen, savings_monthly_limit_yen";

export function sumCategoryLimitsByGroup(
  categories: readonly Pick<Category, "kind" | "budget_group" | "monthly_limit_yen">[],
): Record<BudgetGroup, number> {
  const totals: Record<BudgetGroup, number> = {
    needs: 0,
    wants: 0,
    savings: 0,
  };

  for (const category of categories) {
    if (category.kind !== "expense" || category.monthly_limit_yen == null) {
      continue;
    }

    const group = categoryBudgetGroup(category);
    if (group == null) {
      continue;
    }

    totals[group] += category.monthly_limit_yen;
  }

  return totals;
}

export function effectiveGroupLimitYen(
  group: BudgetGroup,
  explicitLimits: BudgetGroupLimits,
  allocatedYen: number,
): number {
  return explicitLimits[group] ?? allocatedYen;
}

export function groupOverAllocationYen(
  group: BudgetGroup,
  explicitLimits: BudgetGroupLimits,
  allocatedYen: number,
): number | null {
  const explicitLimitYen = explicitLimits[group];
  if (explicitLimitYen == null || allocatedYen <= explicitLimitYen) {
    return null;
  }

  return allocatedYen - explicitLimitYen;
}

export function formatOverAllocationWarning(
  group: BudgetGroup,
  overAllocationYen: number,
): string {
  return `${budgetGroupLabel(group)} over-allocated by ${formatYen(overAllocationYen)}`;
}

export function categoryLimitOverAllocationWarning(
  category: Pick<Category, "id" | "kind" | "budget_group">,
  monthlyLimitYen: number | null,
  categories: readonly Category[],
  explicitLimits: BudgetGroupLimits,
): string | null {
  if (category.kind !== "expense" || monthlyLimitYen == null) {
    return null;
  }

  const group = categoryBudgetGroup(category);
  if (group == null) {
    return null;
  }

  const allocatedByGroup = sumCategoryLimitsByGroup(
    categories.map((row) =>
      row.id === category.id
        ? { ...row, monthly_limit_yen: monthlyLimitYen }
        : row,
    ),
  );

  const overAllocationYen = groupOverAllocationYen(
    group,
    explicitLimits,
    allocatedByGroup[group],
  );

  return overAllocationYen == null
    ? null
    : formatOverAllocationWarning(group, overAllocationYen);
}

export type BudgetSectionRow = {
  category: Category;
  spentYen: number;
};

export type BudgetSection = {
  key: BudgetGroup | "other";
  title: string;
  spentYen: number;
  limitYen: number;
  overAllocationYen: number | null;
  showGroupCap: boolean;
  rows: BudgetSectionRow[];
};

export function buildBudgetSections(
  rows: readonly BudgetSectionRow[],
  explicitLimits: BudgetGroupLimits,
): BudgetSection[] {
  const grouped = new Map<BudgetGroup | "other", BudgetSectionRow[]>();
  const allocatedByGroup = sumCategoryLimitsByGroup(
    rows.map((row) => row.category),
  );

  for (const row of rows) {
    const group = categoryBudgetGroup(row.category) ?? "other";
    const bucket = grouped.get(group) ?? [];
    bucket.push(row);
    grouped.set(group, bucket);
  }

  const sections: BudgetSection[] = [];

  for (const group of BUDGET_GROUP_ORDER) {
    const groupRows = grouped.get(group) ?? [];
    const explicitLimitYen = explicitLimits[group];
    const shouldShow = groupRows.length > 0 || explicitLimitYen != null;
    if (!shouldShow) {
      continue;
    }

    sections.push({
      key: group,
      title: budgetGroupLabel(group),
      spentYen: groupRows.reduce((total, row) => total + row.spentYen, 0),
      limitYen: effectiveGroupLimitYen(
        group,
        explicitLimits,
        allocatedByGroup[group],
      ),
      overAllocationYen: groupOverAllocationYen(
        group,
        explicitLimits,
        allocatedByGroup[group],
      ),
      showGroupCap: true,
      rows: groupRows,
    });
  }

  const otherRows = grouped.get("other");
  if (otherRows?.length) {
    sections.push({
      key: "other",
      title: budgetGroupLabel(null),
      spentYen: otherRows.reduce((total, row) => total + row.spentYen, 0),
      limitYen: otherRows.reduce(
        (total, row) => total + (row.category.monthly_limit_yen ?? 0),
        0,
      ),
      overAllocationYen: null,
      showGroupCap: false,
      rows: otherRows,
    });
  }

  return sections;
}

export async function fetchBudgetGroupLimits(): Promise<BudgetGroupLimits> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("households")
    .select(budgetGroupLimitSelect)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return emptyBudgetGroupLimits();
  }

  return {
    needs: data.needs_monthly_limit_yen,
    wants: data.wants_monthly_limit_yen,
    savings: data.savings_monthly_limit_yen,
  };
}

export async function updateBudgetGroupLimit(
  group: BudgetGroup,
  monthlyLimitYen: number | null,
): Promise<BudgetGroupLimits> {
  const limitError = validateCategoryLimit(monthlyLimitYen);
  if (limitError) {
    throw new Error(limitError);
  }

  const patch: BudgetGroupLimitPatch =
    group === "needs"
      ? { needs_monthly_limit_yen: monthlyLimitYen }
      : group === "wants"
        ? { wants_monthly_limit_yen: monthlyLimitYen }
        : { savings_monthly_limit_yen: monthlyLimitYen };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("households")
    .update(patch)
    .select(budgetGroupLimitSelect)
    .maybeSingle();

  if (error || !data) {
    throw error ?? new Error("Failed to update budget group cap");
  }

  return {
    needs: data.needs_monthly_limit_yen,
    wants: data.wants_monthly_limit_yen,
    savings: data.savings_monthly_limit_yen,
  };
}
