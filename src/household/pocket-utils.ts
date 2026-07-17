import type { Pocket as LedgerPocket } from "@/ledger/types";
import type { Pocket } from "@/household/pockets";

export function activePockets(pockets: Pocket[]): Pocket[] {
  return pockets.filter((pocket) => !pocket.archived_at);
}

export function archivedPockets(pockets: Pocket[]): Pocket[] {
  return pockets.filter((pocket) => pocket.archived_at);
}

export function toLedgerPockets(pockets: Pocket[]): LedgerPocket[] {
  return activePockets(pockets).map((pocket) => ({
    id: pocket.id,
    archivedAt: pocket.archived_at,
  }));
}

export function defaultPocketId(pockets: Pocket[], userId: string): string {
  const active = activePockets(pockets);
  return (
    active.find((pocket) => pocket.primary_member_id === userId)?.id ??
    active[0]?.id ??
    ""
  );
}

export function pocketNameById(pockets: Pocket[]): Map<string, string> {
  return new Map(pockets.map((pocket) => [pocket.id, pocket.name]));
}
