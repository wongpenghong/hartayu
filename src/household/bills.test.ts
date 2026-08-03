import { describe, expect, it } from "vitest";
import {
  billPayNote,
  currentPeriodInTokyo,
  isBillOverdue,
  isBillUnpaid,
  unpaidBillsForPeriod,
  validateBillAmount,
  validateBillName,
  validateDueDay,
} from "@/household/bills";
import type { Bill } from "@/ledger/types";

function sampleBill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: "bill-1",
    name: "Rent",
    amountYen: 120_000,
    dueDay: 25,
    categoryId: "cat-1",
    defaultPocketId: null,
    defaultAttributedMemberId: null,
    lastPaidPeriod: null,
    isActive: true,
    createdAt: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("validateBillName", () => {
  it("rejects empty names", () => {
    expect(validateBillName("  ")).toBe("Bill name is required.");
  });

  it("accepts trimmed names", () => {
    expect(validateBillName(" Rent ")).toBeNull();
  });
});

describe("validateDueDay", () => {
  it("accepts days 1 through 31", () => {
    expect(validateDueDay(1)).toBeNull();
    expect(validateDueDay(31)).toBeNull();
  });

  it("rejects invalid days", () => {
    expect(validateDueDay(0)).toBe("Due day must be between 1 and 31.");
    expect(validateDueDay(32)).toBe("Due day must be between 1 and 31.");
  });
});

describe("validateBillAmount", () => {
  it("accepts null and positive yen", () => {
    expect(validateBillAmount(null)).toBeNull();
    expect(validateBillAmount(5_000)).toBeNull();
  });

  it("rejects non-positive amounts", () => {
    expect(validateBillAmount(0)).toBe("Amount must be a positive whole yen amount.");
  });
});

describe("currentPeriodInTokyo", () => {
  it("returns the active cycle key in Asia/Tokyo", () => {
    expect(currentPeriodInTokyo(new Date("2026-08-03T12:00:00+09:00"))).toBe("2026-08");
    expect(currentPeriodInTokyo(new Date("2026-08-25T12:00:00+09:00"))).toBe("2026-08");
  });
});

describe("isBillUnpaid", () => {
  it("treats active bills without a matching period as unpaid", () => {
    const bill = sampleBill({ lastPaidPeriod: "2026-06" });
    expect(isBillUnpaid(bill, "2026-07")).toBe(true);
    expect(isBillUnpaid(bill, "2026-06")).toBe(false);
  });

  it("ignores inactive bills", () => {
    expect(
      isBillUnpaid(sampleBill({ isActive: false, lastPaidPeriod: null }), "2026-07"),
    ).toBe(false);
  });
});

describe("isBillOverdue", () => {
  it("marks bills overdue after the due day in JST", () => {
    const bill = sampleBill({ dueDay: 25 });
    expect(isBillOverdue(bill, "2026-07-25")).toBe(false);
    expect(isBillOverdue(bill, "2026-07-26")).toBe(true);
  });
});

describe("unpaidBillsForPeriod", () => {
  it("returns active unpaid bills sorted by due day", () => {
    const bills = [
      sampleBill({ id: "b", name: "Utilities", dueDay: 20, lastPaidPeriod: "2026-06" }),
      sampleBill({ id: "a", name: "Rent", dueDay: 5, lastPaidPeriod: null }),
      sampleBill({ id: "c", name: "Inactive", dueDay: 1, isActive: false }),
      sampleBill({ id: "d", name: "Paid", dueDay: 10, lastPaidPeriod: "2026-07" }),
    ];

    expect(unpaidBillsForPeriod(bills, "2026-07").map((bill) => bill.id)).toEqual([
      "a",
      "b",
    ]);
  });
});

describe("billPayNote", () => {
  it("formats the bill name and month label", () => {
    expect(billPayNote("Rent", 2026, 7)).toBe("Rent Jul 2026 · 1 Jul – 31 Jul");
  });
});
