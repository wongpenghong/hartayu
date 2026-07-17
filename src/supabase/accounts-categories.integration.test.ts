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

describe.skipIf(!hasIntegrationEnv)(
  "Supabase pockets and categories RLS integration",
  () => {
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

    it("allows household members to manage pockets and custom categories", async () => {
      const password = "test-password-123";
      const emailA = randomEmail("settings-a");
      const emailB = randomEmail("settings-b");

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
        { household_name: "Settings A" },
      );
      expect(bootstrapAError).toBeNull();

      const { data: householdBId, error: bootstrapBError } = await clientB.rpc(
        "bootstrap_owner_household",
        { household_name: "Settings B" },
      );
      expect(bootstrapBError).toBeNull();

      const { data: pocket, error: createPocketError } = await clientA
        .from("accounts")
        .insert({
          household_id: householdAId!,
          name: "Shared cash",
          primary_member_id: userA.id,
        })
        .select("id, name, primary_member_id, archived_at")
        .single();

      expect(createPocketError).toBeNull();
      expect(pocket?.name).toBe("Shared cash");

      const { data: renamedPocket, error: renamePocketError } = await clientA
        .from("accounts")
        .update({ name: "Household cash" })
        .eq("id", pocket!.id)
        .select("name")
        .single();

      expect(renamePocketError).toBeNull();
      expect(renamedPocket?.name).toBe("Household cash");

      const { data: archivedPocket, error: archivePocketError } = await clientA
        .from("accounts")
        .update({ archived_at: new Date().toISOString() })
        .eq("id", pocket!.id)
        .select("archived_at")
        .single();

      expect(archivePocketError).toBeNull();
      expect(archivedPocket?.archived_at).toBeTruthy();

      const { data: customCategory, error: createCategoryError } = await clientA
        .from("categories")
        .insert({
          household_id: householdAId!,
          name: "Subscriptions",
          kind: "expense",
          is_starter: false,
        })
        .select("id, name, is_starter")
        .single();

      expect(createCategoryError).toBeNull();
      expect(customCategory?.is_starter).toBe(false);

      const { data: renamedCategory, error: renameCategoryError } = await clientA
        .from("categories")
        .update({ name: "Streaming" })
        .eq("id", customCategory!.id)
        .eq("is_starter", false)
        .select("name")
        .single();

      expect(renameCategoryError).toBeNull();
      expect(renamedCategory?.name).toBe("Streaming");

      const { data: members, error: membersError } =
        await clientA.rpc("list_household_members");
      expect(membersError).toBeNull();
      expect(members?.some((member) => member.user_id === userA.id)).toBe(true);

      const { error: crossHouseholdPocketError } = await clientB
        .from("accounts")
        .insert({
          household_id: householdAId!,
          name: "Leaked pocket",
        });

      expect(crossHouseholdPocketError).toBeTruthy();

      const { data: starterCategory } = await clientA
        .from("categories")
        .select("id")
        .eq("is_starter", true)
        .limit(1)
        .single();

      const { error: crossHouseholdCategoryError } = await clientB
        .from("categories")
        .insert({
          household_id: householdAId!,
          name: "Leaked category",
          kind: "expense",
          is_starter: false,
        });

      expect(crossHouseholdCategoryError).toBeTruthy();

      const { data: leakedPockets, error: leakedPocketsError } = await clientB
        .from("accounts")
        .select("id")
        .eq("id", pocket!.id);

      expect(leakedPocketsError).toBeNull();
      expect(leakedPockets).toEqual([]);

      const { data: leakedCategories, error: leakedCategoriesError } =
        await clientB
          .from("categories")
          .select("id")
          .eq("id", starterCategory!.id);

      expect(leakedCategoriesError).toBeNull();
      expect(leakedCategories).toEqual([]);

      expect(householdBId).not.toBe(householdAId);
    });
  },
);
