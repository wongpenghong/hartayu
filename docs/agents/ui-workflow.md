# UI workflow

How agents and humans should change Hartayu UI without repeated layout churn. Complements [ADR-0004](../adr/0004-light-ios-ui-v0.md).

## Layer map

| Layer | Owns | Files |
|-------|------|-------|
| **Shell** | Tab bar, entry sheet, shared data for add flow | `MainLayout.tsx`, `BottomTabBar.tsx`, `EntrySheetProvider.tsx` |
| **Page** | One route, one job, fetch + compose | `src/pages/*Page.tsx` |
| **Component** | Reusable UI + one feature panel | `NativeUI.tsx`, `EntryList.tsx`, `EntrySheet.tsx`, `SettingsShell.tsx` |
| **Display utils** | Formatting, maps, filters (no JSX) | `entry-display.ts`, `pocket-utils.ts`, `category-utils.ts` |

Pages must not add a tab bar, FAB, or entry sheet. Use `useEntrySheet()` for add/edit.

## Bottom navigation

Four destinations + center add:

| Tab | Route | Notes |
|-----|-------|-------|
| Home | `/` | Dashboard only |
| Entries | `/entries` | List + edit own entries |
| + | sheet | Opens add entry globally |
| Settings | `/settings` | Pockets + Categories via in-page pill tabs |

Do not add a separate Pockets tab — pockets live under Settings.

## NativeUI catalog

Use existing primitives before adding styles in pages:

- Layout: `NativeScaffold`, `GroupCard`, `ListRow`, `SheetOverlay`
- Forms: `Field`, `TextField`, `SelectField`, `YenAmountField`, `DateField`, `PillTabs`, `PrimaryAction`
- Feedback: `ErrorNote`, `EmptyState`
- Icons: `PocketIcon`, `CategoryIcon`, `MemberChip`

If a control appears twice, extend `NativeUI.tsx` — do not copy Tailwind classes into pages.

## Page size

Keep pages under ~150 lines. Extract panels (e.g. `PocketsPanel`, `EntryList`) when a page grows.

## Session split

| Session type | Scope | Avoid |
|--------------|-------|-------|
| **Structure** | Routes, data fetch, CRUD, tests | Tailwind polish |
| **Polish** | Spacing, colors, typography in components | Route or data changes |

## Before UI work

1. Reference image or ADR-0004 section, if layout changes
2. State which layer: shell / page / component
3. Manual check: mobile width, tab bar clearance (`pb-28` on page main)

## Prompt template

```
/implement #N — UI layer: page only. Use NativeUI. Do not touch MainLayout or BottomTabBar.
Reference: [screenshot or ADR section]
```
