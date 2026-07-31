import type { Entry, EntryKind } from "@/ledger/types";
import { balanceForPocket, pocketDeltaForEntry } from "@/ledger/ledger";
import { formatIdr } from "@/lib/format-idr";
import { addCalendarDays, formatYen } from "@/lib/format-yen";

export function formatEntryDate(entryDate: string): string {
  const [year, month, day] = entryDate.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function netTone(netYen: number): string {
  if (netYen > 0) {
    return "text-[#34c759]";
  }
  if (netYen < 0) {
    return "text-[#ff3b30]";
  }
  return "text-neutral-900";
}

export function entryAmountTone(kind: EntryKind): string {
  if (kind === "transfer") {
    return "text-[#007aff]";
  }
  return kind === "income" ? "text-[#34c759]" : "text-[#ff3b30]";
}

export function formatSignedEntryYen(entry: Pick<Entry, "kind" | "amountYen">): string {
  if (entry.kind === "transfer") {
    return formatYen(entry.amountYen);
  }
  return formatYen(
    entry.kind === "expense" ? -entry.amountYen : entry.amountYen,
  );
}

export function formatTransferLabel(
  fromName: string,
  toName: string,
): string {
  return `${fromName} → ${toName}`;
}

export function formatEntryForeignIdr(
  entry: Pick<Entry, "foreignAmountIdr">,
): string | null {
  if (entry.foreignAmountIdr == null) {
    return null;
  }

  return formatIdr(entry.foreignAmountIdr);
}

export function formatDayGroupHeader(date: string, today: string): string {
  if (date === today) {
    return "Today";
  }

  const yesterday = addCalendarDays(today, -1);
  if (date === yesterday) {
    return "Yesterday";
  }

  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(utcDate);
  const dayMonth = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(utcDate);

  return `${weekday} ${dayMonth}`;
}

export function formatDailyNetYen(netYen: number): string {
  if (netYen === 0) {
    return formatYen(0);
  }
  return formatYen(netYen);
}

export function formatRemainingBudget(remainingYen: number): string {
  if (remainingYen >= 0) {
    return `${formatYen(remainingYen)} left`;
  }

  return `${formatYen(Math.abs(remainingYen))} over`;
}

export function pocketBalanceForEntryForm(
  entries: readonly Entry[],
  pocketId: string,
  editingEntry: Entry | null,
): number {
  const balanceYen = balanceForPocket([...entries], pocketId);
  if (!editingEntry) {
    return balanceYen;
  }

  return balanceYen - pocketDeltaForEntry(editingEntry, pocketId);
}

export function expensePocketBalanceWarning(
  balanceYen: number,
  amountYen: number | null,
): string | null {
  if (balanceYen <= 0) {
    return "This pocket is empty or overdrawn.";
  }

  if (amountYen != null && amountYen > balanceYen) {
    return `This expense exceeds the pocket balance by ${formatYen(amountYen - balanceYen)}.`;
  }

  return null;
}
