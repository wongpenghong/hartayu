# PWA for mobile delivery

Hartayu is a personal finance tracker meant to run on the user's phone. We chose a Progressive Web App (install via Add to Home Screen) over Expo, Flutter, or Capacitor. The user prioritised speed to a working weekend MVP and is comfortable with web tooling; native app store distribution is not required for v0.

**Considered options:** Expo (real native install, more setup), Flutter (strong UX, new stack), Capacitor (web-in-shell). Rejected in favour of zero native toolchain for v0.

**Consequences:** iOS PWA storage and lifecycle quirks apply; offline persistence must use browser APIs (IndexedDB). Revisit if App Store presence or deep native APIs become requirements.
