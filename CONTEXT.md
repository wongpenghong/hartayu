# Hartayu

Personal household finance tracker as a PWA. You and your wife log expenses and income, grouped by category, to see where money goes — without spreadsheets or a generic app.

## Language

**Expense**:
Money spent, recorded manually with an amount, category, and date.
_Avoid_: Payment, purchase, outflow

**Income**:
Money received, recorded manually with an amount, category, and date.
_Avoid_: Earning, inflow, deposit

**Category**:
A label that groups expenses or income for reporting (e.g. Food, Transport, Salary). v0 ships a starter list; household members can add custom categories.
_Avoid_: Tag, bucket

**Entry**:
One logged expense, income, or transfer row — the atomic thing you add in under ~10 seconds. Expense and income have amount, type, category, pocket, date, and an optional note; transfer moves JPY between pockets without changing household net.
_Avoid_: Transaction (overloaded with banking), record

**Transfer**:
An entry kind that moves JPY from one pocket to another. Does not change household net or category totals.
_Avoid_: Payment, conversion

**Budget**:
The monthly spending cap for an expense category, in JPY. Shown in UI as "budget"; compared against expense entries in the current calendar month (JST).
_Avoid_: Limit (old UI term), allocation (percent-of-income envelopes)

**Budget group**:
An optional display grouping for expense categories — Needs, Wants, or Savings. Groups budget rows on the Budget screen; caps remain fixed yen amounts, not percentages of income.
_Avoid_: Envelope, bucket

**Foreign amount**:
Optional IDR value on an entry for purchases logged in rupiah. Household rollups and budgets use JPY only; foreign amount is what was actually paid in IDR.
_Avoid_: Second ledger, converted total

**Exchange rate**:
A user-entered IDR→JPY rate on an entry, used to derive amount_yen from foreign amount. Per entry only; no fetched or household-default rate.
_Avoid_: Live FX, API quote

**Note**:
Optional free-text on an entry describing what it was for (e.g. "Costco groceries"). Empty by default.
_Avoid_: Memo, description

**Household**:
The shared financial view for you and your wife. All pockets roll up into one combined picture of money in and out; pockets exist only to show where money sits, not separate ledgers.

**Pocket**:
Where money lives that an entry is logged against — bank account, e-money, cash, etc. (e.g. your SMBC, wife's MUFG, PayPay, shared cash). Pockets belong to the household and split balances for tracking; totals still combine at household level.
_Avoid_: Account (conflicts with login), wallet

**Member**:
A person in the household who can log entries (you or your wife).
_Avoid_: User (implementation term in auth)

**Amount**:
The canonical monetary value on an entry, always in Japanese yen (JPY). Drives net, budgets, analysis, and pocket balances. May be typed directly or derived from foreign amount × exchange rate.
_Avoid_: Yen (use JPY in data; 円 is fine in UI copy)

**Net**:
Income minus expense for a period (v0 home shows net for the current calendar month in JST).
_Avoid_: Profit, surplus

**Asset class**:
A label grouping portfolio holdings for allocation (e.g. Stocks, Collectibles, Private). Household-scoped; CRUD in Settings. Default starters: Stocks, Collectibles, Private.
_Avoid_: Category (cash-flow), pocket

**Holding**:
One tracked investment position — name, asset class, quantity (optional for total-value-only items), optional cost basis. Value comes from snapshots, not the cash-flow ledger. Portfolio never auto-posts to pockets; cash from a holding (e.g. monthly private-lending return) is logged separately as income to a pocket. For collectibles, one holding per card identity (code + grade + market product); extra slabs of the same card use quantity, not separate rows.
_Avoid_: Entry, pocket, cert (as a separate holding)

**Holding draft**:
In-progress data for adding or editing a holding, persisted locally on the device so a form survives switching browser tabs. Expires after a short TTL if not submitted or cancelled.
_Avoid_: Autosave, cache

**Bulk add session**:
A client-side queue of holdings staged before a single batch submit. Used when entering many collectibles at once; cost basis is usually filled later. Asset class and condition grade may carry forward between queued rows; name, code, and product ID reset each row.
_Avoid_: Import, CSV upload

**Portfolio selection**:
A multi-select filter on portfolio views. Toggle holdings (or asset classes) via the allocation chart or holdings list; trend, P&L, allocation, and list all reflect the selected set. Empty selection means show all.
_Avoid_: Filter tab, drill-down

**Value snapshot**:
A dated mark-to-market for holdings. Batch sessions: one as-of date, update all holdings; skipped lines carry forward last price. Supports unit price × quantity or total value shortcut. Collectibles may auto-fill from a **market quote**; other holdings stay manual.
_Avoid_: Entry, balance (pocket)

**Collectible code**:
Catalog identifier printed on a trading card (e.g. `P-159`). Used to label a Collectibles holding; paired with a market link for price lookup.
_Avoid_: SKU, product ID (implementation term)

**Condition grade**:
The physical or grading state used to pick a market price (raw A–D, or PSA9/PSA10). Set per Collectibles holding with a market link.
_Avoid_: Rank, quality

**Market link**:
Optional connection between a Collectibles holding and an external resale market (v1: SNKRDUNK). Stores collectible code, market product reference, and condition grade.
_Avoid_: Ticker, symbol

**Market quote**:
The minimum listing price fetched for a market link at its condition grade on a given refresh.
_Avoid_: NAV, appraisal

**No quote**:
The market has no listing at the chosen condition grade. The holding is excluded from that auto snapshot total until the user enters a manual value.
_Avoid_: N/A, zero
