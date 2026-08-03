import { addCalendarDays, formatMonthLabel, shiftMonth, todayInTokyo } from "@/lib/format-yen";
import {
  getBudgetCycleConfig,
  isCalendarMonthCycle,
  LAST_DAY_OF_MONTH,
  type BudgetCycleConfig,
} from "@/lib/budget-cycle-config";

export { LAST_DAY_OF_MONTH as BUDGET_CYCLE_END_OF_MONTH };

export type BudgetCycle = {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
  label: string;
};

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDay(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function effectiveEndDay(year: number, month: number, endDay: number): number {
  if (endDay === LAST_DAY_OF_MONTH) {
    return daysInMonth(year, month);
  }
  return Math.min(endDay, daysInMonth(year, month));
}

function resolveConfig(config?: Partial<BudgetCycleConfig>): BudgetCycleConfig {
  const current = getBudgetCycleConfig();
  return {
    startDay: config?.startDay ?? current.startDay,
    endDay: config?.endDay ?? current.endDay,
  };
}

function formatShortDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatBudgetCycleLabel(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} – ${formatShortDate(endDate)}`;
}

export function budgetCycleDateRange(
  year: number,
  month: number,
  config?: Partial<BudgetCycleConfig>,
): { startDate: string; endDate: string } {
  const { startDay, endDay } = resolveConfig(config);

  if (isCalendarMonthCycle({ startDay, endDay })) {
    const lastDay = daysInMonth(year, month);
    return {
      startDate: formatDay(year, month, 1),
      endDate: formatDay(year, month, lastDay),
    };
  }

  const startDate = formatDay(year, month, startDay);

  if (startDay <= endDay) {
    return {
      startDate,
      endDate: formatDay(year, month, effectiveEndDay(year, month, endDay)),
    };
  }

  const next = shiftMonth(year, month, 1);
  return {
    startDate,
    endDate: formatDay(next.year, next.month, effectiveEndDay(next.year, next.month, endDay)),
  };
}

export function payMonthForDate(
  date: string,
  config?: Partial<BudgetCycleConfig>,
): { year: number; month: number } {
  const [year, month] = date.split("-").map(Number);
  const candidates = [
    { year, month },
    shiftMonth(year, month, -1),
    shiftMonth(year, month, 1),
  ];

  for (const candidate of candidates) {
    const { startDate, endDate } = budgetCycleDateRange(
      candidate.year,
      candidate.month,
      config,
    );
    if (date >= startDate && date <= endDate) {
      return candidate;
    }
  }

  return { year, month };
}

export function currentBudgetCycleInTokyo(now = new Date()): BudgetCycle {
  const today = todayInTokyo(now);
  const { year, month } = payMonthForDate(today);
  const { startDate, endDate } = budgetCycleDateRange(year, month);
  return {
    year,
    month,
    startDate,
    endDate,
    label: `${formatMonthLabel(year, month)} · ${formatBudgetCycleLabel(startDate, endDate)}`,
  };
}

export function entryInBudgetCycle(
  entryDate: string,
  year: number,
  month: number,
  config?: Partial<BudgetCycleConfig>,
): boolean {
  const { startDate, endDate } = budgetCycleDateRange(year, month, config);
  return entryDate >= startDate && entryDate <= endDate;
}

function daysBetweenInclusive(startDate: string, endDate: string): number {
  if (endDate < startDate) {
    return 0;
  }

  let count = 0;
  let cursor = startDate;
  while (cursor <= endDate) {
    count += 1;
    cursor = addCalendarDays(cursor, 1);
  }
  return count;
}

export function budgetCycleDayStats(
  year: number,
  month: number,
  today: string,
  config?: Partial<BudgetCycleConfig>,
): {
  totalDays: number;
  daysElapsed: number;
  daysLeft: number;
  inCycle: boolean;
} {
  const { startDate, endDate } = budgetCycleDateRange(year, month, config);
  const totalDays = daysBetweenInclusive(startDate, endDate);
  const inCycle = today >= startDate && today <= endDate;

  if (!inCycle) {
    if (today < startDate) {
      return { totalDays, daysElapsed: 0, daysLeft: totalDays, inCycle: false };
    }
    return { totalDays, daysElapsed: totalDays, daysLeft: 0, inCycle: false };
  }

  return {
    totalDays,
    daysElapsed: daysBetweenInclusive(startDate, today),
    daysLeft: daysBetweenInclusive(today, endDate),
    inCycle: true,
  };
}

export function budgetCyclePeriodKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function budgetCycleLabel(
  year: number,
  month: number,
  config?: Partial<BudgetCycleConfig>,
): string {
  const { startDate, endDate } = budgetCycleDateRange(year, month, config);
  return `${formatMonthLabel(year, month)} · ${formatBudgetCycleLabel(startDate, endDate)}`;
}

export function budgetCyclePickerOptions(
  endYear: number,
  endMonth: number,
  count = 24,
  config?: Partial<BudgetCycleConfig>,
): Array<{ year: number; month: number; label: string; value: string }> {
  const options: Array<{ year: number; month: number; label: string; value: string }> =
    [];
  let year = endYear;
  let month = endMonth;

  for (let index = 0; index < count; index += 1) {
    options.push({
      year,
      month,
      label: budgetCycleLabel(year, month, config),
      value: budgetCyclePeriodKey(year, month),
    });
    ({ year, month } = shiftMonth(year, month, -1));
  }

  return options;
}

export function formatBudgetCycleEndDayLabel(endDay: number): string {
  return endDay === LAST_DAY_OF_MONTH ? "Last day of month" : String(endDay);
}