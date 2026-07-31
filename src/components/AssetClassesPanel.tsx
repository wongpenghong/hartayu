import { useState } from "react";
import { useAuth } from "@/auth/AuthProvider";
import {
  createAssetClass,
  deleteAssetClass,
  renameAssetClass,
  type AssetClass,
} from "@/household/asset-classes";
import {
  EmptyState,
  ErrorNote,
  Field,
  GroupCard,
  ListRow,
  MemberChip,
  PrimaryAction,
  SheetOverlay,
  TextField,
} from "@/components/NativeUI";

type AssetClassSheetMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; assetClass: AssetClass };

export function AssetClassesPanel({
  assetClasses,
  loading,
  onChange,
}: {
  assetClasses: AssetClass[];
  loading: boolean;
  onChange: (assetClasses: AssetClass[]) => void;
}) {
  const { household } = useAuth();
  const [sheet, setSheet] = useState<AssetClassSheetMode>({ kind: "closed" });
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setName("");
    setError(null);
    setSheet({ kind: "add" });
  }

  function openEdit(assetClass: AssetClass) {
    setName(assetClass.name);
    setError(null);
    setSheet({ kind: "edit", assetClass });
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
        const created = await createAssetClass(household.id, name);
        onChange([...assetClasses, created]);
      } else if (sheet.kind === "edit") {
        const updated = await renameAssetClass(sheet.assetClass.id, name);
        onChange(
          assetClasses.map((row) => (row.id === updated.id ? updated : row)),
        );
      }
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to save asset class",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (sheet.kind !== "edit" || sheet.assetClass.is_starter) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await deleteAssetClass(sheet.assetClass.id);
      onChange(assetClasses.filter((row) => row.id !== sheet.assetClass.id));
      closeSheet();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to delete asset class",
      );
    } finally {
      setBusy(false);
    }
  }

  const sheetOpen = sheet.kind !== "closed";

  return (
    <>
      <GroupCard footer="Starter names are fixed. Custom classes can be renamed or deleted when unused.">
        <ListRow onClick={openAdd}>
          <span className="text-[17px] font-medium text-[#007aff]">+ Add asset class</span>
        </ListRow>
        {loading ? (
          <EmptyState message="Loading asset classes…" />
        ) : assetClasses.length === 0 ? (
          <EmptyState message="No asset classes yet." />
        ) : (
          assetClasses.map((assetClass) =>
            assetClass.is_starter ? (
              <ListRow key={assetClass.id} onClick={() => openEdit(assetClass)}>
                <span className="min-w-0 flex-1 truncate text-[17px] text-neutral-500">
                  {assetClass.name}
                </span>
                <MemberChip label="Starter" />
              </ListRow>
            ) : (
              <ListRow key={assetClass.id} onClick={() => openEdit(assetClass)}>
                <span className="min-w-0 flex-1 truncate text-[17px] font-medium">
                  {assetClass.name}
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
        title={
          sheet.kind === "add"
            ? "New asset class"
            : sheet.kind === "edit" && sheet.assetClass.is_starter
              ? "Starter class"
              : "Edit asset class"
        }
      >
        {sheet.kind === "edit" && sheet.assetClass.is_starter ? (
          <p className="text-[14px] text-neutral-500">
            Starter asset class{" "}
            <span className="font-medium text-neutral-700">{sheet.assetClass.name}</span>{" "}
            cannot be renamed.
          </p>
        ) : (
          <>
            <Field label="Name">
              <TextField
                value={name}
                onChange={setName}
                placeholder="Real estate, Crypto"
                disabled={busy}
              />
            </Field>
            {error ? <ErrorNote message={error} /> : null}
            <PrimaryAction
              disabled={busy || !name.trim()}
              onClick={() => void handleSave()}
            >
              {busy ? "Saving…" : "Save"}
            </PrimaryAction>
            {sheet.kind === "edit" && !sheet.assetClass.is_starter ? (
              <PrimaryAction
                variant="destructive"
                disabled={busy}
                onClick={() => void handleDelete()}
              >
                {busy ? "Deleting…" : "Delete asset class"}
              </PrimaryAction>
            ) : null}
          </>
        )}
      </SheetOverlay>
    </>
  );
}
