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
