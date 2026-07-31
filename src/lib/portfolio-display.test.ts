import { describe, expect, it } from "vitest";
import {
  formatHoldingPnlLine,
  formatReturnPct,
  formatSignedYen,
  formatSignedYenCompact,
  pnlTextClass,
  pnlTone,
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
    expect(formatHoldingPnlLine(80_000, 40)).toBe("+¥80,000 +40.0%");
  });
});

describe("pnlTextClass", () => {
  it("maps tones to colors", () => {
    expect(pnlTextClass("gain")).toContain("#34c759");
    expect(pnlTextClass("loss")).toContain("#ff3b30");
  });
});
