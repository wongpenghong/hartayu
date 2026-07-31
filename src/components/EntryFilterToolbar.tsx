import { useMemo, useState } from "react";
import type { Category } from "@/household/categories";
import type { Pocket } from "@/household/pockets";
import { activePockets } from "@/household/pocket-utils";
import {
  ALL_MEMBERS_FILTER_ID,
  memberFilterOptions,
} from "@/household/attribution";
import type { HouseholdMember } from "@/household/members";
import {
  formatDateRangeLabel,
  isCustomDateRange,
} from "@/household/entry-filter";
import {
  DateField,
  Field,
  MonthField,
  PillTabs,
  SelectField,
  SheetOverlay,
} from "@/components/NativeUI";
import type { EntryFilter } from "@/ledger/types";

export function EntryFilterToolbar({
  pockets,
  categories,
  members,
  userId,
  filter,
  onChange,
  onReset,
}: {
  pockets: Pocket[];
  categories: Category[];
  members: HouseholdMember[];
  userId: string;
  filter: EntryFilter;
  onChange: (filter: EntryFilter) => void;
  onReset: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const memberOptions = useMemo(
    () => memberFilterOptions(members, userId),
    [members, userId],
  );
  const memberValue = filter.memberSegmentId ?? ALL_MEMBERS_FILTER_ID;
  const usingRange = isCustomDateRange(filter);
  const monthValue =
    filter.year != null && filter.month != null
      ? `${filter.year}-${String(filter.month).padStart(2, "0")}`
      : "";
  const overflowActive =
    filter.pocketId != null ||
    filter.categoryId != null ||
    usingRange;

  function setMemberSegment(value: string) {
    onChange({
      ...filter,
      memberSegmentId:
        value === ALL_MEMBERS_FILTER_ID ? undefined : value,
    });
  }

  function setMonth(value: string) {
    if (!value) {
      onChange({ ...filter, year: undefined, month: undefined });
      return;
    }

    const [year, month] = value.split("-").map(Number);
    onChange({
      ...filter,
      year,
      month,
      startDate: undefined,
      endDate: undefined,
    });
  }

  function setDateRange(startDate: string, endDate: string) {
    onChange({
      ...filter,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      year: undefined,
      month: undefined,
    });
  }

  function clearDateRange() {
    onChange({
      ...filter,
      startDate: undefined,
      endDate: undefined,
    });
  }

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 space-y-3 bg-[#f2f2f7]/95 px-4 pb-3 pt-1 backdrop-blur dark:bg-neutral-950/95">
        <div className="flex items-center gap-2">
          {usingRange ? (
            <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
              {formatDateRangeLabel(filter.startDate!, filter.endDate!)}
            </p>
          ) : (
            <div className="min-w-0 flex-1">
              <MonthField value={monthValue} onChange={setMonth} />
            </div>
          )}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={`shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold ${
              overflowActive
                ? "bg-[#007aff] text-white"
                : "bg-[#e3e3e8] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            }`}
          >
            Filters{overflowActive ? " ·" : ""}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-[13px] font-medium text-[#007aff]"
          >
            Reset
          </button>
        </div>

        <PillTabs
          value={memberValue}
          onChange={setMemberSegment}
          options={memberOptions}
        />
      </div>

      <SheetOverlay
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filters"
      >
        <Field label="Pocket">
          <SelectField
            value={filter.pocketId ?? ""}
            onChange={(value) =>
              onChange({ ...filter, pocketId: value || undefined })
            }
          >
            <option value="">All pockets</option>
            {activePockets(pockets).map((pocket) => (
              <option key={pocket.id} value={pocket.id}>
                {pocket.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="Category">
          <SelectField
            value={filter.categoryId ?? ""}
            onChange={(value) =>
              onChange({ ...filter, categoryId: value || undefined })
            }
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
        </Field>
        <Field label="From">
          <DateField
            value={filter.startDate ?? ""}
            onChange={(value) =>
              setDateRange(value, filter.endDate ?? value)
            }
          />
        </Field>
        <Field label="To">
          <DateField
            value={filter.endDate ?? ""}
            onChange={(value) =>
              setDateRange(filter.startDate ?? value, value)
            }
          />
        </Field>
        {usingRange ? (
          <button
            type="button"
            onClick={clearDateRange}
            className="text-[15px] font-medium text-[#007aff]"
          >
            Use month instead
          </button>
        ) : null}
      </SheetOverlay>
    </>
  );
}
