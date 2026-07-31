import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GRADE_TO_FILTER_ID: Record<string, string> = {
  a: "like_new",
  b: "minor_scratches",
  c: "moderate_scratches",
  d: "significant_damage",
  psa9: "psa_9",
  psa10: "psa_10",
};

type SnkrdunkChip = {
  filterConditionId: string;
  hasListing: boolean;
  usedMinPrice?: number | null;
};

type SnkrdunkQuoteResult =
  | { ok: true; unitPriceYen: number }
  | { ok: false; reason: "no_listing" | "invalid_response" | "missing_price" | "fetch_failed" };

function parseSnkrdunkQuote(
  response: { chips?: SnkrdunkChip[] },
  grade: string,
): SnkrdunkQuoteResult {
  const filterId = GRADE_TO_FILTER_ID[grade];
  const chip = response.chips?.find((row) => row.filterConditionId === filterId);
  if (!chip) {
    return { ok: false, reason: "invalid_response" };
  }
  if (!chip.hasListing) {
    return { ok: false, reason: "no_listing" };
  }
  const price = chip.usedMinPrice;
  if (price == null || !Number.isFinite(price) || price <= 0) {
    return { ok: false, reason: "missing_price" };
  }
  return { ok: true, unitPriceYen: Math.round(price) };
}

async function fetchSnkrdunkQuote(
  productId: number,
  grade: string,
): Promise<SnkrdunkQuoteResult> {
  const url = `https://snkrdunk.com/v2/products/${productId}/size-chips?type=apparel`;
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      return { ok: false, reason: "fetch_failed" };
    }
    const body = (await response.json()) as { chips?: SnkrdunkChip[] };
    return parseSnkrdunkQuote(body, grade);
  } catch {
    return { ok: false, reason: "fetch_failed" };
  }
}

function quoteErrorMessage(result: SnkrdunkQuoteResult): string | null {
  if (result.ok) {
    return null;
  }
  if (result.reason === "no_listing") {
    return "No listing at this grade";
  }
  return "Fetch failed";
}

type RefreshRequest = {
  householdId?: string;
  cronSecret?: string;
};

type HoldingRow = {
  id: string;
  quantity: number | null;
};

type MarketLinkRow = {
  holding_id: string;
  snkrdunk_product_id: number;
  condition_grade: string;
};

type PriorSnapshotRow = {
  holding_id: string;
  unit_price_yen: number | null;
  total_value_yen: number | null;
};

function todayInTokyo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function latestPriorSnapshots(
  admin: ReturnType<typeof createClient>,
  householdId: string,
): Promise<Map<string, PriorSnapshotRow>> {
  const { data: sessions, error: sessionError } = await admin
    .from("snapshot_sessions")
    .select("id, as_of_date, created_at")
    .eq("household_id", householdId)
    .order("as_of_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (sessionError) {
    throw sessionError;
  }

  const latestByHolding = new Map<string, PriorSnapshotRow>();
  for (const session of sessions ?? []) {
    const { data: snapshots, error: snapshotError } = await admin
      .from("holding_snapshots")
      .select("holding_id, unit_price_yen, total_value_yen, session_id")
      .eq("session_id", session.id);

    if (snapshotError) {
      throw snapshotError;
    }

    for (const row of snapshots ?? []) {
      if (!latestByHolding.has(row.holding_id)) {
        latestByHolding.set(row.holding_id, row);
      }
    }
  }

  return latestByHolding;
}

async function refreshHousehold(
  admin: ReturnType<typeof createClient>,
  householdId: string,
): Promise<{ quoted: number; noQuote: number; carriedForward: number }> {
  const { data: holdings, error: holdingsError } = await admin
    .from("holdings")
    .select("id, quantity")
    .eq("household_id", householdId);

  if (holdingsError) {
    throw holdingsError;
  }

  if (!holdings || holdings.length === 0) {
    return { quoted: 0, noQuote: 0, carriedForward: 0 };
  }

  const holdingIds = holdings.map((row) => row.id);
  const { data: links, error: linksError } = await admin
    .from("collectible_market_links")
    .select("holding_id, snkrdunk_product_id, condition_grade")
    .in("holding_id", holdingIds);

  if (linksError) {
    throw linksError;
  }

  const linksByHolding = new Map(
    (links ?? []).map((row) => [row.holding_id, row as MarketLinkRow]),
  );

  if (linksByHolding.size === 0) {
    return { quoted: 0, noQuote: 0, carriedForward: 0 };
  }

  const priorByHolding = await latestPriorSnapshots(admin, householdId);
  const inserts: {
    holding_id: string;
    unit_price_yen: number | null;
    total_value_yen: number | null;
    carried_forward: boolean;
  }[] = [];

  let quoted = 0;
  let noQuote = 0;
  let carriedForward = 0;

  for (const holding of holdings as HoldingRow[]) {
    const link = linksByHolding.get(holding.id);
    if (!link) {
      const prior = priorByHolding.get(holding.id);
      if (!prior) {
        continue;
      }
      inserts.push({
        holding_id: holding.id,
        unit_price_yen: prior.unit_price_yen,
        total_value_yen: prior.total_value_yen,
        carried_forward: true,
      });
      carriedForward += 1;
      continue;
    }

    const quote = await fetchSnkrdunkQuote(
      link.snkrdunk_product_id,
      link.condition_grade,
    );
    const fetchError = quoteErrorMessage(quote);

    await admin
      .from("collectible_market_links")
      .update({
        last_fetched_at: new Date().toISOString(),
        last_fetch_error: fetchError,
      })
      .eq("holding_id", holding.id);

    if (!quote.ok) {
      noQuote += 1;
      continue;
    }

    quoted += 1;
    if (holding.quantity != null) {
      inserts.push({
        holding_id: holding.id,
        unit_price_yen: quote.unitPriceYen,
        total_value_yen: null,
        carried_forward: false,
      });
    } else {
      inserts.push({
        holding_id: holding.id,
        unit_price_yen: null,
        total_value_yen: quote.unitPriceYen,
        carried_forward: false,
      });
    }
  }

  if (inserts.length === 0) {
    return { quoted, noQuote, carriedForward };
  }

  const { data: session, error: sessionError } = await admin
    .from("snapshot_sessions")
    .insert({
      household_id: householdId,
      as_of_date: todayInTokyo(),
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    throw sessionError ?? new Error("Failed to create snapshot session");
  }

  const { error: snapshotError } = await admin.from("holding_snapshots").insert(
    inserts.map((row) => ({
      session_id: session.id,
      ...row,
    })),
  );

  if (snapshotError) {
    throw snapshotError;
  }

  return { quoted, noQuote, carriedForward };
}

function usernameFromMemberEmail(email: string | undefined): string | null {
  if (!email) {
    return null;
  }
  const [local, domain] = email.split("@");
  if (domain !== "hartayu.internal" || !local) {
    return null;
  }
  return local.toLowerCase();
}

const MARKET_REFRESH_USERNAME =
  Deno.env.get("MARKET_REFRESH_ALLOWED_USERNAME") ?? "salim";

async function householdIdsWithMarketLinks(
  admin: ReturnType<typeof createClient>,
): Promise<string[]> {
  const { data: links, error: linksError } = await admin
    .from("collectible_market_links")
    .select("holding_id");

  if (linksError) {
    throw linksError;
  }

  const holdingIds = (links ?? []).map((row) => row.holding_id);
  if (holdingIds.length === 0) {
    return [];
  }

  const { data: holdings, error: holdingsError } = await admin
    .from("holdings")
    .select("household_id")
    .in("id", holdingIds);

  if (holdingsError) {
    throw holdingsError;
  }

  return [...new Set((holdings ?? []).map((row) => row.household_id))];
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const cronSecret = Deno.env.get("MARKET_REFRESH_CRON_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Missing Supabase env" }, 500);
  }

  let body: RefreshRequest;
  try {
    body = (await request.json()) as RefreshRequest;
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (body.cronSecret && cronSecret && body.cronSecret === cronSecret) {
    try {
      const householdIds = await householdIdsWithMarketLinks(admin);
      let quoted = 0;
      let noQuote = 0;
      let carriedForward = 0;

      for (const householdId of householdIds) {
        const summary = await refreshHousehold(admin, householdId);
        quoted += summary.quoted;
        noQuote += summary.noQuote;
        carriedForward += summary.carriedForward;
      }

      return jsonResponse({ quoted, noQuote, carriedForward, households: householdIds.length });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Cron refresh failed";
      return jsonResponse({ error: message }, 500);
    }
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const householdId = body.householdId;
  if (!householdId) {
    return jsonResponse({ error: "householdId is required" }, 400);
  }

  const { data: membership, error: membershipError } = await admin
    .from("household_members")
    .select("household_id")
    .eq("household_id", householdId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (membershipError) {
    return jsonResponse({ error: membershipError.message }, 500);
  }

  if (!membership) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }

  if (usernameFromMemberEmail(userData.user.email) !== MARKET_REFRESH_USERNAME) {
    return jsonResponse({ error: "Market refresh is restricted" }, 403);
  }

  try {
    const summary = await refreshHousehold(admin, householdId);
    return jsonResponse(summary);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Refresh failed";
    return jsonResponse({ error: message }, 500);
  }
});
