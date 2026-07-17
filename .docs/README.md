# Hartayu — project docs

Personal finance tracker for phone install. This folder is your **session memory** — what we decided, what's open, and which skill to run next.

## Files

| File | Purpose |
|------|---------|
| [tickets-v0.md](./tickets-v0.md) | Implementation ticket map (#2–#7) |
| [00-getting-started.md](./00-getting-started.md) | Skill path, step-by-step workflow, commands to type in Cursor |
| [01-project-vision.md](./01-project-vision.md) | Vision, scope, open decisions — updated after each grilling session |
| [02-decision-log.md](./02-decision-log.md) | Chronological record of resolved decisions |

## Matt skills layout (also used by agents)

These live outside `.docs` but agents read them:

| Path | Purpose |
|------|---------|
| `CONTEXT.md` (repo root) | Domain glossary — terms like *Expense*, *Entry*, *Household* |
| `docs/adr/` | Architecture Decision Records |
| `docs/agents/` | Issue tracker + agent config (from `/setup-matt-pocock-skills`) |

`.docs` = human-friendly trail. `CONTEXT.md` / `docs/` = what Cursor skills consume.

## Current status

**Phase:** UI direction locked (ADR-0004) → `/implement` [#3](https://github.com/wongpenghong/hartayu/issues/3)
