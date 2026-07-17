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
