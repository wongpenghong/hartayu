export const DEFAULT_BUDGET_CYCLE_START_DAY = 1;
export const DEFAULT_BUDGET_CYCLE_END_DAY = 31;
export const LAST_DAY_OF_MONTH = 31;

export type BudgetCycleConfig = {
  startDay: number;
  endDay: number;
};

let budgetCycleConfig: BudgetCycleConfig = {
  startDay: DEFAULT_BUDGET_CYCLE_START_DAY,
  endDay: DEFAULT_BUDGET_CYCLE_END_DAY,
};

export function getBudgetCycleConfig(): BudgetCycleConfig {
  return budgetCycleConfig;
}

export function getBudgetCycleStartDay(): number {
  return budgetCycleConfig.startDay;
}

export function getBudgetCycleEndDay(): number {
  return budgetCycleConfig.endDay;
}

export function setBudgetCycleConfig(config: BudgetCycleConfig): void {
  budgetCycleConfig = config;
}

export function setBudgetCycleStartDay(day: number): void {
  budgetCycleConfig = { ...budgetCycleConfig, startDay: day };
}

export function validateBudgetCycleDay(
  day: number,
  maxDay: number,
  label: string,
): string | null {
  if (!Number.isInteger(day) || day < 1 || day > maxDay) {
    return `${label} must be between 1 and ${maxDay}.`;
  }
  return null;
}

export function validateBudgetCycleConfig(
  startDay: number,
  endDay: number,
): string | null {
  const startError = validateBudgetCycleDay(startDay, 28, "Start day");
  if (startError) {
    return startError;
  }

  const endError = validateBudgetCycleDay(endDay, LAST_DAY_OF_MONTH, "End day");
  if (endError) {
    return endError;
  }

  if (startDay === endDay) {
    return "Start and end day must be different.";
  }

  return null;
}

export function isCalendarMonthCycle(config: BudgetCycleConfig): boolean {
  return config.startDay === 1 && config.endDay === LAST_DAY_OF_MONTH;
}

export function defaultEndDayForStart(startDay: number): number {
  if (startDay === 1) {
    return LAST_DAY_OF_MONTH;
  }
  return startDay - 1;
}

export function normalizeBudgetCycleConfig(
  startDay: number,
  endDay: number,
): BudgetCycleConfig {
  if (startDay === 1) {
    return { startDay: 1, endDay: LAST_DAY_OF_MONTH };
  }

  if (endDay === LAST_DAY_OF_MONTH || endDay >= startDay) {
    return { startDay, endDay: startDay - 1 };
  }

  return { startDay, endDay };
}
