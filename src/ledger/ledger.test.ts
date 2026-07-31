import { describe, expect, it } from "vitest";
import {
  balanceForPocket,
  balancesByPocket,
  budgetPace,
  expenseTotalForDate,
  expenseTotalForDateRange,
  expenseTotalsByCategory,
  expenseTotalsByMember,
  expenseTotalsByPocket,
  expenseTotalsByRecentMonths,
  filterEntries,
  groupEntriesByDay,
  householdBalance,
  monthlyTotals,
  monthlyTotalsByCategory,
  recentCategoryIds,
  recentEntries,
  remainingBudgetByCategory,
  trendPercent,
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
    toPocketId: null,
    categoryId: "cat-a",
    memberId: "member-a",
    attributedMemberId: "member-a",
    billId: null,
    foreignAmountIdr: null,
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

  it("filters entries by pocket, category, and month", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 1_000,
        entryDate: "2026-07-01",
      }),
      entry({
        id: "2",
        pocketId: "pocket-b",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 2_000,
        entryDate: "2026-07-02",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        categoryId: "cat-salary",
        kind: "income",
        amountYen: 300_000,
        entryDate: "2026-06-30",
      }),
    ];

    expect(filterEntries(entries, { pocketId: "pocket-a" })).toHaveLength(2);
    expect(filterEntries(entries, { categoryId: "cat-food" })).toHaveLength(2);
    expect(
      filterEntries(entries, { year: 2026, month: 7, pocketId: "pocket-a" }),
    ).toEqual([entries[0]]);
  });

  it("groups monthly totals by category", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 1_500,
        entryDate: "2026-07-01",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 500,
        entryDate: "2026-07-10",
      }),
      entry({
        id: "3",
        pocketId: "pocket-b",
        categoryId: "cat-salary",
        kind: "income",
        amountYen: 400_000,
        entryDate: "2026-07-05",
      }),
      entry({
        id: "4",
        pocketId: "pocket-a",
        categoryId: "cat-rent",
        kind: "expense",
        amountYen: 80_000,
        entryDate: "2026-06-30",
      }),
    ];

    expect(monthlyTotalsByCategory(entries, 2026, 7)).toEqual([
      {
        categoryId: "cat-salary",
        kind: "income",
        totalYen: 400_000,
      },
      {
        categoryId: "cat-food",
        kind: "expense",
        totalYen: 2_000,
      },
    ]);
  });

  it("sums daily and weekly spending with trend", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 1_000,
        entryDate: "2026-07-17",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 500,
        entryDate: "2026-07-16",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 300,
        entryDate: "2026-07-14",
      }),
    ];

    expect(expenseTotalForDate(entries, "2026-07-17")).toBe(1_000);
    expect(
      expenseTotalForDateRange(entries, "2026-07-14", "2026-07-17"),
    ).toBe(1_800);
    expect(trendPercent(1_000, 500)).toBe(100);
    expect(trendPercent(0, 0)).toBe(0);
    expect(trendPercent(100, 0)).toBeNull();
  });

  it("builds expense breakdown segments", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 800,
        entryDate: "2026-07-01",
      }),
      entry({
        id: "2",
        pocketId: "pocket-b",
        categoryId: "cat-rent",
        kind: "expense",
        amountYen: 1_200,
        entryDate: "2026-07-02",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 200,
        entryDate: "2026-06-01",
      }),
    ];

    expect(expenseTotalsByCategory(entries, 2026, 7)).toEqual([
      { id: "cat-rent", totalYen: 1_200 },
      { id: "cat-food", totalYen: 800 },
    ]);
    expect(expenseTotalsByPocket(entries, 2026, 7)).toEqual([
      { id: "pocket-b", totalYen: 1_200 },
      { id: "pocket-a", totalYen: 800 },
    ]);
    expect(expenseTotalsByMember(entries, 2026, 7)).toEqual([
      { id: "member-a", totalYen: 2_000 },
    ]);
    expect(expenseTotalsByRecentMonths(entries, 2026, 7, 2)).toEqual([
      { id: "2026-06", year: 2026, month: 6, totalYen: 200 },
      { id: "2026-07", year: 2026, month: 7, totalYen: 2_000 },
    ]);
  });

  it("groups member breakdown by attribution including family", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 100_000,
        entryDate: "2026-07-01",
        memberId: "member-a",
        attributedMemberId: null,
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 500,
        entryDate: "2026-07-02",
        memberId: "member-a",
        attributedMemberId: "member-b",
      }),
      entry({
        id: "3",
        pocketId: "pocket-b",
        kind: "expense",
        amountYen: 300,
        entryDate: "2026-07-03",
        memberId: "member-b",
        attributedMemberId: "member-b",
      }),
    ];

    expect(expenseTotalsByMember(entries, 2026, 7)).toEqual([
      { id: "family", totalYen: 100_000 },
      { id: "member-b", totalYen: 800 },
    ]);
  });

  it("ignores foreign amount IDR in JPY rollups", () => {
    const jpyOnly: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 850,
        entryDate: "2026-07-17",
      }),
    ];
    const withIdr: Entry[] = [
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 850,
        foreignAmountIdr: 35_000_000,
        entryDate: "2026-07-17",
      }),
    ];

    expect(householdBalance(withIdr, pockets)).toBe(
      householdBalance(jpyOnly, pockets),
    );
    expect(monthlyTotals(withIdr, 2026, 7)).toEqual(
      monthlyTotals(jpyOnly, 2026, 7),
    );
    expect(expenseTotalsByCategory(withIdr, 2026, 7)).toEqual(
      expenseTotalsByCategory(jpyOnly, 2026, 7),
    );
  });

  it("returns newest entries first", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 100,
        entryDate: "2026-07-01",
        createdAt: "2026-07-01T10:00:00Z",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 200,
        entryDate: "2026-07-02",
        createdAt: "2026-07-02T10:00:00Z",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 300,
        entryDate: "2026-07-02",
        createdAt: "2026-07-02T12:00:00Z",
      }),
    ];

    expect(recentEntries(entries, 2).map((row) => row.id)).toEqual(["3", "2"]);
  });

  it("returns recent category ids by newest use", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 100,
        entryDate: "2026-07-01",
        createdAt: "2026-07-01T10:00:00Z",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        categoryId: "cat-transport",
        kind: "expense",
        amountYen: 200,
        entryDate: "2026-07-02",
        createdAt: "2026-07-02T10:00:00Z",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 300,
        entryDate: "2026-07-03",
        createdAt: "2026-07-03T10:00:00Z",
      }),
      entry({
        id: "4",
        pocketId: "pocket-a",
        categoryId: "cat-salary",
        kind: "income",
        amountYen: 400_000,
        entryDate: "2026-07-04",
        createdAt: "2026-07-04T10:00:00Z",
      }),
    ];

    expect(recentCategoryIds(entries, "expense", 5)).toEqual([
      "cat-food",
      "cat-transport",
    ]);
    expect(recentCategoryIds(entries, "income", 5)).toEqual(["cat-salary"]);
  });

  it("groups entries by day newest first", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 100,
        entryDate: "2026-07-01",
        createdAt: "2026-07-01T10:00:00Z",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 200,
        entryDate: "2026-07-02",
        createdAt: "2026-07-02T10:00:00Z",
      }),
      entry({
        id: "3",
        pocketId: "pocket-a",
        kind: "expense",
        amountYen: 300,
        entryDate: "2026-07-02",
        createdAt: "2026-07-02T12:00:00Z",
      }),
    ];

    expect(groupEntriesByDay(entries)).toEqual([
      { date: "2026-07-02", entries: [entries[2], entries[1]] },
      { date: "2026-07-01", entries: [entries[0]] },
    ]);
  });

  it("computes budget pace and remaining budget rows", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        categoryId: "cat-food",
        kind: "expense",
        amountYen: 15_000,
        entryDate: "2026-07-15",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        categoryId: "cat-rent",
        kind: "expense",
        amountYen: 80_000,
        entryDate: "2026-07-10",
      }),
    ];

    expect(budgetPace(15_000, 30_000, 2026, 7, "2026-07-15")).toEqual({
      daysInMonth: 31,
      daysElapsed: 15,
      daysLeft: 17,
      spentYen: 15_000,
      limitYen: 30_000,
      remainingYen: 15_000,
      projectedSpendYen: 31_000,
      dailyAllowanceYen: 882,
    });

    expect(
      remainingBudgetByCategory(
        entries,
        [
          {
            id: "cat-food",
            kind: "expense",
            monthly_limit_yen: 30_000,
          },
          {
            id: "cat-rent",
            kind: "expense",
            monthly_limit_yen: 100_000,
          },
          {
            id: "cat-salary",
            kind: "income",
            monthly_limit_yen: null,
          },
        ],
        2026,
        7,
        2,
      ),
    ).toEqual([
      {
        categoryId: "cat-rent",
        spentYen: 80_000,
        limitYen: 100_000,
        remainingYen: 20_000,
      },
      {
        categoryId: "cat-food",
        spentYen: 15_000,
        limitYen: 30_000,
        remainingYen: 15_000,
      },
    ]);
  });

  it("shifts pocket balances for transfers without changing household net", () => {
    const entries: Entry[] = [
      entry({
        id: "1",
        pocketId: "pocket-a",
        toPocketId: "pocket-b",
        categoryId: null,
        kind: "transfer",
        amountYen: 50_000,
        entryDate: "2026-07-10",
      }),
      entry({
        id: "2",
        pocketId: "pocket-a",
        kind: "income",
        amountYen: 100_000,
        entryDate: "2026-07-01",
      }),
    ];

    expect(balanceForPocket(entries, "pocket-a")).toBe(50_000);
    expect(balanceForPocket(entries, "pocket-b")).toBe(50_000);
    expect(householdBalance(entries, pockets)).toBe(100_000);
    expect(monthlyTotals(entries, 2026, 7)).toEqual({
      incomeYen: 100_000,
      expenseYen: 0,
      netYen: 100_000,
    });
    expect(expenseTotalsByCategory(entries, 2026, 7)).toEqual([]);
  });
});
