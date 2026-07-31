export const CONDITION_GRADES = ["a", "b", "c", "d", "psa9", "psa10"] as const;

export type ConditionGrade = (typeof CONDITION_GRADES)[number];

export const GRADE_TO_FILTER_ID: Record<ConditionGrade, string> = {
  a: "like_new",
  b: "minor_scratches",
  c: "moderate_scratches",
  d: "significant_damage",
  psa9: "psa_9",
  psa10: "psa_10",
};

type SnkrdunkChip = {
  filterConditionId: string;
  hasListing: boolean;
  usedMinPrice?: number | null;
};

type SnkrdunkQuoteResult =
  | { ok: true; unitPriceYen: number }
  | { ok: false; reason: "no_listing" | "invalid_response" | "missing_price" | "fetch_failed" };

export function parseSnkrdunkQuote(
  response: { chips?: SnkrdunkChip[] },
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
): Promise<SnkrdunkQuoteResult> {
  const url = `https://snkrdunk.com/v2/products/${productId}/size-chips?type=apparel`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return { ok: false, reason: "fetch_failed" };
    }
    const body = (await response.json()) as { chips?: SnkrdunkChip[] };
    return parseSnkrdunkQuote(body, grade);
  } catch {
    return { ok: false, reason: "fetch_failed" };
  }
}

export function quoteErrorMessage(result: SnkrdunkQuoteResult): string | null {
  if (result.ok) {
    return null;
  }
  if (result.reason === "no_listing") {
    return "No listing at this grade";
  }
  return "Fetch failed";
}
