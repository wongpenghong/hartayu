import { afterEach, describe, expect, it } from "vitest";
import {
  clearHoldingDraft,
  HOLDING_DRAFT_TTL_MS,
  loadHoldingDraft,
  saveHoldingDraft,
  type HoldingDraftPayload,
} from "@/household/holding-draft";

const sampleDraft: HoldingDraftPayload = {
  mode: "add",
  name: "PSA 10 Charizard",
  assetClassId: "class-1",
  quantity: "1",
  costBasis: "",
  collectibleCode: "P-159",
  snkrdunkProductId: "854923",
  conditionGrade: "psa10",
};

afterEach(() => {
  sessionStorage.clear();
});

describe("saveHoldingDraft / loadHoldingDraft", () => {
  it("round-trips a draft within TTL", () => {
    saveHoldingDraft(sampleDraft);
    expect(loadHoldingDraft()).toEqual({
      ...sampleDraft,
      savedAt: expect.any(Number),
    });
  });

  it("returns null when no draft exists", () => {
    expect(loadHoldingDraft()).toBeNull();
  });

  it("returns null when draft is older than TTL", () => {
    saveHoldingDraft(sampleDraft);
    const raw = sessionStorage.getItem("hartayu-holding-draft");
    const parsed = JSON.parse(raw!);
    parsed.savedAt = Date.now() - HOLDING_DRAFT_TTL_MS - 1;
    sessionStorage.setItem("hartayu-holding-draft", JSON.stringify(parsed));
    expect(loadHoldingDraft()).toBeNull();
  });

  it("clears expired draft from storage", () => {
    saveHoldingDraft(sampleDraft);
    const raw = sessionStorage.getItem("hartayu-holding-draft");
    const parsed = JSON.parse(raw!);
    parsed.savedAt = Date.now() - HOLDING_DRAFT_TTL_MS - 1;
    sessionStorage.setItem("hartayu-holding-draft", JSON.stringify(parsed));
    loadHoldingDraft();
    expect(sessionStorage.getItem("hartayu-holding-draft")).toBeNull();
  });

  it("restores edit mode with holding id", () => {
    saveHoldingDraft({ ...sampleDraft, mode: "edit", holdingId: "h-1" });
    expect(loadHoldingDraft()?.mode).toBe("edit");
    expect(loadHoldingDraft()?.holdingId).toBe("h-1");
  });
});

describe("clearHoldingDraft", () => {
  it("removes stored draft", () => {
    saveHoldingDraft(sampleDraft);
    clearHoldingDraft();
    expect(loadHoldingDraft()).toBeNull();
  });
});
