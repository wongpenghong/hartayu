import type { Entry } from "@/ledger/types";
import { entryAttributionLabel } from "@/household/attribution";
import type { HouseholdMember } from "@/household/members";
import {
  entryAmountTone,
  formatDayGroupHeader,
  formatEntryDate,
  formatEntryForeignIdr,
  formatSignedEntryYen,
  formatTransferLabel,
} from "@/household/entry-display";
import { groupEntriesByDay } from "@/ledger/ledger";
import { todayInTokyo } from "@/lib/format-yen";
import {
  CategoryIcon,
  ListRow,
  MemberChip,
  TransferIcon,
} from "@/components/NativeUI";

function EntryRow({
  entry,
  members,
  categoryNameById,
  categoryEmojiById,
  pocketNameById,
  currentUserId,
  onEditEntry,
  showDate = true,
}: {
  entry: Entry;
  members: HouseholdMember[];
  categoryNameById: Map<string, string>;
  categoryEmojiById: Map<string, string | null>;
  pocketNameById: Map<string, string>;
  currentUserId?: string;
  onEditEntry?: (entry: Entry) => void;
  showDate?: boolean;
}) {
  const canEdit = entry.memberId === currentUserId;
  const foreignIdr = formatEntryForeignIdr(entry);
  const isTransfer = entry.kind === "transfer";
  const fromName = pocketNameById.get(entry.pocketId) ?? "Pocket";
  const toName =
    entry.toPocketId != null
      ? (pocketNameById.get(entry.toPocketId) ?? "Pocket")
      : "Pocket";

  return (
    <ListRow
      onClick={canEdit && onEditEntry ? () => onEditEntry(entry) : undefined}
    >
      {isTransfer ? (
        <TransferIcon />
      ) : (
        <CategoryIcon
          kind={entry.kind === "income" ? "income" : "expense"}
          emoji={
            entry.categoryId != null
              ? categoryEmojiById.get(entry.categoryId)
              : null
          }
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[17px] font-medium">
          {isTransfer
            ? formatTransferLabel(fromName, toName)
            : (categoryNameById.get(entry.categoryId ?? "") ?? "Category")}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-neutral-500">
          {isTransfer ? "Transfer" : fromName}
          {foreignIdr ? ` · ${foreignIdr}` : ""}
          {entry.note ? ` · ${entry.note}` : ""}
        </span>
        {showDate ? (
          <span className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-neutral-400">
            <span>{formatEntryDate(entry.entryDate)}</span>
            <MemberChip label={entryAttributionLabel(members, entry)} />
          </span>
        ) : (
          <span className="mt-1 block text-[12px] text-neutral-400">
            <MemberChip label={entryAttributionLabel(members, entry)} />
          </span>
        )}
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
}

export function EntryList({
  entries,
  members,
  categoryNameById,
  categoryEmojiById,
  pocketNameById,
  currentUserId,
  onEditEntry,
  groupByDay = false,
}: {
  entries: Entry[];
  members: HouseholdMember[];
  categoryNameById: Map<string, string>;
  categoryEmojiById: Map<string, string | null>;
  pocketNameById: Map<string, string>;
  currentUserId?: string;
  onEditEntry?: (entry: Entry) => void;
  groupByDay?: boolean;
}) {
  const today = todayInTokyo();

  if (groupByDay) {
    return (
      <>
        {groupEntriesByDay(entries).map((group) => (
          <div key={group.date}>
            <p className="border-b border-[#ececee] bg-[#f2f2f7] px-4 py-2 text-[13px] font-semibold text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400">
              {formatDayGroupHeader(group.date, today)}
            </p>
            {group.entries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                members={members}
                categoryNameById={categoryNameById}
                categoryEmojiById={categoryEmojiById}
                pocketNameById={pocketNameById}
                currentUserId={currentUserId}
                onEditEntry={onEditEntry}
                showDate={false}
              />
            ))}
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {entries.map((entry) => (
        <EntryRow
          key={entry.id}
          entry={entry}
          members={members}
          categoryNameById={categoryNameById}
          categoryEmojiById={categoryEmojiById}
          pocketNameById={pocketNameById}
          currentUserId={currentUserId}
          onEditEntry={onEditEntry}
        />
      ))}
    </>
  );
}
