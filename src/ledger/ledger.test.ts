import { describe, expect, it } from "vitest";
import {
  balanceForAccount,
  balancesByAccount,
  householdBalance,
  monthlyTotals,
} from "./ledger";
import type { Account, Entry } from "./types";

const accounts: Account[] = [
  { id: "acct-a" },
  { id: "acct-b" },
  { id: "acct-archived", archivedAt: "2026-01-01" },
];

describe("household ledger operations", () => {
  it("returns zero balances and monthly totals for an empty ledger", () => {
    expect(balanceForAccount([], "acct-a")).toBe(0);
    expect(balancesByAccount([], accounts)).toEqual([
      { accountId: "acct-a", balanceYen: 0 },
      { accountId: "acct-b", balanceYen: 0 },
    ]);
    expect(householdBalance([], accounts)).toBe(0);
    expect(monthlyTotals([], 2026, 7)).toEqual({
      incomeYen: 0,
      expenseYen: 0,
      netYen: 0,
    });
  });

  it("computes balance from income-only entries", () => {
    const entries: Entry[] = [
      {
        id: "1",
        accountId: "acct-a",
        kind: "income",
        amountYen: 300_000,
        entryDate: "2026-07-01",
      },
    ];

    expect(balanceForAccount(entries, "acct-a")).toBe(300_000);
    expect(householdBalance(entries, accounts)).toBe(300_000);
    expect(monthlyTotals(entries, 2026, 7)).toEqual({
      incomeYen: 300_000,
      expenseYen: 0,
      netYen: 300_000,
    });
  });

  it("computes balance from expense-only entries", () => {
    const entries: Entry[] = [
      {
        id: "1",
        accountId: "acct-b",
        kind: "expense",
        amountYen: 1_500,
        entryDate: "2026-07-15",
      },
    ];

    expect(balanceForAccount(entries, "acct-b")).toBe(-1_500);
    expect(householdBalance(entries, accounts)).toBe(-1_500);
    expect(monthlyTotals(entries, 2026, 7)).toEqual({
      incomeYen: 0,
      expenseYen: 1_500,
      netYen: -1_500,
    });
  });

  it("computes mixed entries per account and for the month", () => {
    const entries: Entry[] = [
      {
        id: "1",
        accountId: "acct-a",
        kind: "income",
        amountYen: 400_000,
        entryDate: "2026-07-01",
      },
      {
        id: "2",
        accountId: "acct-a",
        kind: "expense",
        amountYen: 12_000,
        entryDate: "2026-07-10",
      },
      {
        id: "3",
        accountId: "acct-b",
        kind: "expense",
        amountYen: 3_000,
        entryDate: "2026-07-10",
      },
      {
        id: "4",
        accountId: "acct-a",
        kind: "expense",
        amountYen: 999,
        entryDate: "2026-06-30",
      },
    ];

    expect(balanceForAccount(entries, "acct-a")).toBe(387_001);
    expect(balanceForAccount(entries, "acct-b")).toBe(-3_000);
    expect(balancesByAccount(entries, accounts)).toEqual([
      { accountId: "acct-a", balanceYen: 387_001 },
      { accountId: "acct-b", balanceYen: -3_000 },
    ]);
    expect(householdBalance(entries, accounts)).toBe(384_001);
    expect(monthlyTotals(entries, 2026, 7)).toEqual({
      incomeYen: 400_000,
      expenseYen: 15_000,
      netYen: 385_000,
    });
  });

  it("excludes archived accounts from household balance rollups", () => {
    const entries: Entry[] = [
      {
        id: "1",
        accountId: "acct-archived",
        kind: "income",
        amountYen: 50_000,
        entryDate: "2026-07-01",
      },
      {
        id: "2",
        accountId: "acct-a",
        kind: "income",
        amountYen: 10_000,
        entryDate: "2026-07-01",
      },
    ];

    expect(householdBalance(entries, accounts)).toBe(10_000);
  });
});
