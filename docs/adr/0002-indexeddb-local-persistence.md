# IndexedDB for local persistence

Hartayu stores all transaction data on-device in IndexedDB (via Dexie). The app is a PWA with no backend in v0; expense and income records must survive offline use and app restarts without a server.

**Considered options:** localStorage (too limited), OPFS + SQLite (heavier than needed for personal-scale data). IndexedDB gives structured storage and query support for category/month rollups.

**Consequences:** Data is bound to the browser origin and device profile. Sharing across two phones requires a future sync or import path (e.g. export, cloud backup, or Telegram ingest) — not solved in v0.
