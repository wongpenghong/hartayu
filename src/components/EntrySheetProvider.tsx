import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { EntrySheet } from "@/components/EntrySheet";
import type { Category } from "@/household/categories";
import type { EntryDraftPrefill } from "@/household/entry-form";
import type { HouseholdMember } from "@/household/members";
import type { Pocket } from "@/household/pockets";
import type { Entry } from "@/ledger/types";

type OpenAddEntryOptions = {
  draft?: EntryDraftPrefill;
  billId?: string;
};

type EntrySheetContextValue = {
  openAddEntry: () => void;
  openAddEntryWithDraft: (draft: EntryDraftPrefill, options?: OpenAddEntryOptions) => void;
  openEditEntry: (entry: Entry) => void;
  notifyEntryChanged: () => void;
  registerEntryChangeListener: (listener: () => void) => () => void;
};

const EntrySheetContext = createContext<EntrySheetContextValue | null>(null);

export function EntrySheetProvider({
  householdId,
  userId,
  members,
  pockets,
  categories,
  entries,
  onEntriesChanged,
  children,
}: {
  householdId: string;
  userId: string;
  members: HouseholdMember[];
  pockets: Pocket[];
  categories: Category[];
  entries: Entry[];
  onEntriesChanged?: () => void | Promise<void>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [draft, setDraft] = useState<EntryDraftPrefill | null>(null);
  const [billId, setBillId] = useState<string | null>(null);
  const [listeners, setListeners] = useState<Set<() => void>>(() => new Set());

  const notifyEntryChanged = useCallback(() => {
    listeners.forEach((listener) => listener());
    void onEntriesChanged?.();
  }, [listeners, onEntriesChanged]);

  const registerEntryChangeListener = useCallback((listener: () => void) => {
    setListeners((current) => new Set(current).add(listener));
    return () => {
      setListeners((current) => {
        const next = new Set(current);
        next.delete(listener);
        return next;
      });
    };
  }, []);

  const openAddEntry = useCallback(() => {
    setEntry(null);
    setDraft(null);
    setBillId(null);
    setOpen(true);
  }, []);

  const openAddEntryWithDraft = useCallback(
    (nextDraft: EntryDraftPrefill, options?: OpenAddEntryOptions) => {
      setEntry(null);
      setDraft(nextDraft);
      setBillId(options?.billId ?? null);
      setOpen(true);
    },
    [],
  );

  const openEditEntry = useCallback((nextEntry: Entry) => {
    setEntry(nextEntry);
    setDraft(null);
    setBillId(null);
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setEntry(null);
    setDraft(null);
    setBillId(null);
  }, []);

  const value = useMemo(
    () => ({
      openAddEntry,
      openAddEntryWithDraft,
      openEditEntry,
      notifyEntryChanged,
      registerEntryChangeListener,
    }),
    [
      notifyEntryChanged,
      openAddEntry,
      openAddEntryWithDraft,
      openEditEntry,
      registerEntryChangeListener,
    ],
  );

  return (
    <EntrySheetContext.Provider value={value}>
      {children}
      <EntrySheet
        open={open}
        onClose={closeSheet}
        onSaved={() => notifyEntryChanged()}
        onDeleted={() => notifyEntryChanged()}
        householdId={householdId}
        userId={userId}
        members={members}
        entry={entry}
        draft={draft}
        billId={billId}
        pockets={pockets}
        categories={categories}
        entries={entries}
      />
    </EntrySheetContext.Provider>
  );
}

export function useEntrySheet(): EntrySheetContextValue {
  const context = useContext(EntrySheetContext);
  if (!context) {
    throw new Error("useEntrySheet must be used within EntrySheetProvider");
  }
  return context;
}
