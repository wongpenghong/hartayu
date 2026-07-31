import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { GoalsPanel } from "@/components/GoalsPanel";
import {
  createCategory,
  fetchCategories,
  renameCategory,
  type Category,
} from "@/household/categories";
import { fetchGoalContributions, fetchGoals } from "@/household/goals";
import { fetchHouseholdMembers, type HouseholdMember } from "@/household/members";
import { memberName } from "@/household/member-utils";
import {
  archivePocket,
  createPocket,
  fetchPockets,
  unarchivePocket,
  updatePocket,
  type Pocket,
} from "@/household/pockets";
import { activePockets, archivedPockets } from "@/household/pocket-utils";
import {
  CategoryIcon,
  EmptyState,
  EmojiField,
  ErrorNote,
  Field,
  GroupCard,
  ListRow,
  MemberChip,
  PillTabs,
  PocketIcon,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
} from "@/components/NativeUI";
import { SettingsShell, type SettingsTab } from "@/components/SettingsShell";
import { useTheme } from "@/theme/ThemeProvider";

type PocketSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; pocket: Pocket };

type CategorySheetMode =
  | { kind: "closed" }
  | { kind: "add"; kindFilter: "expense" | "income" }
  | { kind: "edit"; category: Category };

function PocketsPanel({
  pockets,
  members,
  loading,
  onChange,
}: {
  pockets: Pocket[];
  members: HouseholdMember[];
  loading: boolean;
  onChange: (pockets: Pocket[]) => void;
}) {
  const [sheet, setSheet] = useState<PocketSheetMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [primaryMemberId, setPrimaryMemberId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { household } = useAuth();

  const visibleActivePockets = activePockets(pockets);
  const visibleArchivedPockets = archivedPockets(pockets);

  function openAdd() {
    setName("");
    setEmoji("");
    setPrimaryMemberId("");
    setError(null);
    setSheet({ kind: "add" });
  }

  function openEdit(pocket: Pocket) {
    setName(pocket.name);
    setEmoji(pocket.emoji ?? "");
    setPrimaryMemberId(pocket.primary_member_id ?? "");
    setError(null);
    setSheet({ kind: "edit", pocket });
  }

  function closeSheet() {
    setSheet({ kind: "closed" });
    setError(null);
  }

  async function handleSave() {
    if (!household) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (sheet.kind === "add") {
        const created = await createPocket(
          household.id,
          name,
          primaryMemberId || null,
          emoji,
        );
        onChange([...pockets, created]);
      } else if (sheet.kind === "edit") {
        const updated = await updatePocket(sheet.pocket.id, {
          name,
          primary_member_id: primaryMemberId || null,
          emoji,
        });
        onChange(pockets.map((row) => (row.id === updated.id ? updated : row)));
      }
      closeSheet();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to save pocket");
    } finally {
      setBusy(false);
    }
  }

  async function handleArchive() {
    if (sheet.kind !== "edit") {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const updated = await archivePocket(sheet.pocket.id);
      onChange(pockets.map((row) => (row.id === updated.id ? updated : row)));
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to archive pocket",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(pocket: Pocket) {
    setBusy(true);
    setError(null);
    try {
      const updated = await unarchivePocket(pocket.id);
      onChange(pockets.map((row) => (row.id === updated.id ? updated : row)));
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to restore pocket",
      );
    } finally {
      setBusy(false);
    }
  }

  const sheetOpen = sheet.kind !== "closed";
  const editingArchived = sheet.kind === "edit" && sheet.pocket.archived_at !== null;

  return (
    <>
      <GroupCard
        title="Active"
        footer="Bank accounts, e-money, and cash. Archived pockets stay for entry history."
      >
        <ListRow onClick={openAdd}>
          <span className="text-[17px] font-medium text-[#007aff]">+ Add pocket</span>
        </ListRow>
        {loading ? (
          <EmptyState message="Loading pockets…" />
        ) : (
          visibleActivePockets.map((pocket) => {
            const member = pocket.primary_member_id
              ? memberName(members, pocket.primary_member_id)
              : null;
            return (
              <ListRow key={pocket.id} onClick={() => openEdit(pocket)}>
                <PocketIcon name={pocket.name} emoji={pocket.emoji} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[17px] font-medium">
                    {pocket.name}
                  </span>
                  {member ? (
                    <span className="mt-0.5 block text-[13px] text-neutral-500">
                      Main member · {member}
                    </span>
                  ) : null}
                </span>
                <span className="text-[20px] text-neutral-300">›</span>
              </ListRow>
            );
          })
        )}
      </GroupCard>

      {visibleArchivedPockets.length > 0 ? (
        <GroupCard title="Archived">
          {visibleArchivedPockets.map((pocket) => (
            <div
              key={pocket.id}
              className="flex items-center gap-3 border-b border-[#ececee] px-4 py-3.5 last:border-b-0 dark:border-neutral-800"
            >
              <PocketIcon name={pocket.name} emoji={pocket.emoji} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[17px] text-neutral-500">{pocket.name}</p>
                <p className="text-[13px] text-neutral-400">Hidden from active lists</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRestore(pocket)}
                className="text-[15px] font-medium text-[#007aff] disabled:opacity-50"
              >
                Restore
              </button>
            </div>
          ))}
        </GroupCard>
      ) : null}

      {error && !sheetOpen ? <ErrorNote message={error} /> : null}

      <SheetOverlay
        open={sheetOpen}
        onClose={closeSheet}
        title={sheet.kind === "add" ? "New pocket" : "Edit pocket"}
      >
        <Field label="Icon">
          <EmojiField value={emoji} onChange={setEmoji} disabled={editingArchived} />
        </Field>
        <Field label="Name">
          <TextField
            value={name}
            onChange={setName}
            placeholder="SMBC, PayPay, Shared cash"
            disabled={editingArchived}
          />
        </Field>
        <Field label="Main member">
          <SelectField
            value={primaryMemberId}
            onChange={setPrimaryMemberId}
            disabled={editingArchived}
          >
            <option value="">None</option>
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.username}
              </option>
            ))}
          </SelectField>
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        {!editingArchived ? (
          <>
            <PrimaryAction
              disabled={busy || !name.trim()}
              onClick={() => void handleSave()}
            >
              {busy ? "Saving…" : "Save"}
            </PrimaryAction>
            {sheet.kind === "edit" ? (
              <PrimaryAction
                variant="destructive"
                disabled={busy}
                onClick={() => void handleArchive()}
              >
                {busy ? "Archiving…" : "Archive pocket"}
              </PrimaryAction>
            ) : null}
          </>
        ) : (
          <p className="text-[14px] leading-relaxed text-neutral-500">
            Archived pockets cannot be edited. Restore to make changes or use when
            logging entries.
          </p>
        )}
      </SheetOverlay>
    </>
  );
}

function CategoriesPanel({
  categories,
  loading,
  onChange,
}: {
  categories: Category[];
  loading: boolean;
  onChange: (categories: Category[]) => void;
}) {
  const [kindFilter, setKindFilter] = useState<"expense" | "income">("expense");
  const [sheet, setSheet] = useState<CategorySheetMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { household } = useAuth();

  const visible = categories.filter((category) => category.kind === kindFilter);

  function openAdd() {
    setName("");
    setEmoji("");
    setError(null);
    setSheet({ kind: "add", kindFilter });
  }

  function openEdit(category: Category) {
    if (category.is_starter) {
      return;
    }
    setName(category.name);
    setEmoji(category.emoji ?? "");
    setError(null);
    setSheet({ kind: "edit", category });
  }

  function closeSheet() {
    setSheet({ kind: "closed" });
    setError(null);
  }

  async function handleSave() {
    if (!household) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (sheet.kind === "add") {
        const created = await createCategory(household.id, name, sheet.kindFilter, emoji);
        onChange([...categories, created]);
      } else if (sheet.kind === "edit") {
        const updated = await renameCategory(sheet.category.id, name, emoji);
        onChange(
          categories.map((row) => (row.id === updated.id ? updated : row)),
        );
      }
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save category",
      );
    } finally {
      setBusy(false);
    }
  }

  const sheetOpen = sheet.kind !== "closed";

  return (
    <>
      <div className="rounded-[10px] bg-[#e3e3e8] p-[3px] dark:bg-neutral-800">
        <div className="grid grid-cols-2 gap-[3px]">
          {(
            [
              ["expense", "Expense"],
              ["income", "Income"],
            ] as const
          ).map(([kind, label]) => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={`rounded-[8px] py-2 text-[13px] font-semibold transition ${
                kindFilter === kind
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <GroupCard
        footer={
          kindFilter === "expense"
            ? "Starter categories are fixed. Custom ones can be renamed."
            : "Income starters stay fixed for stable reporting."
        }
      >
        <ListRow onClick={openAdd}>
          <span className="text-[17px] font-medium text-[#007aff]">+ Add category</span>
        </ListRow>
        {loading ? (
          <EmptyState message="Loading categories…" />
        ) : visible.length === 0 ? (
          <EmptyState message="No categories in this group." />
        ) : (
          visible.map((category) =>
            category.is_starter ? (
              <ListRow key={category.id}>
                <CategoryIcon kind={category.kind} emoji={category.emoji} />
                <span className="min-w-0 flex-1 truncate text-[17px] text-neutral-500">
                  {category.name}
                </span>
                <MemberChip label="Starter" />
              </ListRow>
            ) : (
              <ListRow key={category.id} onClick={() => openEdit(category)}>
                <CategoryIcon kind={category.kind} emoji={category.emoji} />
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
                  {category.name}
                </span>
                <span className="text-[20px] text-neutral-300">›</span>
              </ListRow>
            ),
          )
        )}
      </GroupCard>

      {error && !sheetOpen ? <ErrorNote message={error} /> : null}

      <SheetOverlay
        open={sheetOpen}
        onClose={closeSheet}
        title={sheet.kind === "add" ? "New category" : "Rename category"}
      >
        {sheet.kind === "add" ? (
          <p className="text-[14px] text-neutral-500">
            Adding to{" "}
            <span className="font-medium text-neutral-700">
              {sheet.kindFilter === "expense" ? "Expense" : "Income"}
            </span>
          </p>
        ) : null}
        <Field label="Icon">
          <EmojiField value={emoji} onChange={setEmoji} disabled={busy} />
        </Field>
        <Field label="Name">
          <TextField
            value={name}
            onChange={setName}
            placeholder="Subscriptions"
          />
        </Field>
        {error ? <ErrorNote message={error} /> : null}
        <PrimaryAction
          disabled={busy || !name.trim()}
          onClick={() => void handleSave()}
        >
          {busy ? "Saving…" : "Save"}
        </PrimaryAction>
      </SheetOverlay>
    </>
  );
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tabParam = searchParams.get("tab");
  const tab: SettingsTab =
    tabParam === "categories"
      ? "categories"
      : tabParam === "goals"
        ? "goals"
        : "pockets";
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Awaited<ReturnType<typeof fetchGoals>>>([]);
  const [contributions, setContributions] = useState<
    Awaited<ReturnType<typeof fetchGoalContributions>>
  >([]);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const [nextPockets, nextCategories, nextMembers, nextGoals, nextContributions] =
        await Promise.all([
          fetchPockets(),
          fetchCategories(),
          fetchHouseholdMembers(),
          fetchGoals(),
          fetchGoalContributions(),
        ]);
      setPockets(nextPockets);
      setCategories(nextCategories);
      setMembers(nextMembers);
      setGoals(nextGoals);
      setContributions(nextContributions);
    } catch (caught) {
      setPageError(
        caught instanceof Error ? caught.message : "Failed to load settings",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const { theme, setTheme } = useTheme();

  return (
    <SettingsShell
      activeTab={tab}
      onTabChange={(nextTab) => {
        navigate(`/settings?tab=${nextTab}`);
      }}
    >
      <GroupCard title="Appearance">
        <div className="px-4 py-4">
          <Field label="Theme">
            <PillTabs
              value={theme}
              onChange={setTheme}
              options={[
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </Field>
        </div>
      </GroupCard>
      {pageError ? <ErrorNote message={pageError} /> : null}
      {tab === "pockets" ? (
        <PocketsPanel
          pockets={pockets}
          members={members}
          loading={loading}
          onChange={setPockets}
        />
      ) : tab === "categories" ? (
        <CategoriesPanel
          categories={categories}
          loading={loading}
          onChange={setCategories}
        />
      ) : (
        <GoalsPanel
          goals={goals}
          contributions={contributions}
          pockets={pockets}
          loading={loading}
          onGoalsChange={setGoals}
          onContributionsChange={setContributions}
        />
      )}
    </SettingsShell>
  );
}
