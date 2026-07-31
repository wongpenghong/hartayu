import { getSupabase } from "@/lib/supabase";
import type { HoldingSnapshot } from "@/ledger/portfolio";
import {
  CONDITION_GRADES,
  type ConditionGrade,
} from "@/market/snkrdunk";

export const COLLECTIBLES_CLASS_NAME = "Collectibles";

export type CollectibleMarketLink = {
  holdingId: string;
  collectibleCode: string;
  snkrdunkProductId: number;
  conditionGrade: ConditionGrade;
  lastFetchedAt: string | null;
  lastFetchError: string | null;
};

export type CollectibleMarketLinkRow = {
  holding_id: string;
  collectible_code: string;
  snkrdunk_product_id: number;
  condition_grade: string;
  last_fetched_at: string | null;
  last_fetch_error: string | null;
  created_at: string;
};

const linkSelect =
  "holding_id, collectible_code, snkrdunk_product_id, condition_grade, last_fetched_at, last_fetch_error, created_at";

function mapLink(row: CollectibleMarketLinkRow): CollectibleMarketLink {
  return {
    holdingId: row.holding_id,
    collectibleCode: row.collectible_code,
    snkrdunkProductId: row.snkrdunk_product_id,
    conditionGrade: row.condition_grade as ConditionGrade,
    lastFetchedAt: row.last_fetched_at,
    lastFetchError: row.last_fetch_error,
  };
}

export function isCollectiblesAssetClass(
  assetClassId: string,
  assetClassNames: Map<string, string>,
): boolean {
  return assetClassNames.get(assetClassId) === COLLECTIBLES_CLASS_NAME;
}

export function validateCollectibleCode(code: string): string | null {
  const trimmed = code.trim();
  if (!trimmed) {
    return "Collectible code is required.";
  }
  if (trimmed.length > 40) {
    return "Collectible code must be 40 characters or fewer.";
  }
  return null;
}

export function validateSnkrdunkProductId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "SNKRDUNK product ID is required.";
  }
  if (!/^\d+$/.test(trimmed)) {
    return "SNKRDUNK product ID must be a positive number.";
  }
  const parsed = Number(trimmed);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return "SNKRDUNK product ID must be a positive number.";
  }
  return null;
}

export function parseSnkrdunkProductId(value: string): number | null {
  if (validateSnkrdunkProductId(value) != null) {
    return null;
  }
  return Number(value.trim());
}

export function validateConditionGrade(grade: string): string | null {
  if (!(CONDITION_GRADES as readonly string[]).includes(grade)) {
    return "Choose a condition grade.";
  }
  return null;
}

export function hasMarketLinkInput(params: {
  collectibleCode: string;
  snkrdunkProductId: string;
  conditionGrade: string;
}): boolean {
  return (
    params.collectibleCode.trim() !== "" ||
    params.snkrdunkProductId.trim() !== "" ||
    params.conditionGrade.trim() !== ""
  );
}

export function validateMarketLinkInput(params: {
  collectibleCode: string;
  snkrdunkProductId: string;
  conditionGrade: string;
}): string | null {
  if (!hasMarketLinkInput(params)) {
    return null;
  }
  return (
    validateCollectibleCode(params.collectibleCode) ??
    validateSnkrdunkProductId(params.snkrdunkProductId) ??
    validateConditionGrade(params.conditionGrade)
  );
}

export async function fetchCollectibleMarketLinks(): Promise<CollectibleMarketLink[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase.from("collectible_market_links").select(linkSelect);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapLink);
}

export async function upsertCollectibleMarketLink(params: {
  holdingId: string;
  collectibleCode: string;
  snkrdunkProductId: number;
  conditionGrade: ConditionGrade;
}): Promise<CollectibleMarketLink> {
  const codeError = validateCollectibleCode(params.collectibleCode);
  if (codeError) {
    throw new Error(codeError);
  }
  const gradeError = validateConditionGrade(params.conditionGrade);
  if (gradeError) {
    throw new Error(gradeError);
  }
  if (!Number.isSafeInteger(params.snkrdunkProductId) || params.snkrdunkProductId <= 0) {
    throw new Error("SNKRDUNK product ID must be a positive number.");
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("collectible_market_links")
    .upsert(
      {
        holding_id: params.holdingId,
        collectible_code: params.collectibleCode.trim(),
        snkrdunk_product_id: params.snkrdunkProductId,
        condition_grade: params.conditionGrade,
      },
      { onConflict: "holding_id" },
    )
    .select(linkSelect)
    .single();

  if (error || !data) {
    throw error ?? new Error("Failed to save market link");
  }

  return mapLink(data);
}

export async function deleteCollectibleMarketLink(holdingId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("collectible_market_links")
    .delete()
    .eq("holding_id", holdingId);

  if (error) {
    throw error;
  }
}

export type MarketRefreshSummary = {
  quoted: number;
  noQuote: number;
  carriedForward: number;
};

export async function refreshHouseholdMarketPrices(
  householdId: string,
): Promise<MarketRefreshSummary> {
  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke("refresh-household-market-prices", {
    body: { householdId },
  });

  if (error) {
    throw error;
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    quoted: Number(data?.quoted ?? 0),
    noQuote: Number(data?.noQuote ?? 0),
    carriedForward: Number(data?.carriedForward ?? 0),
  };
}

export function holdingShowsNoQuote(
  link: CollectibleMarketLink | undefined,
  latestSnapshot: HoldingSnapshot | undefined,
): boolean {
  if (!link) {
    return false;
  }
  if (link.lastFetchError != null) {
    return true;
  }
  return latestSnapshot == null;
}
