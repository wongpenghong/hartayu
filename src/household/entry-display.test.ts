import { describe, expect, it } from "vitest";
import {
  expensePocketBalanceWarning,
  pocketBalanceForEntryForm,
} from "@/household/entry-display";
import type { Entry } from "@/ledger/types";

function entry(
  overrides: Pick<Entry, "id" | "pocketId" | "kind" | "amountYen" | "entryDate"> &
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

describe("pocketBalanceForEntryForm", () => {
  const entries: Entry[] = [
    entry({
      id: "1",
      pocketId: "pocket-a",
      kind: "income",
      amountYen: 10_000,
      entryDate: "2026-07-01",
    }),
    entry({
      id: "2",
      pocketId: "pocket-a",
      kind: "expense",
      amountYen: 3_000,
      entryDate: "2026-07-02",
    }),
  ];

  it("returns live balance for a new entry", () => {
    expect(pocketBalanceForEntryForm(entries, "pocket-a", null)).toBe(7_000);
  });

  it("excludes the entry being edited", () => {
    expect(pocketBalanceForEntryForm(entries, "pocket-a", entries[1])).toBe(10_000);
  });
});

describe("expensePocketBalanceWarning", () => {
  it("warns on empty pockets and overspend", () => {
    expect(expensePocketBalanceWarning(0, 1_000)).toMatch(/empty/i);
    expect(expensePocketBalanceWarning(500, 1_000)).toMatch(/exceeds/i);
    expect(expensePocketBalanceWarning(1_000, 500)).toBeNull();
  });
});
