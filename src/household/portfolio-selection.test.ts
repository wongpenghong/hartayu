import { describe, expect, it } from "vitest";
import {
  clearPortfolioSelection,
  hasPortfolioSelection,
  resolveScopedHoldingIds,
  toggleDonutSelection,
  toggleHoldingSelection,
  togglePortfolioSelectionId,
  type PortfolioSelection,
} from "./portfolio-selection";

describe("togglePortfolioSelectionId", () => {
  it("adds an id when absent", () => {
    expect(togglePortfolioSelectionId(new Set(), "h1")).toEqual(new Set(["h1"]));
  });

  it("removes an id when present", () => {
    expect(togglePortfolioSelectionId(new Set(["h1", "h2"]), "h1")).toEqual(
      new Set(["h2"]),
    );
  });
});

describe("hasPortfolioSelection", () => {
  it("is false when nothing is selected", () => {
    expect(hasPortfolioSelection({ kind: "none" })).toBe(false);
  });

  it("is true when holdings are selected", () => {
    expect(hasPortfolioSelection({ kind: "holdings", ids: new Set(["h1"]) })).toBe(true);
  });
});

describe("clearPortfolioSelection", () => {
  it("returns a new empty set", () => {
    expect(clearPortfolioSelection()).toEqual(new Set());
  });
});

describe("resolveScopedHoldingIds", () => {
  const holdings = [
    { id: "h1", assetClassId: "stocks" },
    { id: "h2", assetClassId: "stocks" },
    { id: "h3", assetClassId: "collectibles" },
  ];

  it("returns all visible holding ids when selection is empty", () => {
    const selection: PortfolioSelection = { kind: "none" };
    expect(
      resolveScopedHoldingIds(holdings, "all", selection).sort(),
    ).toEqual(["h1", "h2", "h3"]);
  });

  it("scopes to one asset class from the pill filter", () => {
    const selection: PortfolioSelection = { kind: "none" };
    expect(resolveScopedHoldingIds(holdings, "stocks", selection).sort()).toEqual([
      "h1",
      "h2",
    ]);
  });

  it("scopes to selected asset classes when viewing all", () => {
    const selection: PortfolioSelection = {
      kind: "assetClasses",
      ids: new Set(["stocks"]),
    };
    expect(resolveScopedHoldingIds(holdings, "all", selection).sort()).toEqual([
      "h1",
      "h2",
    ]);
  });

  it("scopes to selected holdings", () => {
    const selection: PortfolioSelection = {
      kind: "holdings",
      ids: new Set(["h1", "h3"]),
    };
    expect(resolveScopedHoldingIds(holdings, "all", selection).sort()).toEqual([
      "h1",
      "h3",
    ]);
  });

  it("composes pill filter with holding selection", () => {
    const selection: PortfolioSelection = {
      kind: "holdings",
      ids: new Set(["h1", "h3"]),
    };
    expect(resolveScopedHoldingIds(holdings, "stocks", selection)).toEqual(["h1"]);
  });
});

describe("toggleDonutSelection", () => {
  it("starts asset class selection in all view", () => {
    expect(toggleDonutSelection({ kind: "none" }, "all", "stocks")).toEqual({
      kind: "assetClasses",
      ids: new Set(["stocks"]),
    });
  });

  it("starts holding selection in class view", () => {
    expect(toggleDonutSelection({ kind: "none" }, "stocks", "h1")).toEqual({
      kind: "holdings",
      ids: new Set(["h1"]),
    });
  });
});

describe("toggleHoldingSelection", () => {
  it("replaces asset class selection with a holding selection", () => {
    expect(
      toggleHoldingSelection({ kind: "assetClasses", ids: new Set(["stocks"]) }, "h1"),
    ).toEqual({
      kind: "holdings",
      ids: new Set(["h1"]),
    });
  });
});
