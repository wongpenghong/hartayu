import type { Goal, GoalContribution, GoalProgress } from "@/ledger/types";

export function goalSavedYen(
  goalId: string,
  contributions: readonly GoalContribution[],
): number {
  return contributions
    .filter((row) => row.goalId === goalId)
    .reduce((total, row) => total + row.amountYen, 0);
}

export function goalProgress(
  goal: Goal,
  contributions: readonly GoalContribution[],
): GoalProgress {
  const savedYen = goalSavedYen(goal.id, contributions);
  const remainingYen = Math.max(goal.targetAmountYen - savedYen, 0);
  const progressPercent =
    goal.targetAmountYen > 0
      ? Math.min(Math.round((savedYen / goal.targetAmountYen) * 100), 100)
      : 0;

  return {
    goalId: goal.id,
    savedYen,
    targetAmountYen: goal.targetAmountYen,
    progressPercent,
    remainingYen,
  };
}

export function progressByGoal(
  goals: readonly Goal[],
  contributions: readonly GoalContribution[],
): GoalProgress[] {
  return goals.map((goal) => goalProgress(goal, contributions));
}

export function monthsUntilTarget(
  fromDate: string,
  targetDate: string | null,
): number | null {
  if (!targetDate || targetDate <= fromDate) {
    return null;
  }

  const [fromYear, fromMonth, fromDay] = fromDate.split("-").map(Number);
  const [toYear, toMonth, toDay] = targetDate.split("-").map(Number);
  let months = (toYear - fromYear) * 12 + (toMonth - fromMonth);
  if (toDay < fromDay) {
    months -= 1;
  }

  return Math.max(months, 1);
}

export function goalMonthlyPace(
  goal: Goal,
  contributions: readonly GoalContribution[],
  today: string,
): number | null {
  const progress = goalProgress(goal, contributions);
  if (progress.remainingYen <= 0) {
    return 0;
  }

  const months = monthsUntilTarget(today, goal.targetDate);
  if (months == null) {
    return null;
  }

  return Math.ceil(progress.remainingYen / months);
}
