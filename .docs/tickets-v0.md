# Hartayu v0 — implementation tickets

Parent spec: [GitHub #1](https://github.com/wongpenghong/hartayu/issues/1)

Work the **frontier** — first ticket with all blockers done.

| # | Title | Blocked by | Status |
|---|--------|------------|--------|
| [#2](https://github.com/wongpenghong/hartayu/issues/2) | Scaffold PWA app + household ledger math tests | — | **Start here** |
| [#3](https://github.com/wongpenghong/hartayu/issues/3) | Supabase schema, RLS, auth and household bootstrap | #2 | |
| [#4](https://github.com/wongpenghong/hartayu/issues/4) | Invite link for second household member | #3 | |
| [#5](https://github.com/wongpenghong/hartayu/issues/5) | Manage accounts and custom categories | #3 | |
| [#6](https://github.com/wongpenghong/hartayu/issues/6) | Log entries and recent activity list | #5 | |
| [#7](https://github.com/wongpenghong/hartayu/issues/7) | Home dashboard, category summary, and PWA polish | #6 | |

## How to implement

1. Open a **fresh chat**
2. Run `/implement` referencing the frontier issue (e.g. `#2`)
3. Repeat after each ticket merges

Parallel path after #3: #4 (invite) and #5 (accounts) can run in either order; #6 needs #5.
