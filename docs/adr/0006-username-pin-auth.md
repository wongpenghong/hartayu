# Username + PIN auth for two members

v0 has exactly two household Members (you and your wife). Email/password sign-up and invite links add friction without benefit when accounts are provisioned once and credentials are shared by text.

**Considered options:** Keep Supabase email/password with sign-up; magic link; shared household PIN (loses per-Member entry attribution). Username + 6-digit PIN with pre-provisioned accounts chosen for fast phone login while keeping separate Member identities via Supabase Auth.

**Consequences:** No in-app sign-up. One-time `npm run seed:household` creates both auth users, the Household, membership rows, and starter Categories. Supabase stores `{username}@hartayu.internal` internally; the UI shows username only. Ticket #4 (invite link) is dropped.
