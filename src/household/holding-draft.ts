import type { ConditionGrade } from "@/market/snkrdunk";

export const HOLDING_DRAFT_STORAGE_KEY = "hartayu-holding-draft";
export const HOLDING_DRAFT_TTL_MS = 5 * 60 * 1000;

export type HoldingDraftPayload = {
  mode: "add" | "edit";
  holdingId?: string;
  name: string;
  assetClassId: string;
  quantity: string;
  costBasis: string;
  collectibleCode: string;
  snkrdunkProductId: string;
  conditionGrade: ConditionGrade | "";
};

export type HoldingDraft = HoldingDraftPayload & {
  savedAt: number;
};

export function saveHoldingDraft(payload: HoldingDraftPayload): void {
  const draft: HoldingDraft = { ...payload, savedAt: Date.now() };
  sessionStorage.setItem(HOLDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function loadHoldingDraft(): HoldingDraft | null {
  const raw = sessionStorage.getItem(HOLDING_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const draft = JSON.parse(raw) as HoldingDraft;
    if (Date.now() - draft.savedAt > HOLDING_DRAFT_TTL_MS) {
      clearHoldingDraft();
      return null;
    }
    return draft;
  } catch {
    clearHoldingDraft();
    return null;
  }
}

export function clearHoldingDraft(): void {
  sessionStorage.removeItem(HOLDING_DRAFT_STORAGE_KEY);
}
