import { afterEach, describe, expect, it } from "vitest";
import {
  BULK_ADD_DRAFT_TTL_MS,
  clearBulkAddDraft,
  loadBulkAddDraft,
  saveBulkAddDraft,
} from "@/household/holding-bulk-draft";

afterEach(() => {
  sessionStorage.clear();
});

describe("saveBulkAddDraft / loadBulkAddDraft", () => {
  it("round-trips queue and in-progress row", () => {
    saveBulkAddDraft({
      queue: [
        {
          clientKey: "1",
          name: "Card A",
          assetClassId: "c1",
          quantity: null,
          costBasisYen: 50_000,
          collectibleCode: "P-159",
          snkrdunkProductId: 854923,
          conditionGrade: "psa10",
        },
      ],
      row: {
        name: "Card B",
        assetClassId: "c1",
        quantity: "",
        costBasis: "",
        collectibleCode: "",
        snkrdunkProductId: "",
        conditionGrade: "psa10",
      },
    });

    const draft = loadBulkAddDraft();
    expect(draft?.queue).toHaveLength(1);
    expect(draft?.row.name).toBe("Card B");
    expect(draft?.row.conditionGrade).toBe("psa10");
  });

  it("returns null when draft expired", () => {
    saveBulkAddDraft({ queue: [], row: { name: "", assetClassId: "", quantity: "", costBasis: "", collectibleCode: "", snkrdunkProductId: "", conditionGrade: "" } });
    const raw = sessionStorage.getItem("hartayu-bulk-add-draft");
    const parsed = JSON.parse(raw!);
    parsed.savedAt = Date.now() - BULK_ADD_DRAFT_TTL_MS - 1;
    sessionStorage.setItem("hartayu-bulk-add-draft", JSON.stringify(parsed));
    expect(loadBulkAddDraft()).toBeNull();
  });
});

describe("clearBulkAddDraft", () => {
  it("removes stored draft", () => {
    saveBulkAddDraft({ queue: [], row: { name: "", assetClassId: "", quantity: "", costBasis: "", collectibleCode: "", snkrdunkProductId: "", conditionGrade: "" } });
    clearBulkAddDraft();
    expect(loadBulkAddDraft()).toBeNull();
  });
});
