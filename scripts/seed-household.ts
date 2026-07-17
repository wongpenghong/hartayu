import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/database.types";
import { memberEmail, normalizeUsername, validatePin, validateUsername } from "../src/auth/member-auth";
import { STARTER_CATEGORIES } from "../src/household/starter-categories";

loadEnvFile(".env.local");

const url = requireEnv("VITE_SUPABASE_URL");
const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

type SeedOptions = {
  ownerUsername: string;
  memberUsername: string;
  ownerPin: string;
  memberPin: string;
  householdName: string;
  fresh: boolean;
};

function loadEnvFile(filename: string) {
  try {
    const content = readFileSync(resolve(process.cwd(), filename), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env file.
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local.`);
  }
  return value;
}

function parseArgs(argv: string[]): SeedOptions {
  const positional: string[] = [];
  let ownerPin = "";
  let memberPin = "";
  let householdName = "Our household";
  let fresh = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--fresh") {
      fresh = true;
      continue;
    }
    if (arg === "--household-name") {
      householdName = argv[index + 1] ?? householdName;
      index += 1;
      continue;
    }
    if (arg === "--owner-pin") {
      ownerPin = argv[index + 1] ?? ownerPin;
      index += 1;
      continue;
    }
    if (arg === "--member-pin") {
      memberPin = argv[index + 1] ?? memberPin;
      index += 1;
      continue;
    }
    positional.push(arg);
  }

  const ownerUsername = positional[0];
  const memberUsername = positional[1];

  if (!ownerUsername || !memberUsername) {
    throw new Error(
      "Usage: npm run seed:household -- <owner-username> <member-username> [--owner-pin 123456] [--member-pin 654321] [--household-name \"Our household\"] [--fresh]",
    );
  }

  if (normalizeUsername(ownerUsername) === normalizeUsername(memberUsername)) {
    throw new Error("Owner and member usernames must be different.");
  }

  for (const [label, username] of [
    ["Owner", ownerUsername],
    ["Member", memberUsername],
  ] as const) {
    const error = validateUsername(username);
    if (error) {
      throw new Error(`${label} username invalid: ${error}`);
    }
  }

  ownerPin ||= randomPin();
  memberPin ||= randomPin();

  for (const [label, pin] of [
    ["Owner", ownerPin],
    ["Member", memberPin],
  ] as const) {
    const error = validatePin(pin);
    if (error) {
      throw new Error(`${label} PIN invalid: ${error}`);
    }
  }

  return {
    ownerUsername: normalizeUsername(ownerUsername),
    memberUsername: normalizeUsername(memberUsername),
    ownerPin,
    memberPin,
    householdName,
    fresh,
  };
}

function randomPin(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function wipeProjectData(admin: ReturnType<typeof createClient<Database>>) {
  const { error: householdError } = await admin
    .from("households")
    .delete()
    .not("id", "is", null);
  if (householdError) {
    throw householdError;
  }

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw error;
    }
    if (data.users.length === 0) {
      break;
    }
    for (const user of data.users) {
      const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        throw deleteError;
      }
    }
    page += 1;
  }
}

async function createMember(
  admin: ReturnType<typeof createClient<Database>>,
  username: string,
  pin: string,
) {
  const { data, error } = await admin.auth.admin.createUser({
    email: memberEmail(username),
    password: pin,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error(`Failed to create member ${username}`);
  }

  return data.user;
}

async function seedHousehold(options: SeedOptions) {
  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (options.fresh) {
    await wipeProjectData(admin);
  }

  const owner = await createMember(admin, options.ownerUsername, options.ownerPin);
  const member = await createMember(admin, options.memberUsername, options.memberPin);

  const { data: household, error: householdError } = await admin
    .from("households")
    .insert({ name: options.householdName })
    .select("id")
    .single();

  if (householdError || !household) {
    throw householdError ?? new Error("Failed to create household");
  }

  const { error: membersError } = await admin.from("household_members").insert([
    {
      household_id: household.id,
      user_id: owner.id,
      role: "owner",
    },
    {
      household_id: household.id,
      user_id: member.id,
      role: "member",
    },
  ]);

  if (membersError) {
    throw membersError;
  }

  const { error: categoriesError } = await admin.from("categories").insert(
    STARTER_CATEGORIES.map((category) => ({
      household_id: household.id,
      name: category.name,
      kind: category.kind,
      is_starter: true,
    })),
  );

  if (categoriesError) {
    throw categoriesError;
  }

  console.log("Household seeded");
  console.log(`Household: ${options.householdName}`);
  console.log(`Owner: ${options.ownerUsername} / PIN ${options.ownerPin}`);
  console.log(`Member: ${options.memberUsername} / PIN ${options.memberPin}`);
}

const options = parseArgs(process.argv.slice(2));
await seedHousehold(options);
