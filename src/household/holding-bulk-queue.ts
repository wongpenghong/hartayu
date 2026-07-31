import { validateCostBasis, validateHoldingName, validateHoldingQuantity } from "@/household/holdings";
import {
  parseSnkrdunkProductId,
  validateMarketLinkInput,
} from "@/household/collectible-market-links";
import { parseYenInput } from "@/lib/format-yen";
import type { ConditionGrade } from "@/market/snkrdunk";

export type BulkHoldingQueueItem = {
  clientKey: string;
  name: string;
  assetClassId: string;
  quantity: number | null;
  costBasisYen: number | null;
  collectibleCode: string;
  snkrdunkProductId: number;
  conditionGrade: ConditionGrade;
};

export type BulkRowForm = {
  name: string;
  assetClassId: string;
  quantity: string;
  costBasis: string;
  collectibleCode: string;
  snkrdunkProductId: string;
  conditionGrade: ConditionGrade | "";
};

export function bulkRowIdentityKey(params: {
  collectibleCode: string;
  conditionGrade: string;
  snkrdunkProductId: string | number;
}): string {
  const code = params.collectibleCode.trim().toLowerCase();
  const productId = String(params.snkrdunkProductId).trim();
  return `${code}|${params.conditionGrade}|${productId}`;
}

export function findDuplicateInQueue(
  queue: BulkHoldingQueueItem[],
  row: Pick<BulkRowForm, "collectibleCode" | "snkrdunkProductId" | "conditionGrade">,
): boolean {
  if (!row.collectibleCode.trim() || !row.snkrdunkProductId.trim() || !row.conditionGrade) {
    return false;
  }
  const key = bulkRowIdentityKey(row);
  return queue.some(
    (item) =>
      bulkRowIdentityKey({
        collectibleCode: item.collectibleCode,
        conditionGrade: item.conditionGrade,
        snkrdunkProductId: item.snkrdunkProductId,
      }) === key,
  );
}

export function validateBulkRow(row: BulkRowForm): string | null {
  const nameError = validateHoldingName(row.name);
  if (nameError) {
    return nameError;
  }

  const quantity =
    row.quantity.trim() === "" ? null : Number.parseFloat(row.quantity);
  const quantityError = validateHoldingQuantity(quantity);
  if (quantityError) {
    return quantityError;
  }

  const costBasisYen = parseYenInput(row.costBasis);
  const costBasisError = validateCostBasis(costBasisYen);
  if (costBasisError) {
    return costBasisError;
  }

  return validateMarketLinkInput({
    collectibleCode: row.collectibleCode,
    snkrdunkProductId: row.snkrdunkProductId,
    conditionGrade: row.conditionGrade,
  });
}

export function queueItemFromForm(row: BulkRowForm): BulkHoldingQueueItem | null {
  const error = validateBulkRow(row);
  if (error) {
    return null;
  }

  const productId = parseSnkrdunkProductId(row.snkrdunkProductId);
  if (productId == null || !row.conditionGrade) {
    return null;
  }

  const quantity =
    row.quantity.trim() === "" ? null : Number.parseFloat(row.quantity);
  const costBasisYen = parseYenInput(row.costBasis);

  return {
    clientKey: crypto.randomUUID(),
    name: row.name.trim(),
    assetClassId: row.assetClassId,
    quantity,
    costBasisYen,
    collectibleCode: row.collectibleCode.trim(),
    snkrdunkProductId: productId,
    conditionGrade: row.conditionGrade,
  };
}

export function emptyBulkRow(sticky: {
  assetClassId: string;
  conditionGrade: ConditionGrade | "";
}): BulkRowForm {
  return {
    name: "",
    assetClassId: sticky.assetClassId,
    quantity: "",
    costBasis: "",
    collectibleCode: "",
    snkrdunkProductId: "",
    conditionGrade: sticky.conditionGrade,
  };
}
