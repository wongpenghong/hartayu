import { describe, expect, it } from "vitest";
import {
  allocationByAssetClass,
  allocationByHolding,
  holdingValueYen,
  latestSnapshotsByHolding,
  portfolioTrendPoints,
} from "./portfolio";
import type { Holding, HoldingSnapshot, SnapshotSession } from "./portfolio";

function holding(overrides: Partial<Holding> & Pick<Holding, "id">): Holding {
  return {
    assetClassId: "class-stocks",
    name: "VTI",
    quantity: 10,
    costBasisYen: null,
    ...overrides,
  };
}

function snapshot(
  overrides: Partial<HoldingSnapshot> & Pick<HoldingSnapshot, "holdingId" | "sessionId">,
): HoldingSnapshot {
  return {
    id: `snap-${overrides.holdingId}-${overrides.sessionId}`,
    unitPriceYen: null,
    totalValueYen: null,
    carriedForward: false,
    ...overrides,
  };
}

function session(id: string, asOfDate: string): SnapshotSession {
  return { id, asOfDate, createdAt: `${asOfDate}T00:00:00Z` };
}

describe("holdingValueYen", () => {
  it("uses total value shortcut when quantity is absent", () => {
    const h = holding({ id: "h1", quantity: null });
    const s = snapshot({ holdingId: "h1", sessionId: "s1", totalValueYen: 500_000 });
    expect(holdingValueYen(h, s)).toBe(500_000);
  });

  it("multiplies unit price by quantity", () => {
    const h = holding({ id: "h1", quantity: 10 });
    const s = snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 25_000 });
    expect(holdingValueYen(h, s)).toBe(250_000);
  });

  it("rounds fractional yen from quantity times price", () => {
    const h = holding({ id: "h1", quantity: 1.5 });
    const s = snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 100 });
    expect(holdingValueYen(h, s)).toBe(150);
  });
});

describe("portfolioTrendPoints", () => {
  const holdings = [
    holding({ id: "h1", assetClassId: "stocks", quantity: 10 }),
    holding({ id: "h2", assetClassId: "collectibles", quantity: null }),
  ];
  const sessions = [session("s1", "2026-01-31"), session("s2", "2026-02-28")];
  const snapshots = [
    snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 10_000 }),
    snapshot({ holdingId: "h2", sessionId: "s1", totalValueYen: 200_000 }),
    snapshot({ holdingId: "h1", sessionId: "s2", unitPriceYen: 12_000 }),
    snapshot({ holdingId: "h2", sessionId: "s2", totalValueYen: 220_000 }),
  ];

  it("builds total trend across all holdings", () => {
    expect(portfolioTrendPoints(sessions, holdings, snapshots)).toEqual([
      { date: "2026-01-31", totalYen: 300_000 },
      { date: "2026-02-28", totalYen: 340_000 },
    ]);
  });

  it("scopes trend to one asset class when filtered", () => {
    expect(
      portfolioTrendPoints(sessions, holdings, snapshots, "stocks"),
    ).toEqual([
      { date: "2026-01-31", totalYen: 100_000 },
      { date: "2026-02-28", totalYen: 120_000 },
    ]);
  });
});

describe("allocationByAssetClass", () => {
  it("sums latest session values by asset class", () => {
    const holdings = [
      holding({ id: "h1", assetClassId: "stocks", quantity: 2 }),
      holding({ id: "h2", assetClassId: "stocks", quantity: 1 }),
      holding({ id: "h3", assetClassId: "private", quantity: null }),
    ];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 10_000 }),
      snapshot({ holdingId: "h2", sessionId: "s1", unitPriceYen: 5_000 }),
      snapshot({ holdingId: "h3", sessionId: "s1", totalValueYen: 1_000_000 }),
    ];

    expect(
      allocationByAssetClass(holdings, snapshots, "s1").sort((a, b) =>
        a.id.localeCompare(b.id),
      ),
    ).toEqual([
      { id: "private", totalYen: 1_000_000 },
      { id: "stocks", totalYen: 25_000 },
    ]);
  });
});

describe("allocationByHolding", () => {
  it("returns holding totals for one asset class", () => {
    const holdings = [
      holding({ id: "h1", assetClassId: "stocks", quantity: 2 }),
      holding({ id: "h2", assetClassId: "stocks", quantity: 1 }),
      holding({ id: "h3", assetClassId: "private", quantity: null }),
    ];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 10_000 }),
      snapshot({ holdingId: "h2", sessionId: "s1", unitPriceYen: 5_000 }),
    ];

    expect(allocationByHolding(holdings, snapshots, "s1", "stocks")).toEqual([
      { id: "h1", totalYen: 20_000 },
      { id: "h2", totalYen: 5_000 },
    ]);
  });
});

describe("latestSnapshotsByHolding", () => {
  it("picks the newest snapshot per holding by session date", () => {
    const sessions = [session("s1", "2026-01-31"), session("s2", "2026-02-28")];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 1_000 }),
      snapshot({ holdingId: "h1", sessionId: "s2", unitPriceYen: 2_000 }),
    ];

    const latest = latestSnapshotsByHolding(sessions, snapshots);
    expect(latest.get("h1")?.unitPriceYen).toBe(2_000);
  });
});
