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

export function pnlTextClassOnDark(tone: PnlTone): string {
  switch (tone) {
    case "gain":
      return "text-[#5de27a]";
    case "loss":
      return "text-[#ff8a98]";
    case "flat":
      return "text-white/70";
    case "na":
      return "text-white/45";
  }
}

export function pnlBarClass(tone: PnlTone): string {
  switch (tone) {
    case "gain":
      return "bg-[#34c759]";
    case "loss":
      return "bg-[#ff6b7a]";
    case "flat":
      return "bg-white/40";
    case "na":
      return "bg-white/20";
  }
}

export function portfolioValueRatio(
  costBasisYen: number,
  valueYen: number,
): number {
  if (costBasisYen <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, valueYen / costBasisYen));
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
  return `${formatSignedYen(pnlYen)} · ${formatReturnPct(returnPct)}`;
}

export function formatPnlCoverageNote(
  eligibleCount: number,
  scopedCount: number,
): string {
  if (eligibleCount === scopedCount) {
    return `${scopedCount} holdings`;
  }
  return `P&L for ${eligibleCount} of ${scopedCount} holdings`;
}

export function formatPortfolioSummaryNote(
  valuedHoldingCount: number,
  holdingCount: number,
  pnlSummary: { eligibleCount: number; scopedCount: number } | null,
): string {
  if (pnlSummary != null) {
    const pnlNote = formatPnlCoverageNote(
      pnlSummary.eligibleCount,
      pnlSummary.scopedCount,
    );
    if (
      valuedHoldingCount === pnlSummary.eligibleCount &&
      holdingCount === pnlSummary.scopedCount
    ) {
      return pnlNote;
    }
    const valuedNote =
      valuedHoldingCount === holdingCount
        ? `${holdingCount} valued`
        : `${valuedHoldingCount} of ${holdingCount} valued`;
    return `${valuedNote} · ${pnlNote}`;
  }
  if (valuedHoldingCount > 0) {
    return valuedHoldingCount === holdingCount
      ? `${holdingCount} holdings`
      : `${valuedHoldingCount} of ${holdingCount} holdings valued`;
  }
  return `${holdingCount} holdings · add snapshot values`;
}
