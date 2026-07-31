import type { Pocket } from "@/household/pockets";
import { netTone } from "@/household/entry-display";
import type { PocketBalance } from "@/ledger/types";
import { formatYen } from "@/lib/format-yen";
import { EmptyState, GroupCard, PocketIcon } from "@/components/NativeUI";

export function PocketsSummary({
  pockets,
  balances,
  loading,
}: {
  pockets: Pocket[];
  balances: PocketBalance[];
  loading?: boolean;
}) {
  const balanceById = new Map(balances.map((row) => [row.pocketId, row.balanceYen]));
  const rows = [...pockets].sort((left, right) => {
    const balanceDelta =
      (balanceById.get(right.id) ?? 0) - (balanceById.get(left.id) ?? 0);
    if (balanceDelta !== 0) {
      return balanceDelta;
    }
    return left.name.localeCompare(right.name);
  });

  if (loading) {
    return (
      <GroupCard title="Pockets">
        <EmptyState message="Loading pockets…" />
      </GroupCard>
    );
  }

  if (rows.length === 0) {
    return (
      <GroupCard title="Pockets">
        <EmptyState message="Add a pocket in Settings." />
      </GroupCard>
    );
  }

  return (
    <GroupCard title="Pockets">
      {rows.map((pocket) => {
        const balanceYen = balanceById.get(pocket.id) ?? 0;
        return (
          <div
            key={pocket.id}
            className="flex items-center gap-3 border-b border-[#ececee] px-4 py-3.5 last:border-b-0 dark:border-neutral-800"
          >
            <PocketIcon name={pocket.name} emoji={pocket.emoji} />
            <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
              {pocket.name}
            </span>
            <span
              className={`text-[17px] font-semibold tabular-nums ${netTone(balanceYen)}`}
            >
              {formatYen(balanceYen)}
            </span>
          </div>
        );
      })}
    </GroupCard>
  );
}
