import { describe, expect, it } from "vitest";
import {
  formatHoldingPnlLine,
  formatPnlCoverageNote,
  formatPortfolioSummaryNote,
  formatReturnPct,
  formatSignedYen,
  formatSignedYenCompact,
  pnlTextClassOnDark,
  pnlTone,
  portfolioValueRatio,
} from "./portfolio-display";

describe("pnlTone", () => {
  it("classifies gain, loss, flat, and missing", () => {
    expect(pnlTone(100)).toBe("gain");
    expect(pnlTone(-1)).toBe("loss");
    expect(pnlTone(0)).toBe("flat");
    expect(pnlTone(null)).toBe("na");
  });
});

describe("formatSignedYen", () => {
  it("prefixes sign for non-zero amounts", () => {
    expect(formatSignedYen(20_000)).toBe("+¥20,000");
    expect(formatSignedYen(-15_000)).toBe("−¥15,000");
    expect(formatSignedYen(0)).toBe("¥0");
  });
});

describe("formatSignedYenCompact", () => {
  it("prefixes sign for non-zero amounts", () => {
    expect(formatSignedYenCompact(20_000)).toBe("+¥2万");
    expect(formatSignedYenCompact(-15_000)).toBe("−¥1.5万");
    expect(formatSignedYenCompact(0)).toBe("¥0");
  });
});

describe("formatReturnPct", () => {
  it("formats signed percentages with one decimal", () => {
    expect(formatReturnPct(12.44)).toBe("+12.4%");
    expect(formatReturnPct(-3.21)).toBe("−3.2%");
    expect(formatReturnPct(0)).toBe("0.0%");
  });
});

describe("formatHoldingPnlLine", () => {
  it("joins yen and percent", () => {
    expect(formatHoldingPnlLine(80_000, 40)).toBe("+¥80,000 · +40.0%");
  });
});

describe("formatPnlCoverageNote", () => {
  it("omits partial wording when all holdings qualify", () => {
    expect(formatPnlCoverageNote(20, 20)).toBe("20 holdings");
    expect(formatPnlCoverageNote(16, 20)).toBe("P&L for 16 of 20 holdings");
  });
});

describe("formatPortfolioSummaryNote", () => {
  it("deduplicates matching valued and P&L counts", () => {
    expect(
      formatPortfolioSummaryNote(16, 20, { eligibleCount: 16, scopedCount: 20 }),
    ).toBe("P&L for 16 of 20 holdings");
  });

  it("keeps both notes when counts differ", () => {
    expect(
      formatPortfolioSummaryNote(18, 20, { eligibleCount: 16, scopedCount: 20 }),
    ).toBe("18 of 20 valued · P&L for 16 of 20 holdings");
  });
});

describe("portfolioValueRatio", () => {
  it("returns value as a fraction of cost, capped at 1", () => {
    expect(portfolioValueRatio(35_000_000, 34_800_000)).toBeCloseTo(0.994, 3);
    expect(portfolioValueRatio(791_680, 1_591_398)).toBe(1);
    expect(portfolioValueRatio(0, 100)).toBe(0);
  });
});

describe("pnlTextClassOnDark", () => {
  it("maps tones to light-on-dark colors", () => {
    expect(pnlTextClassOnDark("gain")).toContain("#5de27a");
    expect(pnlTextClassOnDark("loss")).toContain("#ff8a98");
  });
});
