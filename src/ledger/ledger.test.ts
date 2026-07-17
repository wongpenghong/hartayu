import { describe, expect, it } from "vitest";
import {
  balanceForPocket,
  balancesByPocket,
  householdBalance,
  monthlyTotals,
} from "./ledger";
import type { Entry, Pocket } from "./types";

const pockets: Pocket[] = [
  { id: "pocket-a" },
  { id: "pocket-b" },
  { id: "pocket-archived", archivedAt: "2026-01-01T00:00:00Z" },
];

function entry(
  overrides: Pick<
    Entry,
    "id" | "pocketId" | "kind" | "amountYen" | "entryDate"
  > &
    Partial<Entry>,
): Entry {
  return {
    categoryId: "cat-a",
    memberId: "member-a",
    note: null,
    createdAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("ledger", () => {
  it("returns zero balances for empty inputs", () => {
    expect(balanceForPocket([], "pocket-a")).toBe(0);
    expect(balancesByPocket([], pockets)).toEqual([
      { pocketId: "pocket-a", balanceYen: 0 },
      { pocketId: "pocket-b", balanceYen: 0 },
    ]);
    expect(householdBalance([], pockets)).toBe(0);
    expect(monthlyTotals([], 2026, 7)).toEqual({
      incomeYen: 0,
      expenseYen: 0,
      netYen: 0,
    });
  });

  it("sums income for a single pocket", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "income",
        amountYen: 300_000,
        entryDate: "2026-07-01",
      }),
    ];

    expect(balanceForPocket(entries, "pocket-a")).toBe(300_000);
    expect(householdBalance(entries, pockets)).toBe(300_000);
  });

  it("subtracts expenses from pocket balance", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-b",
        kind: "expense",
        amountYen: 1_500,
        entryDate: "2026-07-02",
      }),
    ];

    expect(balanceForPocket(entries, "pocket-b")).toBe(-1_500);
    expect(householdBalance(entries, pockets)).toBe(-1_500);
  });

  it("computes mixed entries per pocket and for the month", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "income",
        amountYen: 400_000,
        entryDate: "2026-07-01",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 12_999,
        entryDate: "2026-07-05",
      }),
      entry({
        id: "3",
        pocketId: "pocket-b",
        kind: "expense",
        amountYen: 3_000,
        entryDate: "2026-06-30",
      }),
      entry({
        id: "4",
        pocketId: "pocket-a",
        kind: "income",
        amountYen: 1,
        entryDate: "2026-07-31",
      }),
    ];

    expect(balanceForPocket(entries, "pocket-a")).toBe(387_002);
    expect(balanceForPocket(entries, "pocket-b")).toBe(-3_000);
    expect(balancesByPocket(entries, pockets)).toEqual([
      { pocketId: "pocket-a", balanceYen: 387_002 },
      { pocketId: "pocket-b", balanceYen: -3_000 },
    ]);
    expect(householdBalance(entries, pockets)).toBe(384_002);
    expect(monthlyTotals(entries, 2026, 7)).toEqual({
      incomeYen: 400_001,
      expenseYen: 12_999,
      netYen: 387_002,
    });
  });

  it("excludes archived pockets from household balance rollups", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-archived",
        kind: "income",
        amountYen: 999_999,
        entryDate: "2026-07-01",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "income",
        amountYen: 10_000,
        entryDate: "2026-07-01",
      }),
    ];

    expect(householdBalance(entries, pockets)).toBe(10_000);
  });
});
