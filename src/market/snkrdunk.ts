export const CONDITION_GRADES = ["a", "b", "c", "d", "psa9", "psa10"] as const;

export type ConditionGrade = (typeof CONDITION_GRADES)[number];

export const CONDITION_GRADE_LABELS: Record<ConditionGrade, string> = {
  a: "A (Like new)",
  b: "B (Minor scratches)",
  c: "C (Moderate scratches)",
  d: "D (Significant damage)",
  psa9: "PSA 9",
  psa10: "PSA 10",
};

export const GRADE_TO_FILTER_ID: Record<ConditionGrade, string> = {
  a: "like_new",
  b: "minor_scratches",
  c: "moderate_scratches",
  d: "significant_damage",
  psa9: "psa_9",
  psa10: "psa_10",
};

export type SnkrdunkChip = {
  filterConditionId: string;
  hasListing: boolean;
  usedMinPrice?: number | null;
};

export type SnkrdunkSizeChipsResponse = {
  chips?: SnkrdunkChip[];
};

export type SnkrdunkQuoteResult =
  | { ok: true; unitPriceYen: number }
  | { ok: false; reason: "no_listing" | "invalid_response" | "missing_price" };

export function parseSnkrdunkQuote(
  response: SnkrdunkSizeChipsResponse,
  grade: ConditionGrade,
): SnkrdunkQuoteResult {
  const filterId = GRADE_TO_FILTER_ID[grade];
  const chip = response.chips?.find((row) => row.filterConditionId === filterId);
  if (!chip) {
    return { ok: false, reason: "invalid_response" };
  }
  if (!chip.hasListing) {
    return { ok: false, reason: "no_listing" };
  }
  const price = chip.usedMinPrice;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    return { ok: false, reason: "missing_price" };
  }
  return { ok: true, unitPriceYen: Math.round(price) };
}

export async function fetchSnkrdunkQuote(
  productId: number,
  grade: ConditionGrade,
  fetchImpl: typeof fetch = fetch,
): Promise<SnkrdunkQuoteResult> {
  const url = `https://snkrdunk.com/v2/products/${productId}/size-chips?type=apparel`;
  const response = await fetchImpl(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    return { ok: false, reason: "invalid_response" };
  }
  const body = (await response.json()) as SnkrdunkSizeChipsResponse;
  return parseSnkrdunkQuote(body, grade);
}
