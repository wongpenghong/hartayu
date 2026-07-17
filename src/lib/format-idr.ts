export function formatIdr(amountIdr: number): string {
  return `Rp${amountIdr.toLocaleString("id-ID")}`;
}

export function parseIdrInput(value: string): number | null {
  const trimmed = value.trim().replace(/^Rp\s*/i, "");
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes(".") && !/^\d{1,3}(\.\d{3})*$/.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace(/[.,\s]/g, "");
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const amountIdr = Number(normalized);
  if (!Number.isSafeInteger(amountIdr) || amountIdr <= 0) {
    return null;
  }

  return amountIdr;
}

export function formatIdrInput(amountIdr: number): string {
  return formatIdr(amountIdr);
}
