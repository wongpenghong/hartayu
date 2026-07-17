import type { Entry } from "@/ledger/types";
import type { HouseholdMember } from "@/household/members";
import { memberName } from "@/household/member-utils";
import {
  entryAmountTone,
  formatEntryDate,
  formatSignedEntryYen,
} from "@/household/entry-display";
import {
  CategoryIcon,
  ListRow,
  MemberChip,
} from "@/components/NativeUI";

export function EntryList({
  entries,
  members,
  categoryNameById,
  pocketNameById,
  currentUserId,
  onEditEntry,
}: {
  entries: Entry[];
  members: HouseholdMember[];
  categoryNameById: Map<string, string>;
  pocketNameById: Map<string, string>;
  currentUserId?: string;
  onEditEntry?: (entry: Entry) => void;
}) {
  return (
    <>
      {entries.map((entry) => {
        const canEdit = entry.memberId === currentUserId;

        return (
          <ListRow
            key={entry.id}
            onClick={
              canEdit && onEditEntry ? () => onEditEntry(entry) : undefined
            }
          >
            <CategoryIcon kind={entry.kind} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-medium">
                {categoryNameById.get(entry.categoryId) ?? "Category"}
              </span>
              <span className="mt-0.5 block truncate text-[13px] text-neutral-500">
                {pocketNameById.get(entry.pocketId) ?? "Pocket"}
                {entry.note ? ` · ${entry.note}` : ""}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-400">
                <span>{formatEntryDate(entry.entryDate)}</span>
                <MemberChip label={memberName(members, entry.memberId)} />
              </span>
            </span>
            <span
              className={`text-[17px] font-semibold tabular-nums ${entryAmountTone(entry.kind)}`}
            >
              {formatSignedEntryYen(entry)}
            </span>
            {canEdit ? (
              <span className="text-[20px] text-neutral-300">›</span>
            ) : null}
          </ListRow>
        );
      })}
    </>
  );
}
