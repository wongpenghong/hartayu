import { describe, expect, it } from "vitest";
import {
  allocationByAssetClass,
  allocationByAssetClassLatest,
  allocationByHolding,
  holdingPnl,
  holdingValueYen,
  holdingsNeedCostBasisHint,
  latestSessionId,
  latestSnapshotsByHolding,
  portfolioPnlSummary,
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

function session(
  id: string,
  asOfDate: string,
  createdAt = `${asOfDate}T00:00:00Z`,
): SnapshotSession {
  return { id, asOfDate, createdAt };
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

  it("breaks ties on same as-of date using created_at", () => {
    const sessions = [
      session("s1", "2026-07-31", "2026-07-31T08:00:00Z"),
      session("s2", "2026-07-31", "2026-07-31T12:00:00Z"),
    ];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 0 }),
      snapshot({ holdingId: "h1", sessionId: "s2", unitPriceYen: 28_000 }),
    ];

    expect(latestSnapshotsByHolding(sessions, snapshots).get("h1")?.unitPriceYen).toBe(
      28_000,
    );
    expect(latestSessionId(sessions)).toBe("s2");
  });
});

describe("holdingPnl", () => {
  it("computes unrealized gain from total cost basis and latest value", () => {
    const h = holding({
      id: "h1",
      quantity: 10,
      costBasisYen: 200_000,
    });
    const s = snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 25_000 });

    expect(holdingPnl(h, s)).toEqual({
      holdingId: "h1",
      costBasisYen: 200_000,
      valueYen: 250_000,
      pnlYen: 50_000,
      returnPct: 25,
      eligible: true,
    });
  });

  it("is not eligible without cost basis or snapshot", () => {
    const h = holding({ id: "h1", costBasisYen: 100_000 });
    expect(holdingPnl(h, undefined).eligible).toBe(false);
    expect(
      holdingPnl(holding({ id: "h2", costBasisYen: null }), snapshot({ holdingId: "h2", sessionId: "s1", totalValueYen: 100_000 }))
        .eligible,
    ).toBe(false);
  });
});

describe("portfolioPnlSummary", () => {
  const holdings = [
    holding({ id: "h1", assetClassId: "stocks", costBasisYen: 200_000, quantity: 10 }),
    holding({ id: "h2", assetClassId: "stocks", costBasisYen: null, quantity: 5 }),
    holding({ id: "h3", assetClassId: "collectibles", costBasisYen: 100_000, quantity: null }),
  ];
  const sessions = [session("s1", "2026-07-31")];
  const snapshots = [
    snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 25_000 }),
    snapshot({ holdingId: "h2", sessionId: "s1", unitPriceYen: 10_000 }),
    snapshot({ holdingId: "h3", sessionId: "s1", totalValueYen: 150_000 }),
  ];

  it("sums eligible holdings only", () => {
    expect(portfolioPnlSummary(holdings, sessions, snapshots)).toEqual({
      totalCostBasisYen: 300_000,
      totalValueYen: 400_000,
      totalPnlYen: 100_000,
      returnPct: (100_000 / 300_000) * 100,
      eligibleCount: 2,
      scopedCount: 3,
    });
  });

  it("scopes summary to one asset class", () => {
    expect(portfolioPnlSummary(holdings, sessions, snapshots, "stocks")).toEqual({
      totalCostBasisYen: 200_000,
      totalValueYen: 250_000,
      totalPnlYen: 50_000,
      returnPct: 25,
      eligibleCount: 1,
      scopedCount: 2,
    });
  });

  it("returns null when no eligible holdings", () => {
    expect(
      portfolioPnlSummary(
        [holding({ id: "h1", costBasisYen: null })],
        sessions,
        [snapshot({ holdingId: "h1", sessionId: "s1", totalValueYen: 100_000 })],
      ),
    ).toBeNull();
  });
});

describe("holdingsNeedCostBasisHint", () => {
  it("is true when snapshots exist but none are eligible", () => {
    const holdings = [holding({ id: "h1", costBasisYen: null })];
    const sessions = [session("s1", "2026-07-31")];
    const snapshots = [snapshot({ holdingId: "h1", sessionId: "s1", totalValueYen: 100_000 })];

    expect(holdingsNeedCostBasisHint(holdings, sessions, snapshots)).toBe(true);
  });

  it("is false when at least one holding is eligible", () => {
    const holdings = [
      holding({ id: "h1", costBasisYen: null }),
      holding({ id: "h2", costBasisYen: 50_000, quantity: null }),
    ];
    const sessions = [session("s1", "2026-07-31")];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", totalValueYen: 100_000 }),
      snapshot({ holdingId: "h2", sessionId: "s1", totalValueYen: 80_000 }),
    ];

    expect(holdingsNeedCostBasisHint(holdings, sessions, snapshots)).toBe(false);
  });
});

describe("allocationByAssetClassLatest", () => {
  it("uses latest snapshot per holding instead of earliest same-day session", () => {
    const holdings = [holding({ id: "h1", assetClassId: "collectibles", quantity: 10 })];
    const sessions = [
      session("s1", "2026-07-31", "2026-07-31T08:00:00Z"),
      session("s2", "2026-07-31", "2026-07-31T12:00:00Z"),
    ];
    const snapshots = [
      snapshot({ holdingId: "h1", sessionId: "s1", unitPriceYen: 0 }),
      snapshot({ holdingId: "h1", sessionId: "s2", unitPriceYen: 28_000 }),
    ];

    expect(allocationByAssetClassLatest(holdings, sessions, snapshots)).toEqual([
      { id: "collectibles", totalYen: 280_000 },
    ]);
    expect(allocationByAssetClass(holdings, snapshots, "s1")).toEqual([]);
  });
});
