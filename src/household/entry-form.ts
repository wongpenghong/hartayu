import type { EntryKind } from "@/ledger/types";

export type EntryDraft = {
  kind: Exclude<EntryKind, "transfer">;
  amountYen: number | null;
  foreignAmountIdr: number | null;
  pocketId: string;
  categoryId: string;
  entryDate: string;
  note: string;
};

export type TransferDraft = {
  amountYen: number | null;
  fromPocketId: string;
  toPocketId: string;
  entryDate: string;
  note: string;
};

export function validateEntryDraft(draft: EntryDraft): string | null {
  if (draft.amountYen == null || draft.amountYen <= 0) {
    return "Enter a positive amount in yen.";
  }

  if (
    draft.foreignAmountIdr != null &&
    (!Number.isSafeInteger(draft.foreignAmountIdr) || draft.foreignAmountIdr <= 0)
  ) {
    return "Enter a positive amount in IDR.";
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
