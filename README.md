# Hartayu

Household finance PWA — shared expense and income tracking in JPY.

## Development

```bash
npm install
npm run dev
```

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run test` | Ledger unit tests |
| `npm run typecheck` | TypeScript check |

## Environment

Copy `.env.example` to `.env.local` and set Supabase values.

Apply migrations to your Supabase project:

```bash
supabase db push
```

Or paste `supabase/migrations/20260717100000_initial_schema.sql` into the SQL editor.

## Supabase integration tests

Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` (server-side only), apply migrations, then:

```bash
npm test
```

RLS tests skip automatically when Supabase env vars are missing.

## Docs

- Product spec: `.docs/spec-v0.md` · [GitHub #1](https://github.com/wongpenghong/hartayu/issues/1)
- Tickets: `.docs/tickets-v0.md`
- Domain glossary: `CONTEXT.md`
