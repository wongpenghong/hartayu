# Supabase for shared household sync

Both you and your wife log from your own phones. Local-only storage (IndexedDB per device) cannot share a ledger, so v0 uses Supabase as the source of truth: Postgres for entries, Supabase Auth for two members, Row Level Security scoped to one household.

**Considered options:** Firebase (strong offline SDK, unfamiliar model), PocketBase (self-host ops), GCP Cloud SQL + custom API (more weekend boilerplate). Supabase chosen because you already use it and the free tier covers household scale.

**Consequences:** v0 is online-first (offline cache via IndexedDB is optional later). Supabase project + env keys required. Telegram ingest (future) can write to the same Postgres via Edge Function or bot backend.
