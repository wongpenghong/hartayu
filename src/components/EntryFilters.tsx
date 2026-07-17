import type { Category } from "@/household/categories";
import type { Pocket } from "@/household/pockets";
import { activePockets } from "@/household/pocket-utils";
import { Field, GroupCard, MonthField, SelectField } from "@/components/NativeUI";
import type { EntryFilter } from "@/ledger/types";

export function EntryFilters({
  pockets,
  categories,
  filter,
  onChange,
}: {
  pockets: Pocket[];
  categories: Category[];
  filter: EntryFilter;
  onChange: (filter: EntryFilter) => void;
}) {
  const monthValue =
    filter.year != null && filter.month != null
      ? `${filter.year}-${String(filter.month).padStart(2, "0")}`
      : "";

  return (
    <GroupCard title="Filters">
      <div className="space-y-4 p-4">
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
        <Field label="Month">
          <MonthField
            value={monthValue}
            onChange={(value) => {
              if (!value) {
                onChange({ ...filter, year: undefined, month: undefined });
                return;
              }

              const [year, month] = value.split("-").map(Number);
              onChange({ ...filter, year, month });
            }}
          />
        </Field>
      </div>
    </GroupCard>
  );
}
