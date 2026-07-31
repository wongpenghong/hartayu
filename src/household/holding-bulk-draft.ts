import type { BulkHoldingQueueItem, BulkRowForm } from "@/household/holding-bulk-queue";

export const BULK_ADD_DRAFT_STORAGE_KEY = "hartayu-bulk-add-draft";
export const BULK_ADD_DRAFT_TTL_MS = 5 * 60 * 1000;

export type BulkAddDraftPayload = {
  queue: BulkHoldingQueueItem[];
  row: BulkRowForm;
};

export type BulkAddDraft = BulkAddDraftPayload & {
  savedAt: number;
};

export function saveBulkAddDraft(payload: BulkAddDraftPayload): void {
  const draft: BulkAddDraft = { ...payload, savedAt: Date.now() };
  sessionStorage.setItem(BULK_ADD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadBulkAddDraft(): BulkAddDraft | null {
  const raw = sessionStorage.getItem(BULK_ADD_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const draft = JSON.parse(raw) as BulkAddDraft;
    if (Date.now() - draft.savedAt > BULK_ADD_DRAFT_TTL_MS) {
      clearBulkAddDraft();
      return null;
    }
    return draft;
  } catch {
    clearBulkAddDraft();
    return null;
  }
}

export function clearBulkAddDraft(): void {
  sessionStorage.removeItem(BULK_ADD_DRAFT_STORAGE_KEY);
}
