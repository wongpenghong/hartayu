# Getting started — skill path for Hartayu

Weekend-sized mobile app. You already have the repo. Use the **main flow** from `/ask-matt`; skip flows meant for bugs, triage queues, or foggy greenfield megaprojects.

## Which skills fit brainstorming?

| Skill | Use for Hartayu? | Why |
|-------|------------------|-----|
| **`/grill-with-docs`** | **Start here** | Relentless interview; builds `CONTEXT.md` + ADRs as you decide |
| **`/domain-modeling`** | Automatic (via grill) | Pins terms: *Expense*, *Account*, *Category* — avoids overloaded words |
| **`/prototype`** | Maybe, mid-flow | When you must *see* UI or *run* state logic before committing |
| **`/to-spec`** | After grilling | Turns agreed scope into a spec (PRD) on your issue tracker |
| **`/to-tickets`** | If >1 build session | Splits spec into small tickets with blockers |
| **`/implement`** | Build phase | TDD + code review per ticket; fresh context per ticket |
| **`/setup-matt-pocock-skills`** | **Once, before others** | Configures issue tracker + `docs/agents/` layout |
| **`/handoff`** | Context full | Compacts thread to a file; open new session and `@` that file |
| **`/grill-me`** | No | Same grill, but no repo docs — you have a repo |
| **`/wayfinder`** | No | For huge foggy efforts; overkill for a weekend app |
| **`/triage`** | No | For incoming bugs/requests you didn't write |
| **`/diagnosing-bugs`** | Later | When something breaks and won't reproduce easily |
| **`/research`** | Optional | Deep dive on a tech choice (e.g. Expo vs Flutter) — background agent, cited markdown |

## Step-by-step (do in order)

### Step 0 — One-time repo setup

In Cursor chat:

```
/setup-matt-pocock-skills
```

Pick **local markdown** issue tracker (solo weekend project) unless you use GitHub Issues. This creates `docs/agents/` and tells other skills where work lives.

Update `.docs/02-decision-log.md` with: issue tracker choice, doc layout.

---

### Step 1 — Brainstorm / sharpen (you are here)

```
/grill-with-docs
```

Goal: answer decision-tree questions **one at a time**:

- MVP scope (what's in v0.1 vs never)
- Phone install path: native app vs PWA vs hybrid (Expo, Capacitor, Flutter)
- Data: on-device only vs cloud sync
- Currency, accounts, categories, recurring expenses
- Offline-first requirements

Output lands in:

- `CONTEXT.md` — glossary
- `docs/adr/` — hard-to-reverse choices (e.g. "local SQLite only")
- `.docs/01-project-vision.md` — you or the agent copy summaries here for your own reading

**Rule:** Stay in **one context window** through grilling → spec → tickets. Don't `/compact` mid-phase.

---

### Step 2 — Optional detours

**UI feels unclear:**

```
/prototype
```

Throwaway UI or state-machine demo. Delete code after; keep the decision in an ADR or `.docs/02-decision-log.md`.

**Need primary-source research** (store policies, library comparison):

```
/research <question>
```

Read the generated markdown file, then continue `/grill-with-docs`.

---

### Step 3 — Spec

When grilling confirms shared understanding:

```
/to-spec
```

Produces a full spec on the issue tracker. Review it; edit before tickets.

---

### Step 4 — Split work (multi-session) or build (single weekend)

**Several sessions:**

```
/to-tickets
```

Then per ticket, **new chat each time:**

```
/implement
```

**Single focused weekend** — skip `/to-tickets`; `/implement` directly from the spec in the same thread if scope is tiny.

---

### Step 5 — Context hygiene

| Situation | Command |
|-----------|---------|
| Thread getting long before `/to-tickets` | `/handoff` → new session `@.docs/...` |
| Phase done, same thread, OK to lose verbatim history | `/compact` |
| Ticket done | Commit; next ticket = **fresh session** |

## Suggested MVP framing (starting point — not decided)

Grilling will challenge this. Useful as a default recommendation:

1. **Install on phone:** Expo (React Native) or PWA — fastest weekend path; native feel vs store install tradeoff
2. **v0.1:** Manual expense entry, categories, monthly summary, on-device storage
3. **Not v0.1:** Bank sync, multi-user, cloud backup, investments

Confirm or reject in Step 1.

## After each session

1. Append resolved items to `.docs/02-decision-log.md`
2. Refresh **Current status** in `.docs/README.md`
3. If terms changed, ensure `CONTEXT.md` matches (grill-with-docs usually does this)
