export function formatYen(amountYen: number): string {
  const sign = amountYen < 0 ? "−" : "";
  return `${sign}¥${Math.abs(amountYen).toLocaleString("ja-JP")}`;
}

export function parseYenInput(value: string): number | null {
  const normalized = value.replace(/[¥,\s]/g, "");
  if (!normalized || !/^\d+$/.test(normalized)) {
    return null;
  }

  const amountYen = Number(normalized);
  if (!Number.isSafeInteger(amountYen) || amountYen <= 0) {
    return null;
  }

  return amountYen;
}

export function formatYenInput(amountYen: number): string {
  return `¥${amountYen.toLocaleString("ja-JP")}`;
}

export function formatYenDigits(amountYen: number): string {
  return amountYen.toLocaleString("ja-JP");
}

export function formatYenInputLive(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) {
    return "";
  }

  return Number(digits).toLocaleString("ja-JP");
}

export function todayInTokyo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function currentMonthInTokyo(now = new Date()): {
  year: number;
  month: number;
  label: string;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    month: "long",
    year: "numeric",
  }).format(now);

  return { year, month, label };
}

function parseCalendarDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatCalendarDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addCalendarDays(date: string, days: number): string {
  const next = parseCalendarDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatCalendarDate(next);
}

export function yesterdayInTokyo(now = new Date()): string {
  return addCalendarDays(todayInTokyo(now), -1);
}

export function weekdayIndex(date: string): number {
  return parseCalendarDate(date).getUTCDay();
}

export function weekStartForDate(date: string): string {
  const weekday = weekdayIndex(date);
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  return addCalendarDays(date, mondayOffset);
}

export function currentWeekRangeInTokyo(now = new Date()): {
  start: string;
  end: string;
} {
  const end = todayInTokyo(now);
  return { start: weekStartForDate(end), end };
}

export function previousWeekRangeInTokyo(now = new Date()): {
  start: string;
  end: string;
} {
  const end = todayInTokyo(now);
  const thisWeekStart = weekStartForDate(end);
  const previousEnd = addCalendarDays(thisWeekStart, -1);
  return { start: weekStartForDate(previousEnd), end: previousEnd };
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function formatYenCompact(amountYen: number): string {
  if (amountYen >= 10_000) {
    const man = amountYen / 10_000;
    return `¥${Number.isInteger(man) ? man : man.toFixed(1)}万`;
  }
  if (amountYen >= 1_000) {
    const kilo = amountYen / 1_000;
    return `¥${Number.isInteger(kilo) ? kilo : kilo.toFixed(1)}K`;
  }
  return formatYen(amountYen);
}
