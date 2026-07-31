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

function sessionsById(sessions: SnapshotSession[]): Map<string, SnapshotSession> {
  return new Map(sessions.map((row) => [row.id, row]));
}

export function compareSnapshotSessions(
  sessionA: SnapshotSession | undefined,
  sessionB: SnapshotSession | undefined,
): number {
  const byDate = (sessionB?.asOfDate ?? "").localeCompare(sessionA?.asOfDate ?? "");
  if (byDate !== 0) {
    return byDate;
  }
  return (sessionB?.createdAt ?? "").localeCompare(sessionA?.createdAt ?? "");
}

export function latestSnapshotsByHolding(
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
): Map<string, HoldingSnapshot> {
  const sessionLookup = sessionsById(sessions);
  const sorted = [...snapshots].sort((a, b) =>
    compareSnapshotSessions(
      sessionLookup.get(a.sessionId),
      sessionLookup.get(b.sessionId),
    ),
  );
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
  const sortedSessions = [...sessions].sort((a, b) => compareSnapshotSessions(a, b));
  const byDate = new Map<string, { date: string; totalYen: number }>();

  for (const sessionRow of sortedSessions) {
    if (byDate.has(sessionRow.asOfDate)) {
      continue;
    }
    const totalYen = sessionTotalYen(sessionRow, holdingIds, holdingsById, snapshots);
    byDate.set(sessionRow.asOfDate, { date: sessionRow.asOfDate, totalYen });
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type PortfolioTrendSessionPoint = {
  date: string;
  label: string;
  caption: string;
  value: number;
};

function sessionTotalYen(
  sessionRow: SnapshotSession,
  holdingIds: Set<string>,
  holdingsById: Map<string, Holding>,
  snapshots: HoldingSnapshot[],
): number {
  const sessionSnapshots = snapshots.filter(
    (row) => row.sessionId === sessionRow.id && holdingIds.has(row.holdingId),
  );
  return sessionSnapshots.reduce((sum, row) => {
    const holding = holdingsById.get(row.holdingId);
    if (!holding) {
      return sum;
    }
    return sum + holdingValueYen(holding, row);
  }, 0);
}

function sessionTimeLabel(createdAt: string, withSeconds = false): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    ...(withSeconds ? { second: "2-digit" } : {}),
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(new Date(createdAt));
}

export function portfolioTrendSessionPoints(
  sessions: SnapshotSession[],
  holdings: Holding[],
  snapshots: HoldingSnapshot[],
  filterAssetClassId?: string | null,
): PortfolioTrendSessionPoint[] {
  const scopedHoldings = filterAssetClassId
    ? holdings.filter((holding) => holding.assetClassId === filterAssetClassId)
    : holdings;
  const holdingIds = new Set(scopedHoldings.map((holding) => holding.id));
  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const chronological = [...sessions].sort((a, b) => -compareSnapshotSessions(a, b));
  const dateCounts = new Map<string, number>();
  for (const sessionRow of chronological) {
    dateCounts.set(sessionRow.asOfDate, (dateCounts.get(sessionRow.asOfDate) ?? 0) + 1);
  }

  return chronological.map((sessionRow) => {
    const [, month, day] = sessionRow.asOfDate.split("-");
    const sameDayCount = dateCounts.get(sessionRow.asOfDate) ?? 1;
    const useTime = sameDayCount > 1;
    const timeLabel = sessionTimeLabel(sessionRow.createdAt, useTime);
    const label = useTime ? timeLabel : `${month}-${day}`;
    return {
      date: sessionRow.asOfDate,
      label,
      caption: useTime ? `${month}/${day} ${timeLabel}` : "",
      value: sessionTotalYen(sessionRow, holdingIds, holdingsById, snapshots),
    };
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
  return [...sessions].sort((a, b) => compareSnapshotSessions(a, b))[0].id;
}

export function allocationByAssetClassLatest(
  holdings: Holding[],
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
): SegmentTotal[] {
  const latest = latestSnapshotsByHolding(sessions, snapshots);
  const holdingsById = new Map(holdings.map((holding) => [holding.id, holding]));
  const totals = new Map<string, number>();

  for (const [holdingId, row] of latest) {
    const holding = holdingsById.get(holdingId);
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

export function allocationByHoldingLatest(
  holdings: Holding[],
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
  assetClassId: string,
): SegmentTotal[] {
  const latest = latestSnapshotsByHolding(sessions, snapshots);
  const scopedHoldings = holdings.filter((holding) => holding.assetClassId === assetClassId);
  const holdingsById = new Map(scopedHoldings.map((holding) => [holding.id, holding]));

  return [...latest.entries()]
    .filter(([holdingId]) => holdingsById.has(holdingId))
    .map(([holdingId, row]) => {
      const holding = holdingsById.get(holdingId)!;
      return { id: holding.id, totalYen: holdingValueYen(holding, row) };
    })
    .filter((row) => row.totalYen > 0)
    .sort((a, b) => b.totalYen - a.totalYen);
}

export type HoldingPnl = {
  holdingId: string;
  costBasisYen: number | null;
  valueYen: number | null;
  pnlYen: number | null;
  returnPct: number | null;
  eligible: boolean;
};

export function holdingPnl(
  holding: Holding,
  snapshot: HoldingSnapshot | undefined,
): HoldingPnl {
  const costBasisYen = holding.costBasisYen;
  if (snapshot == null || costBasisYen == null) {
    return {
      holdingId: holding.id,
      costBasisYen,
      valueYen: snapshot != null ? holdingValueYen(holding, snapshot) : null,
      pnlYen: null,
      returnPct: null,
      eligible: false,
    };
  }

  const valueYen = holdingValueYen(holding, snapshot);
  const pnlYen = valueYen - costBasisYen;
  const returnPct = (pnlYen / costBasisYen) * 100;

  return {
    holdingId: holding.id,
    costBasisYen,
    valueYen,
    pnlYen,
    returnPct,
    eligible: true,
  };
}

export type PortfolioPnlSummary = {
  totalCostBasisYen: number;
  totalValueYen: number;
  totalPnlYen: number;
  returnPct: number;
  eligibleCount: number;
  scopedCount: number;
};

export function portfolioPnlSummary(
  holdings: Holding[],
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
  filterAssetClassId?: string | null,
): PortfolioPnlSummary | null {
  const scopedHoldings = filterAssetClassId
    ? holdings.filter((holding) => holding.assetClassId === filterAssetClassId)
    : holdings;
  const latest = latestSnapshotsByHolding(sessions, snapshots);

  let totalCostBasisYen = 0;
  let totalValueYen = 0;
  let eligibleCount = 0;

  for (const holding of scopedHoldings) {
    const row = holdingPnl(holding, latest.get(holding.id));
    if (!row.eligible || row.costBasisYen == null || row.valueYen == null) {
      continue;
    }
    eligibleCount += 1;
    totalCostBasisYen += row.costBasisYen;
    totalValueYen += row.valueYen;
  }

  if (eligibleCount === 0) {
    return null;
  }

  const totalPnlYen = totalValueYen - totalCostBasisYen;

  return {
    totalCostBasisYen,
    totalValueYen,
    totalPnlYen,
    returnPct: (totalPnlYen / totalCostBasisYen) * 100,
    eligibleCount,
    scopedCount: scopedHoldings.length,
  };
}

export function holdingsNeedCostBasisHint(
  holdings: Holding[],
  sessions: SnapshotSession[],
  snapshots: HoldingSnapshot[],
  filterAssetClassId?: string | null,
): boolean {
  const scopedHoldings = filterAssetClassId
    ? holdings.filter((holding) => holding.assetClassId === filterAssetClassId)
    : holdings;
  const latest = latestSnapshotsByHolding(sessions, snapshots);
  const hasSnapshot = scopedHoldings.some((holding) => latest.has(holding.id));
  const hasEligible = scopedHoldings.some(
    (holding) => holdingPnl(holding, latest.get(holding.id)).eligible,
  );
  return hasSnapshot && !hasEligible;
}
