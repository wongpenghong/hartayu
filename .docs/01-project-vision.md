# Project vision — Hartayu

> Personal financial tracker installable on phone. Name: **hartayu** (repo created).

## Problem (draft)

Track day-to-day spending and see where money goes, without relying on a spreadsheet or a generic app that doesn't match how I think about money.

## Intended user

Primary: you and your wife (household). Single shared ledger — not a multi-tenant product.

## Success for a weekend MVP

- [x] Installed or added to home screen on phone
- [x] Add an expense or income entry in under ~10 seconds
- [x] See totals by category for the current month
- [x] Data persists via Supabase (online-first v0)
- [x] Both phones see the same household ledger

## Later (not v0)

- Telegram bot / message ingest for quick entry from phone
- Easier mobile entry flows beyond the PWA form
- Recurring entry rules
- Category breakdown charts (v0: list/summary on drill-down from home)
- **Analytics screen** — full monthly breakdown, trends, filters (reference mockup); v0 home keeps compact donut only

## UI

English-only interface. Currency display in JPY (¥). Starter categories in English (Food, Transport, etc.).

**Visual direction (ADR-0004):** Light iOS-style — white cards, soft gray background, colored category icons, bottom tab bar with center Add. Reference mockup in project assets (2026-07-17).

**Theme toggle:** Deferred post-v0 (owner prefers dark, spouse prefers light).

## v0 home screen (Option C — hybrid)

Greeting + household monthly net hero, per-Account balance cards, compact category donut chart, recent Entries list below. Matches reference vibe while keeping per-Account tracking.

## Open decisions (resolve in `/grill-with-docs`)


| #   | Decision          | Options                           | Status                                            |
| --- | ----------------- | --------------------------------- | ------------------------------------------------- |
| 1   | Install model     | PWA / Expo / Flutter / Capacitor  | **PWA** (ADR-0001)                                |
| 2   | Data storage      | SQLite / IndexedDB / MMKV / file  | **IndexedDB** (ADR-0002)                          |
| 3   | Cloud sync        | None v0 / Supabase                | **Supabase** (ADR-0003)                           |
| 4   | Currency          | Single / multi                    | **JPY only**                                      |
| 5   | Account model     | Single wallet / multiple accounts | **Multiple accounts** (per-person banks + shared) |
| 6   | Categories        | Fixed list / user-defined         | **Hybrid** (starters + custom)                    |
| 7   | Income tracking   | Expenses only / income + expenses | **Both**                                          |
| 8   | Recurring         | Manual only v0 / recurring rules  | **Manual v0; recurring later**                    |
| 9   | Household sharing | Same device / two phones          | **Two phones → shared Supabase ledger**           |
| 10  | Telegram ingest   | —                                 | **Later (post-v0)**                               |


## Out of scope (initial bias — confirm in grill)

- Bank API / auto-import
- Shared household accounts
- Investment portfolio tracking
- Tax reporting

## Domain terms (stub — moves to `CONTEXT.md` when resolved)


| Term     | Draft meaning                | Notes                               |
| -------- | ---------------------------- | ----------------------------------- |
| Expense  | Money spent, logged manually | vs Income?                          |
| Category | Label grouping expenses      | e.g. Food, Transport                |
| Account  | Place money lives            | Wallet, bank — TBD if v0 needs this |


