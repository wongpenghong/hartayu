import { describe, expect, it } from "vitest";
import {
  goalMonthlyPace,
  goalProgress,
  goalSavedYen,
  monthsUntilTarget,
} from "@/household/goal-display";
import type { Goal, GoalContribution } from "@/ledger/types";

const goal: Goal = {
  id: "goal-1",
  name: "Holiday 2027",
  targetAmountYen: 500_000,
  targetDate: "2027-12-01",
  linkedPocketId: null,
  emoji: "🏖️",
  createdAt: "2026-07-01T00:00:00Z",
};

const contributions: GoalContribution[] = [
  {
    id: "c-1",
    goalId: "goal-1",
    memberId: "member-a",
    amountYen: 120_000,
    contributionDate: "2026-07-01",
    note: null,
    createdAt: "2026-07-01T00:00:00Z",
  },
  {
    id: "c-2",
    goalId: "goal-1",
    memberId: "member-a",
    amountYen: 30_000,
    contributionDate: "2026-07-15",
    note: null,
    createdAt: "2026-07-15T00:00:00Z",
  },
];

describe("goalSavedYen", () => {
  it("sums contributions for a goal", () => {
    expect(goalSavedYen("goal-1", contributions)).toBe(150_000);
    expect(goalSavedYen("goal-2", contributions)).toBe(0);
  });
});

describe("goalProgress", () => {
  it("computes percent and remaining amount", () => {
    expect(goalProgress(goal, contributions)).toEqual({
      goalId: "goal-1",
      savedYen: 150_000,
      targetAmountYen: 500_000,
      progressPercent: 30,
      remainingYen: 350_000,
    });
  });

  it("caps progress at 100%", () => {
    const overContributed = [
      ...contributions,
      {
        id: "c-3",
        goalId: "goal-1",
        memberId: "member-a",
        amountYen: 400_000,
        contributionDate: "2026-07-20",
        note: null,
        createdAt: "2026-07-20T00:00:00Z",
      },
    ];

    expect(goalProgress(goal, overContributed)).toEqual({
      goalId: "goal-1",
      savedYen: 550_000,
      targetAmountYen: 500_000,
      progressPercent: 100,
      remainingYen: 0,
    });
  });
});

describe("monthsUntilTarget", () => {
  it("returns null without a future target date", () => {
    expect(monthsUntilTarget("2026-07-31", null)).toBeNull();
    expect(monthsUntilTarget("2026-07-31", "2026-07-01")).toBeNull();
  });

  it("counts calendar months until the target date", () => {
    expect(monthsUntilTarget("2026-07-31", "2027-12-01")).toBe(16);
    expect(monthsUntilTarget("2026-07-15", "2026-08-14")).toBe(1);
  });
});

describe("goalMonthlyPace", () => {
  it("divides remaining amount by months until target", () => {
    expect(goalMonthlyPace(goal, contributions, "2026-07-31")).toBe(21_875);
  });

  it("returns null when no target date is set", () => {
    expect(
      goalMonthlyPace(
        { ...goal, targetDate: null },
        contributions,
        "2026-07-31",
      ),
    ).toBeNull();
  });
});
