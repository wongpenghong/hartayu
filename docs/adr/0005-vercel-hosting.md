# Vercel for PWA hosting

The Hartayu frontend (Vite PWA) will deploy to Vercel. Supabase remains the backend (Auth, Postgres, RLS) — not hosted on Vercel.

**Why Vercel:** Free tier, HTTPS by default, simple Vite static deploy, env vars for `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Considered options:** Cloudflare Pages (also free; equally valid). Vercel chosen for familiarity and zero-config Vite builds.

**When:** Deploy during or after ticket #7 (PWA polish). Before go-live, add the production URL to Supabase Auth redirect allowlist.

**Consequences:** No server-side rendering; static SPA + client-side Supabase only. Custom domain optional later on Vercel free tier.
