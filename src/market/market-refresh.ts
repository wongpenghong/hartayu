import type { Holding, HoldingSnapshot } from "@/ledger/portfolio";
import type { BatchSnapshotLineInput } from "@/household/snapshots";
import type { ConditionGrade, SnkrdunkQuoteResult } from "@/market/snkrdunk";

export type MarketLinkRow = {
  holdingId: string;
  conditionGrade: ConditionGrade;
};

export type RefreshLinkOutcome =
  | { holdingId: string; kind: "quoted"; unitPriceYen: number }
  | { holdingId: string; kind: "no_quote"; error: string }
  | { holdingId: string; kind: "carried_forward" };

export function buildMarketRefreshLines(
  holdings: Holding[],
  marketLinksByHoldingId: Map<string, MarketLinkRow>,
  priorSnapshotsByHolding: Map<string, HoldingSnapshot>,
  quotesByHoldingId: Map<string, SnkrdunkQuoteResult>,
): { lines: BatchSnapshotLineInput[]; outcomes: RefreshLinkOutcome[] } {
  const lines: BatchSnapshotLineInput[] = [];
  const outcomes: RefreshLinkOutcome[] = [];

  for (const holding of holdings) {
    const link = marketLinksByHoldingId.get(holding.id);
    if (!link) {
      const prior = priorSnapshotsByHolding.get(holding.id);
      if (!prior) {
        continue;
      }
      lines.push({
        holdingId: holding.id,
        skipped: true,
        unitPriceYen: prior.unitPriceYen,
        totalValueYen: prior.totalValueYen,
      });
      outcomes.push({ holdingId: holding.id, kind: "carried_forward" });
      continue;
    }

    const quote = quotesByHoldingId.get(holding.id);
    if (!quote) {
      outcomes.push({
        holdingId: holding.id,
        kind: "no_quote",
        error: "Missing quote",
      });
      continue;
    }

    if (!quote.ok) {
      const error =
        quote.reason === "no_listing" ? "No listing at this grade" : "Fetch failed";
      outcomes.push({ holdingId: holding.id, kind: "no_quote", error });
      continue;
    }

    if (holding.quantity != null) {
      lines.push({
        holdingId: holding.id,
        unitPriceYen: quote.unitPriceYen,
      });
    } else {
      lines.push({
        holdingId: holding.id,
        totalValueYen: quote.unitPriceYen,
      });
    }
    outcomes.push({
      holdingId: holding.id,
      kind: "quoted",
      unitPriceYen: quote.unitPriceYen,
    });
  }

  return { lines, outcomes };
}

export function quoteFetchErrorMessage(result: SnkrdunkQuoteResult): string | null {
  if (result.ok) {
    return null;
  }
  if (result.reason === "no_listing") {
    return "No listing at this grade";
  }
  return "Fetch failed";
}
