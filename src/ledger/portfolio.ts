import type { SegmentTotal } from "./types";

export type Holding = {
  id: string;
  assetClassId: string;
  name: string;
  quantity: number | null;
  costBasisYen: number | null;
};

export type HoldingSnapshot = {
  id: string;
  sessionId: string;
  holdingId: string;
  unitPriceYen: number | null;
  totalValueYen: number | null;
  carriedForward: boolean;
};

export type SnapshotSession = {
  id: string;
  asOfDate: string;
  createdAt: string;
};

export function holdingValueYen(holding: Holding, snapshot: HoldingSnapshot): number {
  if (snapshot.totalValueYen != null) {
    return snapshot.totalValueYen;
  }
  if (snapshot.unitPriceYen != null && holding.quantity != null) {
    return Math.round(snapshot.unitPriceYen * holding.quantity);
  }
  return 0;
}

export function latestSnapshotsByHolding(
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
): Map<string, HoldingSnapshot> {
  const sessionDates = new Map(sessions.map((row) => [row.id, row.asOfDate]));
  const sorted = [...snapshots].sort((a, b) => {
    const dateA = sessionDates.get(a.sessionId) ?? "";
    const dateB = sessionDates.get(b.sessionId) ?? "";
    return dateB.localeCompare(dateA);
  });
  const latest = new Map<string, HoldingSnapshot>();
  for (const row of sorted) {
    if (!latest.has(row.holdingId)) {
      latest.set(row.holdingId, row);
    }
  }
  return latest;
}

export function portfolioTrendPoints(
  sessions: SnapshotSession[],
  holdings: Holding[],
  snapshots: HoldingSnapshot[],
  filterAssetClassId?: string | null,
): { date: string; totalYen: number }[] {
  const scopedHoldings = filterAssetClassId
    ? holdings.filter((holding) => holding.assetClassId === filterAssetClassId)
    : holdings;
  const holdingIds = new Set(scopedHoldings.map((holding) => holding.id));
  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const sortedSessions = [...sessions].sort((a, b) => a.asOfDate.localeCompare(b.asOfDate));

  return sortedSessions.map((sessionRow) => {
    const sessionSnapshots = snapshots.filter(
      (row) => row.sessionId === sessionRow.id && holdingIds.has(row.holdingId),
    );
    const totalYen = sessionSnapshots.reduce((sum, row) => {
      const holding = holdingsById.get(row.holdingId);
      if (!holding) {
        return sum;
      }
      return sum + holdingValueYen(holding, row);
    }, 0);
    return { date: sessionRow.asOfDate, totalYen };
  });
}

export function allocationByAssetClass(
  holdings: Holding[],
  snapshots: HoldingSnapshot[],
  sessionId: string,
): SegmentTotal[] {
  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const totals = new Map<string, number>();

  for (const row of snapshots.filter((snapshotRow) => snapshotRow.sessionId === sessionId)) {
    const holding = holdingsById.get(row.holdingId);
    if (!holding) {
      continue;
    }
    const value = holdingValueYen(holding, row);
    totals.set(holding.assetClassId, (totals.get(holding.assetClassId) ?? 0) + value);
  }

  return [...totals.entries()]
    .map(([id, totalYen]) => ({ id, totalYen }))
    .filter((row) => row.totalYen > 0)
    .sort((a, b) => b.totalYen - a.totalYen);
}

export function allocationByHolding(
  holdings: Holding[],
  snapshots: HoldingSnapshot[],
  sessionId: string,
  assetClassId: string,
): SegmentTotal[] {
  const scopedHoldings = holdings.filter((holding) => holding.assetClassId === assetClassId);
  const holdingsById = new Map(scopedHoldings.map((holding) => [holding.id, holding]));

  return snapshots
    .filter((row) => row.sessionId === sessionId && holdingsById.has(row.holdingId))
    .map((row) => {
      const holding = holdingsById.get(row.holdingId)!;
      return { id: holding.id, totalYen: holdingValueYen(holding, row) };
    })
    .filter((row) => row.totalYen > 0)
    .sort((a, b) => b.totalYen - a.totalYen);
}

export function latestSessionId(sessions: SnapshotSession[]): string | null {
  if (sessions.length === 0) {
    return null;
  }
  return [...sessions].sort((a, b) => b.asOfDate.localeCompare(a.asOfDate))[0].id;
}
