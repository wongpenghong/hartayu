import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const anonKey =
  process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasIntegrationEnv = Boolean(url && anonKey && serviceRoleKey);

function randomEmail(label: string): string {
  return `${label}-${crypto.randomUUID()}@hartayu.test`;
}

async function createAuthedClient(
  email: string,
  password: string,
): Promise<SupabaseClient<Database>> {
  const admin = createClient<Database>(url!, serviceRoleKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createError || !created.user) {
    throw createError ?? new Error("Failed to create test user");
  }

  const client = createClient<Database>(url!, anonKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    throw signInError;
  }

  return client;
}

describe.skipIf(!hasIntegrationEnv)("Supabase RLS integration", () => {
  const createdUserIds: string[] = [];
  let admin: SupabaseClient<Database>;

  beforeAll(() => {
    admin = createClient<Database>(url!, serviceRoleKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  });

  afterAll(async () => {
    for (const userId of createdUserIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  });

  it("isolates households between members", async () => {
    const password = "test-password-123";
    const emailA = randomEmail("household-a");
    const emailB = randomEmail("household-b");

    const clientA = await createAuthedClient(emailA, password);
    const clientB = await createAuthedClient(emailB, password);

    const userA = (await clientA.auth.getUser()).data.user;
    const userB = (await clientB.auth.getUser()).data.user;

    if (!userA || !userB) {
      throw new Error("Missing test users");
    }

    createdUserIds.push(userA.id, userB.id);

    const { data: householdAId, error: bootstrapAError } = await clientA.rpc(
      "bootstrap_owner_household",
      { household_name: "Household A" },
    );
    expect(bootstrapAError).toBeNull();
    expect(householdAId).toBeTruthy();

    const { data: householdBId, error: bootstrapBError } = await clientB.rpc(
      "bootstrap_owner_household",
      { household_name: "Household B" },
    );
    expect(bootstrapBError).toBeNull();
    expect(householdBId).toBeTruthy();
    expect(householdBId).not.toBe(householdAId);

    const { data: categoriesForA, error: categoriesAError } = await clientA
      .from("categories")
      .select("id, household_id");
    expect(categoriesAError).toBeNull();
    expect(categoriesForA?.every((row) => row.household_id === householdAId)).toBe(
      true,
    );

    const { data: otherHouseholdRows, error: crossReadError } = await clientA
      .from("households")
      .select("id")
      .eq("id", householdBId!);

    expect(crossReadError).toBeNull();
    expect(otherHouseholdRows).toEqual([]);

    const { data: leakedCategories, error: leakedCategoriesError } =
      await clientA.from("categories").select("id").eq("household_id", householdBId!);

    expect(leakedCategoriesError).toBeNull();
    expect(leakedCategories).toEqual([]);

    const { data: categoryB } = await clientB
      .from("categories")
      .select("id")
      .limit(1)
      .single();

    const { error: crossWriteError } = await clientA.from("entries").insert({
      household_id: householdBId!,
      account_id: crypto.randomUUID(),
      category_id: categoryB!.id,
      member_id: userA.id,
      kind: "expense",
      amount_yen: 1000,
      entry_date: "2026-07-17",
    });

    expect(crossWriteError).toBeTruthy();
  });
});
