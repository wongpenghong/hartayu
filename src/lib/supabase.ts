import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | null = null;

function requireEnv(name: string): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env.local.`);
  }
  return value;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!client) {
    client = createClient<Database>(
      requireEnv("VITE_SUPABASE_URL"),
      requireEnv("VITE_SUPABASE_ANON_KEY"),
    );
  }
  return client;
}
