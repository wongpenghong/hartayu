export function parseExchangeRateInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = trimmed.includes(",") && !trimmed.includes(".")
    ? trimmed.replace(",", ".")
    : trimmed.replace(/,/g, "");
  if (!/^\d*\.?\d+$/.test(normalized)) {
    return null;
  }

  const rate = Number(normalized);
  if (!Number.isFinite(rate) || rate <= 0) {
    return null;
  }

  return rate;
}

export function formatExchangeRateInput(rate: number): string {
  return String(rate);
}

export function deriveYenFromIdr(
  foreignAmountIdr: number,
  exchangeRateIdrToJpy: number,
): number {
  return Math.round(foreignAmountIdr * exchangeRateIdrToJpy);
}

export function resolveEntryAmountYen(
  amountYen: number | null,
  foreignAmountIdr: number | null,
  exchangeRateIdrToJpy: number | null,
): number | null {
  if (amountYen != null && amountYen > 0) {
    return amountYen;
  }

  if (
    foreignAmountIdr != null &&
    foreignAmountIdr > 0 &&
    exchangeRateIdrToJpy != null &&
    exchangeRateIdrToJpy > 0
  ) {
    return deriveYenFromIdr(foreignAmountIdr, exchangeRateIdrToJpy);
  }

  return null;
}
