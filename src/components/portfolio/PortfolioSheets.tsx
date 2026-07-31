import type { AssetClass } from "@/household/asset-classes";
import type { BulkHoldingQueueItem } from "@/household/holding-bulk-queue";
import {
  CONDITION_GRADE_LABELS,
  CONDITION_GRADES,
  type ConditionGrade,
} from "@/market/snkrdunk";
import type { Holding } from "@/ledger/portfolio";
import { formatYen } from "@/lib/format-yen";
import {
  CheckboxField,
  DateField,
  ErrorNote,
  Field,
  PrimaryAction,
  SelectField,
  SheetOverlay,
  TextField,
  YenAmountField,
} from "@/components/NativeUI";

export function PortfolioHoldingSheet({
  mode,
  assetClasses,
  name,
  assetClassId,
  quantity,
  costBasis,
  showMarketLinkFields,
  collectibleCode,
  snkrdunkProductId,
  conditionGrade,
  busy,
  error,
  onClose,
  onNameChange,
  onAssetClassIdChange,
  onQuantityChange,
  onCostBasisChange,
  onCollectibleCodeChange,
  onSnkrdunkProductIdChange,
  onConditionGradeChange,
  onSave,
  onDelete,
}: {
  mode: "closed" | "add" | "edit";
  assetClasses: AssetClass[];
  name: string;
  assetClassId: string;
  quantity: string;
  costBasis: string;
  showMarketLinkFields: boolean;
  collectibleCode: string;
  snkrdunkProductId: string;
  conditionGrade: ConditionGrade | "";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onNameChange: (value: string) => void;
  onAssetClassIdChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onCostBasisChange: (value: string) => void;
  onCollectibleCodeChange: (value: string) => void;
  onSnkrdunkProductIdChange: (value: string) => void;
  onConditionGradeChange: (value: ConditionGrade | "") => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <SheetOverlay
      open={mode !== "closed"}
      onClose={onClose}
      title={mode === "add" ? "New holding" : "Edit holding"}
    >
      <Field label="Name">
        <TextField
          value={name}
          onChange={onNameChange}
          placeholder="VTI, PSA 10 Charizard"
          disabled={busy}
        />
      </Field>
      <Field label="Asset class">
        <SelectField value={assetClassId} onChange={onAssetClassIdChange} disabled={busy}>
          {assetClasses.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </SelectField>
      </Field>
      <Field label="Quantity (optional)">
        <TextField
          value={quantity}
          onChange={onQuantityChange}
          placeholder="Leave blank for total-value-only items"
          disabled={busy}
        />
      </Field>
      <Field label="Total cost (optional)">
        <YenAmountField value={costBasis} onChange={onCostBasisChange} disabled={busy} />
      </Field>
      {showMarketLinkFields ? (
        <div className="space-y-4 rounded-2xl border border-[#ececee] p-4 dark:border-neutral-800">
          <p className="text-[15px] font-semibold">SNKRDUNK market link (optional)</p>
          <Field label="Collectible code">
            <TextField
              value={collectibleCode}
              onChange={onCollectibleCodeChange}
              placeholder="P-159"
              disabled={busy}
            />
          </Field>
          <Field label="SNKRDUNK product ID">
            <TextField
              value={snkrdunkProductId}
              onChange={onSnkrdunkProductIdChange}
              placeholder="854923"
              disabled={busy}
            />
          </Field>
          <p className="text-[13px] text-neutral-500">
            From URL /apparels/854923 → use 854923
          </p>
          <Field label="Condition grade">
            <SelectField
              value={conditionGrade}
              onChange={(value) => onConditionGradeChange(value as ConditionGrade | "")}
              disabled={busy}
            >
              <option value="">Select grade</option>
              {CONDITION_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {CONDITION_GRADE_LABELS[grade]}
                </option>
              ))}
            </SelectField>
          </Field>
        </div>
      ) : null}
      {error ? <ErrorNote message={error} /> : null}
      <PrimaryAction
        disabled={busy || !name.trim() || !assetClassId}
        onClick={onSave}
      >
        {busy ? "Saving…" : "Save"}
      </PrimaryAction>
      {mode === "edit" ? (
        <PrimaryAction variant="destructive" disabled={busy} onClick={onDelete}>
          {busy ? "Deleting…" : "Delete holding"}
        </PrimaryAction>
      ) : null}
    </SheetOverlay>
  );
}

export function PortfolioBulkAddSheet({
  open,
  assetClasses,
  collectiblesClassId,
  assetClassId,
  conditionGrade,
  name,
  quantity,
  costBasis,
  collectibleCode,
  snkrdunkProductId,
  queue,
  duplicateWarning,
  busy,
  error,
  onClose,
  onAssetClassIdChange,
  onConditionGradeChange,
  onNameChange,
  onQuantityChange,
  onCostBasisChange,
  onCollectibleCodeChange,
  onSnkrdunkProductIdChange,
  onAddAnother,
  onSaveAll,
}: {
  open: boolean;
  assetClasses: AssetClass[];
  collectiblesClassId: string;
  assetClassId: string;
  conditionGrade: ConditionGrade | "";
  name: string;
  quantity: string;
  costBasis: string;
  collectibleCode: string;
  snkrdunkProductId: string;
  queue: BulkHoldingQueueItem[];
  duplicateWarning: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onAssetClassIdChange: (value: string) => void;
  onConditionGradeChange: (value: ConditionGrade | "") => void;
  onNameChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onCostBasisChange: (value: string) => void;
  onCollectibleCodeChange: (value: string) => void;
  onSnkrdunkProductIdChange: (value: string) => void;
  onAddAnother: () => void;
  onSaveAll: () => void;
}) {
  const totalCount = queue.length;
  const canAddAnother =
    !busy && name.trim() !== "" && collectibleCode.trim() !== "" && conditionGrade !== "";

  return (
    <SheetOverlay open={open} onClose={onClose} title="Bulk add collectibles">
      <Field label="Asset class">
        <SelectField
          value={assetClassId || collectiblesClassId}
          onChange={onAssetClassIdChange}
          disabled={busy}
        >
          {assetClasses.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </SelectField>
      </Field>
      <Field label="Condition grade">
        <SelectField
          value={conditionGrade}
          onChange={(value) => onConditionGradeChange(value as ConditionGrade | "")}
          disabled={busy}
        >
          <option value="">Select grade</option>
          {CONDITION_GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {CONDITION_GRADE_LABELS[grade]}
            </option>
          ))}
        </SelectField>
      </Field>
      <Field label="Name">
        <TextField
          value={name}
          onChange={onNameChange}
          placeholder="PSA 10 Charizard"
          disabled={busy}
        />
      </Field>
      <Field label="Collectible code">
        <TextField
          value={collectibleCode}
          onChange={onCollectibleCodeChange}
          placeholder="P-159"
          disabled={busy}
        />
      </Field>
      <Field label="SNKRDUNK product ID">
        <TextField
          value={snkrdunkProductId}
          onChange={onSnkrdunkProductIdChange}
          placeholder="854923"
          disabled={busy}
        />
      </Field>
      <Field label="Quantity (optional)">
        <TextField
          value={quantity}
          onChange={onQuantityChange}
          placeholder="Leave blank for total-value-only items"
          disabled={busy}
        />
      </Field>
      <Field label="Total cost (optional)">
        <YenAmountField value={costBasis} onChange={onCostBasisChange} disabled={busy} />
      </Field>
      {duplicateWarning ? (
        <p className="text-[13px] font-medium text-[#ff9500]">
          This code, grade, and product ID are already in the queue.
        </p>
      ) : null}
      {queue.length > 0 ? (
        <div className="space-y-2 rounded-2xl border border-[#ececee] p-4 dark:border-neutral-800">
          <p className="text-[15px] font-semibold">Queued ({queue.length})</p>
          {queue.map((item) => (
            <p key={item.clientKey} className="text-[14px] text-neutral-600 dark:text-neutral-400">
              {item.name} · {item.collectibleCode}
              {item.costBasisYen != null ? ` · ${formatYen(item.costBasisYen)}` : ""}
            </p>
          ))}
        </div>
      ) : null}
      {error ? <ErrorNote message={error} /> : null}
      <PrimaryAction variant="secondary" disabled={!canAddAnother} onClick={onAddAnother}>
        Add another
      </PrimaryAction>
      <PrimaryAction disabled={busy || totalCount === 0} onClick={onSaveAll}>
        {busy ? "Saving…" : `Save all (${totalCount})`}
      </PrimaryAction>
    </SheetOverlay>
  );
}

export type SnapshotLineState = {
  unitPriceInput: string;
  totalValueInput: string;
  skipped: boolean;
};

export function PortfolioSnapshotSheet({
  open,
  holdings,
  assetClassNames,
  snapshotDate,
  snapshotLines,
  busy,
  error,
  onClose,
  onDateChange,
  onLineChange,
  onSave,
}: {
  open: boolean;
  holdings: Holding[];
  assetClassNames: Map<string, string>;
  snapshotDate: string;
  snapshotLines: Record<string, SnapshotLineState>;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onDateChange: (value: string) => void;
  onLineChange: (holdingId: string, line: SnapshotLineState) => void;
  onSave: () => void;
}) {
  return (
    <SheetOverlay open={open} onClose={onClose} title="Update values">
      <Field label="As-of date">
        <DateField value={snapshotDate} onChange={onDateChange} disabled={busy} />
      </Field>
      <p className="text-[14px] text-neutral-500">
        Leave a row blank and enable carry forward to reuse the last price.
      </p>
      {holdings.map((holding) => {
        const line = snapshotLines[holding.id] ?? {
          unitPriceInput: "",
          totalValueInput: "",
          skipped: false,
        };
        return (
          <div
            key={holding.id}
            className="rounded-2xl border border-[#ececee] p-4 dark:border-neutral-800"
          >
            <p className="text-[15px] font-semibold">{holding.name}</p>
            <p className="mt-0.5 text-[13px] text-neutral-500">
              {assetClassNames.get(holding.assetClassId)}
            </p>
            {holding.quantity != null ? (
              <Field label={`Unit price · ${holding.quantity} units`}>
                <YenAmountField
                  value={line.unitPriceInput}
                  onChange={(value) =>
                    onLineChange(holding.id, {
                      ...line,
                      unitPriceInput: value,
                      skipped: false,
                    })
                  }
                  disabled={busy || line.skipped}
                />
              </Field>
            ) : (
              <Field label="Total value">
                <YenAmountField
                  value={line.totalValueInput}
                  onChange={(value) =>
                    onLineChange(holding.id, {
                      ...line,
                      totalValueInput: value,
                      skipped: false,
                    })
                  }
                  disabled={busy || line.skipped}
                />
              </Field>
            )}
            <CheckboxField
              checked={line.skipped}
              disabled={busy}
              label="Carry forward last price"
              onChange={(checked) => onLineChange(holding.id, { ...line, skipped: checked })}
            />
          </div>
        );
      })}
      {error ? <ErrorNote message={error} /> : null}
      <PrimaryAction disabled={busy || holdings.length === 0} onClick={onSave}>
        {busy ? "Saving…" : "Save snapshot session"}
      </PrimaryAction>
    </SheetOverlay>
  );
}
