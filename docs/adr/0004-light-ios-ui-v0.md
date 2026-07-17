# Light iOS-style UI for v0

Hartayu’s UI follows a light, iOS-inspired finance-app pattern: white cards on soft gray background, rounded corners, subtle shadows, colored category icons, bottom tab bar with a prominent center Add action. This matches the user’s reference mockup.

**Considered options:** Keep the dark scaffold from ticket #2; ship light/dark toggle for v0 (owner prefers dark, spouse prefers light). Light-only chosen for v0 to match reference and limit scope; system theme toggle deferred until after core features land.

**Consequences:** Ticket #2’s dark shell is replaced on Home and Settings via shared `NativeUI` (grouped cards, pill tabs, bottom bar). Sign-in keeps the existing auth layout for now. Revisit dark mode once v0 is usable.

**UI principles:** Clean, modern, uncluttered — generous spacing, rounded cards, subtle shadows, one primary action per screen. Add Entry opens as a sheet/modal with large amount input and picker rows (Date, Account, Category); optional Note instead of tag pills in v0.

**Bottom nav (v0):** Home, Entries, center Add (+), Settings. Pockets and Categories are pill tabs inside Settings — not separate bottom tabs.
