import { currentMonthInTokyo } from "@/lib/format-yen";
import type { EntryFilter } from "@/ledger/types";

export function defaultEntryFilter(now = new Date()): EntryFilter {
  const { year, month } = currentMonthInTokyo(now);
  return { year, month };
}

export function isCustomDateRange(filter: EntryFilter): boolean {
  return filter.startDate != null && filter.endDate != null;
}

export function formatDateRangeLabel(startDate: string, endDate: string): string {
  const format = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, month - 1, day)));
  };

  if (startDate === endDate) {
    return format(startDate);
  }

  return `${format(startDate)} – ${format(endDate)}`;
}
