import { getSupabase } from "@/lib/supabase";
import type { HoldingSnapshot, SnapshotSession } from "@/ledger/portfolio";

export type SnapshotSessionRow = {
  id: string;
  household_id: string;
  as_of_date: string;
  created_at: string;
};

export type HoldingSnapshotRow = {
  id: string;
  session_id: string;
  holding_id: string;
  unit_price_yen: number | null;
  total_value_yen: number | null;
  carried_forward: boolean;
};

const sessionSelect = "id, household_id, as_of_date, created_at";
const snapshotSelect =
  "id, session_id, holding_id, unit_price_yen, total_value_yen, carried_forward";

function mapSession(row: SnapshotSessionRow): SnapshotSession {
  return {
    id: row.id,
    asOfDate: row.as_of_date,
    createdAt: row.created_at,
  };
}

function mapSnapshot(row: HoldingSnapshotRow): HoldingSnapshot {
  return {
    id: row.id,
    sessionId: row.session_id,
    holdingId: row.holding_id,
    unitPriceYen: row.unit_price_yen,
    totalValueYen: row.total_value_yen,
    carriedForward: row.carried_forward,
  };
}

export type BatchSnapshotLineInput = {
  holdingId: string;
  unitPriceYen?: number | null;
  totalValueYen?: number | null;
  skipped?: boolean;
};

export function validateSnapshotLine(
  hasQuantity: boolean,
  line: BatchSnapshotLineInput,
): string | null {
  if (line.skipped) {
    return null;
  }

  if (hasQuantity) {
    const unitPrice = line.unitPriceYen;
    if (unitPrice == null || !Number.isSafeInteger(unitPrice) || unitPrice <= 0) {
      return "Enter a positive unit price in yen.";
    }
    if (line.totalValueYen != null) {
      return "Use either unit price or total value, not both.";
    }
    return null;
  }

  const totalValue = line.totalValueYen;
  if (totalValue == null || !Number.isSafeInteger(totalValue) || totalValue <= 0) {
    return "Enter a positive total value in yen.";
  }
  if (line.unitPriceYen != null) {
    return "Use either unit price or total value, not both.";
  }
  return null;
}

export async function fetchSnapshotSessions(): Promise<SnapshotSession[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("snapshot_sessions")
    .select(sessionSelect)
    .order("as_of_date", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSession);
}

export async function fetchHoldingSnapshots(): Promise<HoldingSnapshot[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("holding_snapshots")
    .select(snapshotSelect);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapSnapshot);
}

export function resolveSnapshotInsert(
  line: BatchSnapshotLineInput,
  hasQuantity: boolean,
  priorSnapshotsByHolding: Map<string, HoldingSnapshot>,
): {
  unit_price_yen: number | null;
  total_value_yen: number | null;
  carried_forward: boolean;
} | null {
  const lineError = validateSnapshotLine(hasQuantity, line);
  if (lineError) {
    throw new Error(lineError);
  }

  if (line.skipped) {
    const prior = priorSnapshotsByHolding.get(line.holdingId);
    if (!prior) {
      throw new Error("No prior value to carry forward for this holding.");
    }
    return {
      unit_price_yen: prior.unitPriceYen,
      total_value_yen: prior.totalValueYen,
      carried_forward: true,
    };
  }

  return {
    unit_price_yen: hasQuantity ? (line.unitPriceYen ?? null) : null,
    total_value_yen: hasQuantity ? null : (line.totalValueYen ?? null),
    carried_forward: false,
  };
}

export async function createBatchSnapshotSession(params: {
  householdId: string;
  asOfDate: string;
  lines: BatchSnapshotLineInput[];
  holdingsQuantityById: Map<string, boolean>;
  priorSnapshotsByHolding: Map<string, HoldingSnapshot>;
}): Promise<{ session: SnapshotSession; snapshots: HoldingSnapshot[] }> {
  const supabase = getSupabase();
  const { data: sessionRow, error: sessionError } = await supabase
    .from("snapshot_sessions")
    .insert({
      household_id: params.householdId,
      as_of_date: params.asOfDate,
    })
    .select(sessionSelect)
    .single();

  if (sessionError || !sessionRow) {
    throw sessionError ?? new Error("Failed to create snapshot session");
  }

  const inserts: {
    session_id: string;
    holding_id: string;
    unit_price_yen: number | null;
    total_value_yen: number | null;
    carried_forward: boolean;
  }[] = [];

  for (const line of params.lines) {
    const hasQuantity = params.holdingsQuantityById.get(line.holdingId) ?? false;
    const resolved = resolveSnapshotInsert(
      line,
      hasQuantity,
      params.priorSnapshotsByHolding,
    );
    inserts.push({
      session_id: sessionRow.id,
      holding_id: line.holdingId,
      ...resolved,
    });
  }

  if (inserts.length === 0) {
    const { error: deleteError } = await supabase
      .from("snapshot_sessions")
      .delete()
      .eq("id", sessionRow.id);
    if (deleteError) {
      throw deleteError;
    }
    throw new Error("Enter at least one holding value or carry-forward.");
  }

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from("holding_snapshots")
    .insert(inserts)
    .select(snapshotSelect);

  if (snapshotError || !snapshotRows) {
    throw snapshotError ?? new Error("Failed to save holding snapshots");
  }

  return {
    session: mapSession(sessionRow),
    snapshots: snapshotRows.map(mapSnapshot),
  };
}
