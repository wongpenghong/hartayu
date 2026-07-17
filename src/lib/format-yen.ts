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
