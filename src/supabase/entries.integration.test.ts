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

describe.skipIf(!hasIntegrationEnv)("Supabase entries RLS integration", () => {
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

  it("allows creators to manage their entries within a household", async () => {
    const password = "test-password-123";
    const emailA = randomEmail("entries-a");
    const emailB = randomEmail("entries-b");

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
      { household_name: "Entries A" },
    );
    expect(bootstrapAError).toBeNull();

    await clientB.rpc("bootstrap_owner_household", {
      household_name: "Entries B",
    });

    const { data: pocket, error: pocketError } = await clientA
      .from("accounts")
      .insert({
        household_id: householdAId!,
        name: "Cash",
      })
      .select("id")
      .single();
    expect(pocketError).toBeNull();

    const { data: category, error: categoryError } = await clientA
      .from("categories")
      .select("id")
      .eq("kind", "expense")
      .limit(1)
      .single();
    expect(categoryError).toBeNull();

    const { data: created, error: createError } = await clientA
      .from("entries")
      .insert({
        household_id: householdAId!,
        account_id: pocket!.id,
        category_id: category!.id,
        member_id: userA.id,
        attributed_member_id: userA.id,
        kind: "expense",
        amount_yen: 2500,
        entry_date: "2026-07-17",
        note: "Test groceries",
      })
      .select("id, amount_yen, note")
      .single();

    expect(createError).toBeNull();
    expect(created?.amount_yen).toBe(2500);
    expect(created?.note).toBe("Test groceries");

    const { data: updated, error: updateError } = await clientA
      .from("entries")
      .update({ amount_yen: 3000, note: "Updated note" })
      .eq("id", created!.id)
      .select("amount_yen, note")
      .single();

    expect(updateError).toBeNull();
    expect(updated?.amount_yen).toBe(3000);
    expect(updated?.note).toBe("Updated note");

    const { error: deleteError } = await clientA
      .from("entries")
      .delete()
      .eq("id", created!.id);

    expect(deleteError).toBeNull();

    const { error: crossHouseholdCreateError } = await clientB
      .from("entries")
      .insert({
        household_id: householdAId!,
        account_id: pocket!.id,
        category_id: category!.id,
        member_id: userB.id,
        attributed_member_id: userB.id,
        kind: "expense",
        amount_yen: 1000,
        entry_date: "2026-07-17",
      });

    expect(crossHouseholdCreateError).toBeTruthy();

    const { data: recreated, error: recreateError } = await clientA
      .from("entries")
      .insert({
        household_id: householdAId!,
        account_id: pocket!.id,
        category_id: category!.id,
        member_id: userA.id,
        attributed_member_id: userA.id,
        kind: "expense",
        amount_yen: 1200,
        entry_date: "2026-07-17",
      })
      .select("id")
      .single();
    expect(recreateError).toBeNull();

    const { error: crossMemberUpdateError } = await clientB
      .from("entries")
      .update({ amount_yen: 9999 })
      .eq("id", recreated!.id);

    expect(crossMemberUpdateError).toBeTruthy();

    const { error: crossMemberDeleteError } = await clientB
      .from("entries")
      .delete()
      .eq("id", recreated!.id);

    expect(crossMemberDeleteError).toBeTruthy();

    const { error: joinBError } = await admin.from("household_members").insert({
      household_id: householdAId!,
      user_id: userB.id,
      role: "member",
    });
    expect(joinBError).toBeNull();

    const { data: familyEntry, error: familyCreateError } = await clientA
      .from("entries")
      .insert({
        household_id: householdAId!,
        account_id: pocket!.id,
        category_id: category!.id,
        member_id: userA.id,
        attributed_member_id: null,
        kind: "expense",
        amount_yen: 80_000,
        entry_date: "2026-07-18",
      })
      .select("id")
      .single();
    expect(familyCreateError).toBeNull();

    const { error: familyCrossUpdateError } = await clientB
      .from("entries")
      .update({ amount_yen: 85_000 })
      .eq("id", familyEntry!.id);

    expect(familyCrossUpdateError).toBeNull();

    const { error: familyCrossDeleteError } = await clientB
      .from("entries")
      .delete()
      .eq("id", familyEntry!.id);

    expect(familyCrossDeleteError).toBeNull();
  });
});
