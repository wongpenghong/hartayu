import type { Goal, GoalContribution } from "@/ledger/types";
import { progressByGoal } from "@/household/goal-display";
import { formatYen } from "@/lib/format-yen";
import { EmptyState, GoalIcon, GroupCard, LimitProgressBar } from "@/components/NativeUI";

export function GoalsSummary({
  goals,
  contributions,
  loading,
}: {
  goals: Goal[];
  contributions: GoalContribution[];
  loading?: boolean;
}) {
  const rows = progressByGoal(goals, contributions).slice(0, 3);

  if (loading) {
    return (
      <GroupCard title="Savings goals">
        <EmptyState message="Loading goals…" />
      </GroupCard>
    );
  }

  if (rows.length === 0) {
    return null;
  }

  const goalById = new Map(goals.map((goal) => [goal.id, goal]));

  return (
    <GroupCard title="Savings goals">
      {rows.map((row) => {
        const goal = goalById.get(row.goalId);
        if (!goal) {
          return null;
        }

        return (
          <div
            key={row.goalId}
            className="border-b border-[#ececee] px-4 py-4 last:border-b-0 dark:border-neutral-800"
          >
            <div className="flex items-center gap-3">
              <GoalIcon name={goal.name} emoji={goal.emoji} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] font-medium">{goal.name}</p>
                <p className="mt-0.5 text-[13px] text-neutral-500">
                  {formatYen(row.savedYen)} of {formatYen(row.targetAmountYen)}
                </p>
              </div>
              <span className="text-[15px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-200">
                {row.progressPercent}%
              </span>
            </div>
            <div className="mt-3">
              <LimitProgressBar
                spentYen={row.savedYen}
                limitYen={row.targetAmountYen}
              />
            </div>
          </div>
        );
      })}
    </GroupCard>
  );
}
