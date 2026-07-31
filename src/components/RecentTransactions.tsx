import { Link } from "react-router-dom";
import { EntryList } from "@/components/EntryList";
import { EmptyState, GroupCard } from "@/components/NativeUI";
import type { HouseholdMember } from "@/household/members";
import type { Entry } from "@/ledger/types";

export function RecentTransactions({
  entries,
  members,
  categoryNameById,
  categoryEmojiById,
  pocketNameById,
  currentUserId,
  onEditEntry,
  loading,
}: {
  entries: Entry[];
  members: HouseholdMember[];
  categoryNameById: Map<string, string>;
  categoryEmojiById: Map<string, string | null>;
  pocketNameById: Map<string, string>;
  currentUserId?: string;
  onEditEntry?: (entry: Entry) => void;
  loading?: boolean;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-4">
        <h2 className="text-[17px] font-semibold">Recent transactions</h2>
        <Link to="/entries" className="text-[15px] font-medium text-[#007aff]">
          See all ›
        </Link>
      </div>
      <GroupCard>
        {loading ? (
          <EmptyState message="Loading transactions…" />
        ) : entries.length === 0 ? (
          <EmptyState message="No entries yet. Tap + to log one." />
        ) : (
          <EntryList
            entries={entries}
            members={members}
            categoryNameById={categoryNameById}
            categoryEmojiById={categoryEmojiById}
            pocketNameById={pocketNameById}
            currentUserId={currentUserId}
            onEditEntry={onEditEntry}
          />
        )}
      </GroupCard>
    </section>
  );
}
