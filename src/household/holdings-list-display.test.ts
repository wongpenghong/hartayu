import { describe, expect, it } from "vitest";
import {
  compareHoldingsForSort,
  filterAndSortHoldings,
  paginateHoldingsPage,
  type HoldingListRow,
} from "./holdings-list-display";
import type { Holding } from "@/ledger/portfolio";

function holding(id: string, name: string, costBasisYen: number | null = 10_000): Holding {
  return {
    id,
    assetClassId: "collectibles",
    name,
    quantity: 1,
    costBasisYen,
  };
}

function row(
  id: string,
  name: string,
  overrides: Partial<HoldingListRow> = {},
): HoldingListRow {
  return {
    holding: holding(id, name),
    valueYen: 20_000,
    pnlYen: 10_000,
    returnPct: 100,
    noQuote: false,
    missingCost: false,
    hasSnapshot: true,
    ...overrides,
  };
}

describe("filterAndSortHoldings", () => {
  it("sorts by value with incomplete rows at the bottom", () => {
    const rows = [
      row("a", "Alpha", { valueYen: 50_000 }),
      row("b", "Beta", { noQuote: true, valueYen: null, pnlYen: null, returnPct: null }),
      row("c", "Gamma", { valueYen: 100_000 }),
    ];

    expect(
      filterAndSortHoldings(rows, "all", "value").map((item) => item.holding.id),
    ).toEqual(["c", "a", "b"]);
  });

  it("filters no-quote holdings", () => {
    const rows = [
      row("a", "Alpha"),
      row("b", "Beta", { noQuote: true, valueYen: null, pnlYen: null, returnPct: null }),
    ];

    expect(filterAndSortHoldings(rows, "no-quote", "value")).toHaveLength(1);
    expect(filterAndSortHoldings(rows, "no-quote", "value")[0].holding.id).toBe("b");
  });

  it("filters missing cost holdings", () => {
    const rows = [
      row("a", "Alpha"),
      row("b", "Beta", {
        missingCost: true,
        holding: holding("b", "Beta", null),
        pnlYen: null,
        returnPct: null,
      }),
    ];

    expect(filterAndSortHoldings(rows, "missing-cost", "value")).toHaveLength(1);
    expect(filterAndSortHoldings(rows, "missing-cost", "value")[0].holding.id).toBe("b");
  });
});

describe("compareHoldingsForSort", () => {
  it("sorts by pnl percent", () => {
    const high = row("a", "A", { returnPct: 200, pnlYen: 20_000, valueYen: 30_000 });
    const low = row("b", "B", { returnPct: 10, pnlYen: 1_000, valueYen: 11_000 });
    expect(compareHoldingsForSort(high, low, "pnl-pct")).toBeLessThan(0);
  });
});

describe("paginateHoldingsPage", () => {
  it("returns a fixed page with prev/next flags", () => {
    const rows = [1, 2, 3, 4, 5];
    expect(paginateHoldingsPage(rows, 1, 2)).toEqual({
      visible: [1, 2],
      page: 1,
      pageCount: 3,
      hasPrev: false,
      hasNext: true,
    });
    expect(paginateHoldingsPage(rows, 2, 2)).toEqual({
      visible: [3, 4],
      page: 2,
      pageCount: 3,
      hasPrev: true,
      hasNext: true,
    });
    expect(paginateHoldingsPage(rows, 3, 2)).toEqual({
      visible: [5],
      page: 3,
      pageCount: 3,
      hasPrev: true,
      hasNext: false,
    });
  });
});
