import type { Entry, EntryKind } from "@/ledger/types";
import { formatYen } from "@/lib/format-yen";

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
  return kind === "income" ? "text-[#34c759]" : "text-[#ff3b30]";
}

export function formatSignedEntryYen(entry: Pick<Entry, "kind" | "amountYen">): string {
  return formatYen(
    entry.kind === "expense" ? -entry.amountYen : entry.amountYen,
  );
}
