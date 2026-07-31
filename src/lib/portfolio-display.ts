import { formatYen, formatYenCompact } from "@/lib/format-yen";

export type PnlTone = "gain" | "loss" | "flat" | "na";

export function pnlTone(pnlYen: number | null): PnlTone {
  if (pnlYen == null) {
    return "na";
  }
  if (pnlYen > 0) {
    return "gain";
  }
  if (pnlYen < 0) {
    return "loss";
  }
  return "flat";
}

export function pnlTextClass(tone: PnlTone): string {
  switch (tone) {
    case "gain":
      return "text-[#34c759]";
    case "loss":
      return "text-[#ff3b30]";
    case "flat":
      return "text-neutral-500 dark:text-neutral-400";
    case "na":
      return "text-neutral-400 dark:text-neutral-500";
  }
}

export function formatSignedYen(amountYen: number): string {
  if (amountYen === 0) {
    return formatYen(0);
  }
  if (amountYen > 0) {
    return `+${formatYen(amountYen)}`;
  }
  return formatYen(amountYen);
}

export function formatSignedYenCompact(amountYen: number): string {
  if (amountYen === 0) {
    return formatYenCompact(0);
  }
  const sign = amountYen > 0 ? "+" : "−";
  return `${sign}${formatYenCompact(Math.abs(amountYen))}`;
}

export function formatReturnPct(returnPct: number): string {
  if (returnPct === 0) {
    return "0.0%";
  }
  const sign = returnPct > 0 ? "+" : "−";
  return `${sign}${Math.abs(returnPct).toFixed(1)}%`;
}

export function formatHoldingPnlLine(pnlYen: number, returnPct: number): string {
  return `${formatSignedYen(pnlYen)} ${formatReturnPct(returnPct)}`;
}
