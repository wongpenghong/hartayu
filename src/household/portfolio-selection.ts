export type PortfolioSelection =
  | { kind: "none" }
  | { kind: "holdings"; ids: ReadonlySet<string> }
  | { kind: "assetClasses"; ids: ReadonlySet<string> };

export type ScopedHolding = {
  id: string;
  assetClassId: string;
};

export function togglePortfolioSelectionId(
  ids: ReadonlySet<string>,
  id: string,
): Set<string> {
  const next = new Set(ids);
  if (next.has(id)) {
    next.delete(id);
  } else {
    next.add(id);
  }
  return next;
}

export function hasPortfolioSelection(selection: PortfolioSelection): boolean {
  return selection.kind !== "none" && selection.ids.size > 0;
}

export function clearPortfolioSelection(): Set<string> {
  return new Set();
}

export function resolveScopedHoldingIds(
  holdings: ScopedHolding[],
  classFilter: string,
  selection: PortfolioSelection,
): string[] {
  let scoped =
    classFilter === "all"
      ? holdings
      : holdings.filter((holding) => holding.assetClassId === classFilter);

  if (selection.kind === "assetClasses" && classFilter === "all") {
    scoped = scoped.filter((holding) => selection.ids.has(holding.assetClassId));
  } else if (selection.kind === "holdings") {
    scoped = scoped.filter((holding) => selection.ids.has(holding.id));
  }

  return scoped.map((holding) => holding.id);
}

export function selectionKindForDonut(classFilter: string): "assetClasses" | "holdings" {
  return classFilter === "all" ? "assetClasses" : "holdings";
}

export function activeSelectionIds(selection: PortfolioSelection): ReadonlySet<string> {
  return selection.kind === "none" ? new Set() : selection.ids;
}

export function toggleDonutSelection(
  selection: PortfolioSelection,
  classFilter: string,
  segmentId: string,
): PortfolioSelection {
  const kind = selectionKindForDonut(classFilter);
  if (selection.kind !== kind) {
    return { kind, ids: new Set([segmentId]) };
  }

  const nextIds = togglePortfolioSelectionId(selection.ids, segmentId);
  return nextIds.size === 0 ? { kind: "none" } : { kind, ids: nextIds };
}

export function toggleHoldingSelection(
  selection: PortfolioSelection,
  holdingId: string,
): PortfolioSelection {
  if (selection.kind !== "holdings") {
    return { kind: "holdings", ids: new Set([holdingId]) };
  }

  const nextIds = togglePortfolioSelectionId(selection.ids, holdingId);
  return nextIds.size === 0 ? { kind: "none" } : { kind: "holdings", ids: nextIds };
}
