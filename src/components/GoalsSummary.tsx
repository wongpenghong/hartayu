import { Link } from "react-router-dom";
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
    <section>
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-[13px] font-normal uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Savings goals
        </h2>
        <Link
          to="/goals"
          className="text-[13px] font-medium text-[#007aff] active:opacity-60"
        >
          View all
        </Link>
      </div>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
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
      </div>
    </section>
  );
}
