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
One logged expense or income row — the atomic thing you add in under ~10 seconds. Has amount, type, category, pocket, date, and an optional note.
_Avoid_: Transaction (overloaded with banking), record

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
A monetary value always expressed in Japanese yen (JPY). v0 has no currency conversion.
_Avoid_: Yen (use JPY in data; 円 is fine in UI copy)

**Net**:
Income minus expense for a period (v0 home shows net for the current calendar month in JST).
_Avoid_: Profit, surplus
