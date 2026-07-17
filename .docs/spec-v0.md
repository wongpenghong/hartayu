# Hartayu v0 — Product Spec

Published from `/to-spec` after `/grill-with-docs` (2026-07-17).

## Problem Statement

An Indonesian couple living in Japan needs a shared way to track household expenses and income in JPY without spreadsheets or a generic app that doesn't fit how they think about money. Both partners use their own phones and need the same combined household picture, while still seeing balances per bank account.

## Solution

**Hartayu** is a Progressive Web App (PWA) backed by Supabase. Two household **Members** sign in separately, join one **Household** via invite link, and log **Entries** (expenses and income) against **Accounts** and **Categories**. The home screen shows combined household totals plus per-account balances; category breakdowns are one tap away. All amounts are **JPY**. UI copy is English only.

## User Stories

### Household & auth

1. As a member, I want to sign up with email and password, so that I have my own login on my phone.
2. As the first member, I want to create a household when I register, so that we have a shared ledger.
3. As a household creator, I want to send an invite link to my wife, so that she joins the same household without a shared password.
4. As an invited member, I want to accept an invite and land in the shared household, so that I see the same accounts and entries.
5. As a member, I want to sign out, so that my session is cleared on a shared device.
6. As a member, I want only our household's data visible to us, so that other users cannot read our entries.

### Accounts

7. As a member, I want to create accounts (e.g. my bank, wife's bank, shared cash), so that entries reflect where money sits.
8. As a member, I want to name each account, so that we recognize it at a glance.
9. As a member, I want to optionally mark which member mainly uses an account, so that defaults are faster when logging.
10. As a member, I want to see per-account balances on the home screen, so that I know what's in each place.
11. As a member, I want account balances to roll up into a combined household total, so that I see our overall position.
12. As a member, I want to edit an account name, so that labels stay accurate.
13. As a member, I want to archive or hide unused accounts, so that the list stays clean without deleting history.

### Categories

14. As a member, I want starter categories (Food, Transport, Rent, Utilities, Healthcare, Entertainment, Salary, Other), so that I can log quickly without setup.
15. As a member, I want to add custom categories, so that tracking matches our life.
16. As a member, I want categories scoped to expense or income, so that I don't pick Salary when logging groceries.
17. As a member, I want to see current-month totals grouped by category, so that I understand spending patterns.
18. As a member, I want to edit a custom category name, so that labels evolve with us.
19. As a member, I want starter categories non-deletable, so that baseline reporting stays stable.

### Entries

20. As a member, I want to add an expense entry with amount, category, account, and date, so that spending is recorded in under ten seconds.
21. As a member, I want to add an income entry with the same fields, so that salary and other inflows are tracked.
22. As a member, I want an optional note on any entry, so that I can add context (e.g. "Costco groceries") when helpful.
23. As a member, I want today's date as the default when adding an entry, so that most logs need fewer taps.
24. As a member, I want amount input optimized for JPY (integer yen, ¥ formatting), so that entry feels natural in Japan.
25. As a member, I want to see who logged each entry, so that we know who recorded what.
26. As a member, I want to edit my entries, so that mistakes can be fixed.
27. As a member, I want to delete an entry I created, so that duplicates can be removed.
28. As a member, I want a chronological list of recent entries, so that I can review what we logged.
29. As a member, I want to filter entries by account, so that I can review one bank in isolation.
30. As a member, I want to filter entries by category, so that I can drill into Food spending.
31. As a member, I want to filter entries by month, so that I can reconcile a past period.

### Home & reporting

32. As a member, I want the home screen to show combined household income and expense for the current month, so that I get a quick health check.
33. As a member, I want the home screen to show net (income minus expense) for the month, so that I see if we're ahead or behind.
34. As a member, I want per-account balances on the home screen, so that I don't need a separate screen for "what's in my bank."
35. As a member, I want a category summary screen for the current month, so that I see where money went without cluttering home.
36. As a member, I want totals to update when my wife adds an entry, so that we stay in sync without manual refresh (Supabase realtime or refetch on focus).

### PWA & mobile

37. As a member, I want to install the app to my phone home screen, so that it feels like a native app.
38. As a member, I want the UI laid out for phone screens first, so that forms and totals are easy to use one-handed.
39. As a member, I want the app to load on a mobile browser, so that I can use it before installing.
40. As a member, I want a visible "Add entry" action on primary screens, so that logging is always one tap away.

### Onboarding

41. As the first member, I want a short setup flow (create household → add accounts → done), so that we can start logging the same day.
42. As a new member, I want starter accounts suggested but skippable, so that we're not blocked if we configure later.

## Implementation Decisions

### Architecture (ADRs)

- **PWA** for delivery (ADR-0001): Vite + React, service worker, web manifest, Add to Home Screen. No app store for v0.
- **Supabase** as source of truth (ADR-0003): Postgres, Auth, RLS by `household_id`. Online-first v0.
- **IndexedDB** deferred (ADR-0002): optional offline cache later; not required for v0 MVP.

### Testing seam

Single primary seam: **household ledger operations** — pure functions (or a thin module) that compute balances and monthly rollups from entries + accounts. UI and Supabase adapters sit below/above this seam. Integration tests against Supabase local or test project; component tests for entry form validation; one smoke E2E path: sign in → add expense → see home totals update.

### Data model (Supabase / Postgres)

- **households** — id, name, created_at
- **household_members** — household_id, user_id (auth.users), role (owner | member), joined_at
- **household_invites** — token, household_id, expires_at, accepted_at
- **accounts** — id, household_id, name, primary_member_id (nullable), archived_at
- **categories** — id, household_id, name, kind (expense | income), is_starter (bool)
- **entries** — id, household_id, account_id, category_id, member_id, kind (expense | income), amount_yen (integer), entry_date, note (nullable), created_at, updated_at

RLS: all rows scoped to households the authenticated user belongs to.

### Auth & invite flow

- Supabase Auth email/password.
- Owner creates household on first login after signup.
- Invite: generate token URL → wife signs up / signs in → token links her `user_id` to `household_members`.
- Entry `member_id` set from `auth.uid()` on insert.

### Balance logic

- Account balance = sum(income entries) − sum(expense entries) for that account (all time or configurable; v0: all time per account).
- Household combined = sum across non-archived accounts.
- Monthly totals = filter entries by calendar month in JST (confirm timezone; default Asia/Tokyo).

### UI structure

- **Home** — combined monthly income/expense/net; per-account balances; CTA add entry; link to categories.
- **Add entry** — type toggle, amount, account picker, category picker, date, optional note.
- **Entries list** — recent + filters.
- **Categories** — current month by category.
- **Settings** — accounts, custom categories, invite member, sign out.

### Starter categories (expense)

Food, Transport, Rent, Utilities, Healthcare, Entertainment, Shopping, Other

### Starter categories (income)

Salary, Bonus, Other

### Tech stack (proposed for weekend build)

- Vite + React + TypeScript
- Tailwind CSS (mobile-first)
- `@supabase/supabase-js`
- `vite-plugin-pwa`
- Deploy: **Vercel** (ADR-0005; free tier). Supabase hosted separately.

## Testing Decisions

- **Good tests** assert observable outcomes: given entries, balance and rollup functions return expected JPY totals; RLS policies reject cross-household reads.
- **Unit test** balance/rollup pure functions with fixture entry lists.
- **Integration test** Supabase CRUD + RLS with test users in two households.
- **Component test** entry form: required fields, JPY integer validation, optional note.
- **Manual test checklist** on two phones: invite flow, both add entry, home updates.
- No prior art in repo (greenfield).

## Out of Scope

- Recurring entry rules
- Telegram / external ingest
- Offline-first / IndexedDB sync
- Multi-currency
- Bank API import
- Investment / tax reporting
- Charts beyond simple lists and totals
- i18n (English only v0)
- App Store / Play Store native builds
- More than one household per user
- Entry attachments / receipts

## Further Notes

- Domain glossary: `CONTEXT.md`
- ADRs: `docs/adr/0001`–`0003`
- Human session trail: `.docs/02-decision-log.md`
- Notes field reserved for future search, tags, or AI features.
- Success criteria updated: v0 is **online-first** (not offline-required); install via PWA home screen still required.
