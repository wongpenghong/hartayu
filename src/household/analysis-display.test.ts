import { describe, expect, it } from "vitest";
import {
  analysisQuickSummary,
  formatSavingsRatio,
} from "@/household/analysis-display";
import type { Entry } from "@/ledger/types";

const entries: Entry[] = [
  {
    id: "e-1",
    pocketId: "p-1",
    toPocketId: null,
    categoryId: "food",
    memberId: "member-a",
    attributedMemberId: null,
    billId: null,
    kind: "expense",
    amountYen: 3_100,
    foreignAmountIdr: null,
    exchangeRateIdrToJpy: null,
    entryDate: "2026-07-10",
    note: null,
    createdAt: "2026-07-10T00:00:00Z",
  },
  {
    id: "e-2",
    pocketId: "p-1",
    toPocketId: null,
    categoryId: "food",
    memberId: "member-a",
    attributedMemberId: null,
    billId: null,
    kind: "expense",
    amountYen: 900,
    foreignAmountIdr: null,
    exchangeRateIdrToJpy: null,
    entryDate: "2026-07-20",
    note: null,
    createdAt: "2026-07-20T00:00:00Z",
  },
  {
    id: "e-3",
    pocketId: "p-1",
    toPocketId: null,
    categoryId: "salary",
    memberId: "member-a",
    attributedMemberId: null,
    billId: null,
    kind: "income",
    amountYen: 10_000,
    foreignAmountIdr: null,
    exchangeRateIdrToJpy: null,
    entryDate: "2026-07-01",
    note: null,
    createdAt: "2026-07-01T00:00:00Z",
  },
];

describe("analysisQuickSummary", () => {
  it("computes spend, savings, and top category for a month", () => {
    expect(analysisQuickSummary(entries, 2026, 7, "2026-07-31")).toEqual({
      avgDailySpendYen: 129,
      topExpenseCategoryId: "food",
      topExpenseCategoryYen: 4_000,
      savingsYen: 6_000,
      savingsRatio: 0.6,
    });
  });

  it("uses full month length for past months", () => {
    expect(
      analysisQuickSummary(entries, 2026, 6, "2026-07-31").avgDailySpendYen,
    ).toBe(0);
  });
});

describe("formatSavingsRatio", () => {
  it("formats percent and empty income", () => {
    expect(formatSavingsRatio(0.6)).toBe("60%");
    expect(formatSavingsRatio(null)).toBe("—");
  });
});
