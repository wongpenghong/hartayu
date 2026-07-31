import type { EntryKind } from "@/ledger/types";
import { resolveEntryAmountYen } from "@/lib/format-idr-rate";

export type EntryDraft = {
  kind: Exclude<EntryKind, "transfer">;
  amountYen: number | null;
  foreignAmountIdr: number | null;
  exchangeRateIdrToJpy: number | null;
  pocketId: string;
  categoryId: string;
  entryDate: string;
  note: string;
};

export type EntryDraftPrefill = Partial<
  Omit<EntryDraft, "foreignAmountIdr" | "exchangeRateIdrToJpy"> & {
    attribution: string;
  }
>;

export type TransferDraft = {
  amountYen: number | null;
  fromPocketId: string;
  toPocketId: string;
  entryDate: string;
  note: string;
};

export function entryDraftAmountYen(draft: EntryDraft): number | null {
  return resolveEntryAmountYen(
    draft.amountYen,
    draft.foreignAmountIdr,
    draft.exchangeRateIdrToJpy,
  );
}

export function validateEntryDraft(draft: EntryDraft): string | null {
  const hasForeignAmount =
    draft.foreignAmountIdr != null && draft.foreignAmountIdr > 0;
  const hasExchangeRate =
    draft.exchangeRateIdrToJpy != null && draft.exchangeRateIdrToJpy > 0;
  const hasTypedYen = draft.amountYen != null && draft.amountYen > 0;

  if (
    draft.foreignAmountIdr != null &&
    (!Number.isSafeInteger(draft.foreignAmountIdr) ||
      draft.foreignAmountIdr <= 0)
  ) {
    return "Enter a positive amount in IDR.";
  }

  if (
    draft.exchangeRateIdrToJpy != null &&
    (!Number.isFinite(draft.exchangeRateIdrToJpy) ||
      draft.exchangeRateIdrToJpy <= 0)
  ) {
    return "Enter a positive exchange rate.";
  }

  if (hasForeignAmount && !hasExchangeRate && !hasTypedYen) {
    return "Enter an exchange rate when using IDR without yen.";
  }

  if (hasExchangeRate && !hasForeignAmount && !hasTypedYen) {
    return "Enter a foreign amount in IDR when using an exchange rate.";
  }

  const resolvedAmountYen = entryDraftAmountYen(draft);

  if (resolvedAmountYen == null || resolvedAmountYen <= 0) {
    return "Enter an amount in yen, or IDR with an exchange rate.";
  }

  if (!draft.pocketId.trim()) {
    return "Choose a pocket.";
  }

  if (!draft.categoryId.trim()) {
    return "Choose a category.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.entryDate)) {
    return "Choose a valid date.";
  }

  return null;
}

export function validateTransferDraft(draft: TransferDraft): string | null {
  if (draft.amountYen == null || draft.amountYen <= 0) {
    return "Enter a positive amount in yen.";
  }

  if (!draft.fromPocketId.trim()) {
    return "Choose a source pocket.";
  }

  if (!draft.toPocketId.trim()) {
    return "Choose a destination pocket.";
  }

  if (draft.fromPocketId === draft.toPocketId) {
    return "Source and destination pockets must differ.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.entryDate)) {
    return "Choose a valid date.";
  }

  return null;
}
