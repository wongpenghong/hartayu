import { describe, expect, it } from "vitest";
import {
  bulkRowIdentityKey,
  findDuplicateInQueue,
  validateBulkRow,
  type BulkHoldingQueueItem,
} from "@/household/holding-bulk-queue";

describe("bulkRowIdentityKey", () => {
  it("normalizes code and combines grade + product id", () => {
    expect(
      bulkRowIdentityKey({
        collectibleCode: " p-159 ",
        conditionGrade: "psa10",
        snkrdunkProductId: "854923",
      }),
    ).toBe("p-159|psa10|854923");
  });
});

describe("findDuplicateInQueue", () => {
  const queue: BulkHoldingQueueItem[] = [
    {
      clientKey: "1",
      name: "Card A",
      assetClassId: "c1",
      quantity: null,
      costBasisYen: null,
      collectibleCode: "P-159",
      snkrdunkProductId: 854923,
      conditionGrade: "psa10",
    },
  ];

  it("detects duplicate identity in queue", () => {
    expect(
      findDuplicateInQueue(queue, {
        collectibleCode: "P-159",
        snkrdunkProductId: "854923",
        conditionGrade: "psa10",
      }),
    ).toBe(true);
  });

  it("allows different product id", () => {
    expect(
      findDuplicateInQueue(queue, {
        collectibleCode: "P-159",
        snkrdunkProductId: "999",
        conditionGrade: "psa10",
      }),
    ).toBe(false);
  });
});

describe("validateBulkRow", () => {
  it("requires name and market link fields for collectibles row", () => {
    expect(
      validateBulkRow({
        name: "",
        assetClassId: "c1",
        quantity: "",
        collectibleCode: "P-159",
        snkrdunkProductId: "854923",
        conditionGrade: "psa10",
      }),
    ).toBe("Holding name is required.");
  });

  it("accepts valid row", () => {
    expect(
      validateBulkRow({
        name: "Charizard",
        assetClassId: "c1",
        quantity: "",
        collectibleCode: "P-159",
        snkrdunkProductId: "854923",
        conditionGrade: "psa10",
      }),
    ).toBeNull();
  });
});
