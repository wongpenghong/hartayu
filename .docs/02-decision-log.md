# Decision log

Chronological record. Copy grilling outcomes here so `.docs` stays readable even before ADRs exist.

## 2026-07-17 — Project kickoff

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo name | `hartayu` | User-created |
| Doc trail | `.docs/` for human session memory | User request |
| Skill path | Main flow: setup → grill-with-docs → (prototype?) → to-spec → to-tickets/implement | Weekend mobile app with existing repo |
| Phase | Brainstorm not started | Awaiting `/grill-with-docs` |
| Issue tracker | GitHub Issues (`gh` CLI) | Remote: wongpenghong/hartayu |
| Triage labels | Defaults | needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix |
| Domain docs | Single-context | `CONTEXT.md` + `docs/adr/` at repo root |
| Agent config | `CLAUDE.md` + `docs/agents/` | Written 2026-07-17 |
| Install model | PWA | ADR-0001; no native toolchain for v0 |
| Data storage | IndexedDB (Dexie) | ADR-0002; on-device only v0 |
| Scope | Expense + income + categories | Household (you + wife) |
| Future | Telegram + web entry | Post-v0; not in weekend MVP |
| Sync backend | Supabase (free tier) | ADR-0003; two-phone household |
| Currency | JPY only | User lives in Japan |
| Categories | Hybrid | Starter list + custom |
| Accounts | Multiple | Tracking split only; household view combines all |
| Recurring | Manual v0 | Rules deferred to later release |
| Main screen (v0) | Option B | Combined total + per-account; categories on drill-down |
| Household join | Invite link | Supabase Auth; separate members |
| Auth v0 | Username + 6-digit PIN | ADR-0006; seed script provisions two Members; no invite/sign-up |
| UI language | English only | Indonesian household in Japan; JPY amounts |
| Entry note | Optional | Free-text; room for future features (search, tags) |
| UI theme v0 | Light iOS-style | ADR-0004; dark/light toggle later |
| Home layout | Hybrid (Option C) | Hero net + account cards + donut + recent list |
| Bottom nav | Option C | Home · Entries · + · Categories · Settings |
| Add Entry UI | Reference sheet, no tags v0 | Category + optional Note; tag pills later |
| Form label | Account | Not "Wallet" — matches CONTEXT.md |
| Deploy | Vercel (free tier) | ADR-0005; Supabase stays separate; deploy at #7 |
| Analytics | Later | Full breakdown/stats screen like reference; home donut is summary only |
| Spec | `.docs/spec-v0.md` | GitHub [#1](https://github.com/wongpenghong/hartayu/issues/1) · `ready-for-agent` |
| Tickets | `.docs/tickets-v0.md` | [#2](https://github.com/wongpenghong/hartayu/issues/2)–[#7](https://github.com/wongpenghong/hartayu/issues/7) |

### Next actions

1. Fresh chat → `/implement` on [#2](https://github.com/wongpenghong/hartayu/issues/2)
2. Continue frontier (#3 → … → #7), new session per ticket

## 2026-07-31 — Portfolio module grill (#17)

Pre-implement grill for investment tracking (user assets: stocks, PSA cards, fixed-return business; liquid in Pockets only).

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Module boundary | Own module (More → Portfolio) | Separate from cash-flow Analysis; level vs flow |
| Liquid | Pockets only — exclude from Portfolio | Avoid double-count; portfolio = non-pocket wealth |
| Analytics in #17 | Tier A only | Valuation + charts; P&L deferred |
| Snapshot model | Batch sessions + carry-forward | Month/quarter ritual; honest trend line |
| Charts (#17) | Total trend + allocation donut | Per spec; no per-holding sparklines yet |
| Filter pills | By asset class in #17 | Filter holdings/chart to one class |
| Cost basis | Store on holding; hide gain in #17 UI | P&L needs follow-up grill (#17b) |
| Default asset classes | Stocks, Collectibles, Private | Not generic "Portfolio" |
| Asset class CRUD | Settings (with pockets/categories) | Admin separate from Portfolio page |
| Cash-flow Analytics | Out of #17 | Stays `/analysis`; vision Analytics screen still deferred |
| P&L breakdown | Backlog #17b | Category + holding unrealized P&L |
| Filter pill + chart | Class-only when filtered | Matches Analysis; trend + donut scoped to selected class |
| Receipt OCR (#16) | Deferred to v2 | Low prio; unblocks #17 Portfolio |

Tier B backlog (grill before implement): contributions vs market gain, per-holding sparklines, stale snapshot hints, household net worth (Portfolio + Pockets).

Tier C (no ticket): live prices, tax lots, full Analytics screen.

## 2026-07-31 — Entry attribution (Family) grill

Shared expenses (rent, utilities) should not skew User breakdown toward whoever logged them.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Attribution picker | Me · {partner username} · Family | Manual per entry; default Me |
| Scope | Expense + income | Same mental model for joint salary/remittance |
| Category defaults | None | User picks Family explicitly for rent/utilities |
| Auth vs attribution | Separate | `member_id` = logger (RLS); `attributed_member_id` = breakdown |
| Edit/delete | Logger only | RLS unchanged |
| Existing entries | Leave as-is | Backfill `attributed_member_id = member_id` in migration |
| Entry list chip | Attribution | Family shows "Family", not logger |
| Label | Family | Third donut slice; "Household" stays domain term |
| Transfers | Out of scope | Not in User breakdown today |
| Family edit/delete | Either household member | Shared entries; personal entries stay logger-only |

## 2026-07-31 — Bill reminders grill (#18)

Recurring bill reminders (Wafin-style pengingat tagihan). Separate from Portfolio; `#17` blocker removed.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Domain model | Separate `bills` entity | Schedule/template; entries remain ledger of record |
| Amount | Optional on bill | Fixed rent prefills; variable utilities leave amount blank |
| CRUD | Settings only | Same admin pattern as categories/pockets |
| Recurrence | Monthly, day-of-month (JST) | Day 31 → last day of shorter months |
| Cycle | One instance per calendar month | `last_paid_period` e.g. `2026-07` |
| Home visibility | Unpaid bills visible all month | Hidden when all clear; overdue styling after due day |
| Home placement | Card after hero, before pockets | Actionable; no empty section |
| Reminders v1 | In-app Home section only | Web Push deferred to follow-up ticket |
| Mark paid | **Pay** + **Already logged** | Pay → expense sheet; dismiss without duplicate entry |
| Pay prefill | Category, amount (if set), pocket, attribution, note | Note: `{name} {Mon YYYY}` e.g. Electricity Jul 2026 |
| Scope | Household-shared | Either member clears; Supabase sync |
| Active | `is_active` toggle | Inactive hidden from Home; kept in Settings |
| Entry link | Optional `bill_id` on entry | Set when created via Pay only |
| Blocker | None (was #17) | Cash-flow feature; priority-only |

**Deferred:** Web Push notifications, "Make recurring" from expense sheet, amount estimates on Home, link existing entry to bill.

**Schema sketch:** `bills(household_id, name, amount_yen?, due_day, category_id, default_pocket_id?, default_attributed_member_id?, last_paid_period?, is_active)` + nullable `bill_id` on `entries`.

## 2026-07-31 — Collectible market prices grill (SNKRDUNK)

Extends Portfolio (#17). Spec: `.docs/spec-collectible-market-prices.md` · ADR-0009.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Market source v1 | SNKRDUNK size-chips API | Public JSON; confirmed for product 854923 / P-159 |
| Lookup key | `collectible_code` + manual `snkrdunk_product_id` | User pastes ID from URL once; no fragile HTML search resolver |
| Schema | `collectible_market_links` 1:1 on `holdings` | SNKRDUNK fields only on Collectibles; stocks/private untouched |
| Condition grades | `a`, `b`, `c`, `d`, `psa9`, `psa10` | Covers raw + common graded without huge dropdown |
| No listing | No quote — skip from auto total | Q2 B; no silent fallback to raw A grade |
| Refresh | Daily cron 06:00 JST + manual Refresh | Set-and-forget chart + on-demand freshness |
| Price write path | New `snapshot_session` per refresh | Reuses portfolio trend/allocation model |
| Mixed holdings | Linked → live quote; others carried forward | One daily household total on chart |
| Same-day sessions | Multiple OK; latest per date wins | Manual snapshot or Refresh overrides cron |
| Cost at personal scale | ~$0 | Edge Function + HTTP within free tier |
| Implementation | Deferred — design doc + ticket first | Next session `/implement` |

**Code gap flagged:** `portfolioTrendPoints` emits one point per session; implement dedupe by `as_of_date` when multiple sessions share a date.

**Deferred:** card-code-only resolver, BGS/ARS grades, other markets, price-change alerts.

## 2026-07-31 — Portfolio P&L grill (#26)

Follow-up to #17. Unrealized gain on latest snapshot values; no live quotes or realized/tax-lot P&L.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Cost basis semantics | Total position cost | Matches total-value shortcut; P&L = value − basis |
| Holding display | Cost + value + P&L (+¥ and +%) | User wants cost visible on rows (Option B) |
| Missing basis or snapshot | N/A on row; exclude from rollup | No fake percentages |
| Class / household rollup | Sum eligible holdings only | Footer `P&L for N of M holdings` |
| Summary card | Cost → Value → P&L + blended % | Mirrors rows; eligible totals only |
| All filter summary | Household total only | No per-class rows in summary card |
| Zero eligible | Hide summary card | Footer hint to add cost basis when snapshots exist |
| Colors | Green gain, red loss, gray flat / N/A | Matches Home spend/income cues |
| Charts | Unchanged | Valuation-only in #17 |
| #27 blocker | None | P&L reads latest snapshot; SNKRDUNK only changes snapshot source |

**Deferred:** realized P&L, tax lots, live market prices, P&L on trend/donut charts.
