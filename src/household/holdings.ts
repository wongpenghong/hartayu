import type { CollectibleMarketLink } from "@/household/collectible-market-links";
import type { BulkHoldingQueueItem } from "@/household/holding-bulk-queue";
import type { ConditionGrade } from "@/market/snkrdunk";
import { getSupabase } from "@/lib/supabase";
import type { Holding } from "@/ledger/portfolio";

export type HoldingRow = {
  id: string;
  household_id: string;
  asset_class_id: string;
  name: string;
  quantity: number | null;
  cost_basis_yen: number | null;
  created_at: string;
};

const holdingSelect =
  "id, household_id, asset_class_id, name, quantity, cost_basis_yen, created_at";

function mapHolding(row: HoldingRow): Holding {
  return {
    id: row.id,
    assetClassId: row.asset_class_id,
    name: row.name,
    quantity: row.quantity == null ? null : Number(row.quantity),
    costBasisYen: row.cost_basis_yen,
  };
}

export function validateHoldingName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Holding name is required.";
  }
  if (trimmed.length > 80) {
    return "Holding name must be 80 characters or fewer.";
  }
  return null;
}

export function validateHoldingQuantity(quantity: number | null): string | null {
  if (quantity == null) {
    return null;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "Quantity must be a positive number.";
  }
  return null;
}

export function validateCostBasis(costBasisYen: number | null): string | null {
  if (costBasisYen == null) {
    return null;
  }
  if (!Number.isSafeInteger(costBasisYen) || costBasisYen <= 0) {
    return "Cost basis must be a positive whole yen amount.";
  }
  return null;
}

export async function fetchHoldings(): Promise<Holding[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("holdings")
    .select(holdingSelect)
    .order("name");

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapHolding);
}

export async function createHolding(params: {
  householdId: string;
  assetClassId: string;
  name: string;
  quantity?: number | null;
  costBasisYen?: number | null;
}): Promise<Holding> {
  const nameError = validateHoldingName(params.name);
  if (nameError) {
    throw new Error(nameError);
  }

  const quantityError = validateHoldingQuantity(params.quantity ?? null);
  if (quantityError) {
    throw new Error(quantityError);
  }

  const costBasisError = validateCostBasis(params.costBasisYen ?? null);
  if (costBasisError) {
    throw new Error(costBasisError);
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("holdings")
    .insert({
      household_id: params.householdId,
      asset_class_id: params.assetClassId,
      name: params.name.trim(),
      quantity: params.quantity ?? null,
      cost_basis_yen: params.costBasisYen ?? null,
    })
    .select(holdingSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to create holding");
  }

  return mapHolding(data);
}

export async function updateHolding(
  holdingId: string,
  updates: {
    assetClassId?: string;
    name?: string;
    quantity?: number | null;
    costBasisYen?: number | null;
  },
): Promise<Holding> {
  if (updates.name !== undefined) {
    const nameError = validateHoldingName(updates.name);
    if (nameError) {
      throw new Error(nameError);
    }
  }

  if (updates.quantity !== undefined) {
    const quantityError = validateHoldingQuantity(updates.quantity);
    if (quantityError) {
      throw new Error(quantityError);
    }
  }

  if (updates.costBasisYen !== undefined) {
    const costBasisError = validateCostBasis(updates.costBasisYen);
    if (costBasisError) {
      throw new Error(costBasisError);
    }
  }

  const payload = {
    ...(updates.assetClassId !== undefined
      ? { asset_class_id: updates.assetClassId }
      : {}),
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.quantity !== undefined ? { quantity: updates.quantity } : {}),
    ...(updates.costBasisYen !== undefined
      ? { cost_basis_yen: updates.costBasisYen }
      : {}),
  };

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("holdings")
    .update(payload)
    .eq("id", holdingId)
    .select(holdingSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to update holding");
  }

  return mapHolding(data);
}

export async function deleteHolding(holdingId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from("holdings").delete().eq("id", holdingId);

  if (error) {
    throw error;
  }
}

type BatchHoldingRow = {
  id: string;
  household_id: string;
  asset_class_id: string;
  name: string;
  quantity: number | null;
  cost_basis_yen: number | null;
  market_link: {
    collectible_code: string;
    snkrdunk_product_id: number;
    condition_grade: ConditionGrade;
  } | null;
};

function mapBatchMarketLink(
  holdingId: string,
  link: BatchHoldingRow["market_link"],
): CollectibleMarketLink | null {
  if (!link) {
    return null;
  }
  return {
    holdingId,
    collectibleCode: link.collectible_code,
    snkrdunkProductId: link.snkrdunk_product_id,
    conditionGrade: link.condition_grade,
    lastFetchedAt: null,
    lastFetchError: null,
  };
}

export async function createHoldingsBatch(params: {
  householdId: string;
  rows: BulkHoldingQueueItem[];
}): Promise<{ holdings: Holding[]; marketLinks: CollectibleMarketLink[] }> {
  if (params.rows.length === 0) {
    throw new Error("At least one holding is required.");
  }

  for (const row of params.rows) {
    const nameError = validateHoldingName(row.name);
    if (nameError) {
      throw new Error(nameError);
    }
    const quantityError = validateHoldingQuantity(row.quantity);
    if (quantityError) {
      throw new Error(quantityError);
    }
  }

  const supabase = getSupabase();
  const { data, error } = await supabase.rpc("create_holdings_batch", {
    p_payload: {
      household_id: params.householdId,
      holdings: params.rows.map((row) => ({
        name: row.name,
        asset_class_id: row.assetClassId,
        quantity: row.quantity,
        cost_basis_yen: row.costBasisYen,
        market_link: {
          collectible_code: row.collectibleCode,
          snkrdunk_product_id: row.snkrdunkProductId,
          condition_grade: row.conditionGrade,
        },
      })),
    },
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as BatchHoldingRow[];
  const holdings: Holding[] = rows.map((row) => ({
    id: row.id,
    assetClassId: row.asset_class_id,
    name: row.name,
    quantity: row.quantity == null ? null : Number(row.quantity),
    costBasisYen: row.cost_basis_yen,
  }));
  const marketLinks = rows
    .map((row) => mapBatchMarketLink(row.id, row.market_link))
    .filter((link): link is CollectibleMarketLink => link != null);

  return { holdings, marketLinks };
}
