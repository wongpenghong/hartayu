import { Link } from "react-router-dom";
import type { Pocket } from "@/household/pockets";
import { netTone } from "@/household/entry-display";
import type { PocketBalance } from "@/ledger/types";
import { formatYen } from "@/lib/format-yen";

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
  const totalBalanceYen = pockets.reduce(
    (total, pocket) => total + (balanceById.get(pocket.id) ?? 0),
    0,
  );

  if (loading || pockets.length === 0) {
    return null;
  }

  const pocketLabel =
    pockets.length === 1 ? "1 pocket" : `${pockets.length} pockets`;

  return (
    <Link
      to="/settings?tab=pockets"
      className="block rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] active:opacity-80 dark:bg-neutral-900 dark:shadow-none"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium uppercase tracking-wide text-neutral-500">
          Pockets
        </p>
        <span className="text-[20px] text-neutral-300">›</span>
      </div>
      <p
        className={`mt-2 text-[32px] font-bold tracking-tight tabular-nums ${netTone(totalBalanceYen)}`}
      >
        {formatYen(totalBalanceYen)}
      </p>
      <p className="mt-1 text-[14px] text-neutral-500">{pocketLabel} · Manage in Settings</p>
    </Link>
  );
}
