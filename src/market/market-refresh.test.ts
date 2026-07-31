import { describe, expect, it } from "vitest";
import type { Holding, HoldingSnapshot } from "@/ledger/portfolio";
import { buildMarketRefreshLines } from "@/market/market-refresh";

function holding(id: string, quantity: number | null = 1): Holding {
  return {
    id,
    assetClassId: "class-collectibles",
    name: id,
    quantity,
    costBasisYen: null,
  };
}

function snapshot(holdingId: string, unitPriceYen: number): HoldingSnapshot {
  return {
    id: `snap-${holdingId}`,
    sessionId: "session-1",
    holdingId,
    unitPriceYen,
    totalValueYen: null,
    carriedForward: false,
  };
}

describe("buildMarketRefreshLines", () => {
  it("quotes linked holdings and carries forward unlinked ones", () => {
    const holdings = [holding("linked"), holding("stock")];
    const links = new Map([
      ["linked", { holdingId: "linked", conditionGrade: "psa10" as const }],
    ]);
    const prior = new Map([["stock", snapshot("stock", 50_000)]]);
    const quotes = new Map([
      ["linked", { ok: true as const, unitPriceYen: 180_000 }],
    ]);

    const { lines, outcomes } = buildMarketRefreshLines(
      holdings,
      links,
      prior,
      quotes,
    );

    expect(lines).toEqual([
      { holdingId: "linked", unitPriceYen: 180_000 },
      { holdingId: "stock", skipped: true, unitPriceYen: 50_000, totalValueYen: null },
    ]);
    expect(outcomes).toEqual([
      { holdingId: "linked", kind: "quoted", unitPriceYen: 180_000 },
      { holdingId: "stock", kind: "carried_forward" },
    ]);
  });

  it("skips no-quote linked holdings from snapshot lines", () => {
    const holdings = [holding("linked")];
    const links = new Map([
      ["linked", { holdingId: "linked", conditionGrade: "psa9" as const }],
    ]);
    const quotes = new Map([
      ["linked", { ok: false as const, reason: "no_listing" as const }],
    ]);

    const { lines, outcomes } = buildMarketRefreshLines(
      holdings,
      links,
      new Map(),
      quotes,
    );

    expect(lines).toEqual([]);
    expect(outcomes[0]).toMatchObject({ kind: "no_quote" });
  });

  it("uses total value for quantity-less holdings", () => {
    const holdings = [holding("card", null)];
    const links = new Map([
      ["card", { holdingId: "card", conditionGrade: "psa10" as const }],
    ]);
    const quotes = new Map([
      ["card", { ok: true as const, unitPriceYen: 120_000 }],
    ]);

    const { lines } = buildMarketRefreshLines(holdings, links, new Map(), quotes);

    expect(lines).toEqual([{ holdingId: "card", totalValueYen: 120_000 }]);
  });
});
