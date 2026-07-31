import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthProvider";
import { BottomTabBar } from "@/components/BottomTabBar";
import { EntrySheetProvider } from "@/components/EntrySheetProvider";
import { ErrorNote, NativeScaffold } from "@/components/NativeUI";
import { fetchCategories, type Category } from "@/household/categories";
import { fetchEntries } from "@/household/entries";
import { fetchPockets, type Pocket } from "@/household/pockets";
import type { Entry } from "@/ledger/types";

export default function MainLayout() {
  const { user, household, authError } = useAuth();
  const [pockets, setPockets] = useState<Pocket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadSharedData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [nextPockets, nextCategories, nextEntries] = await Promise.all([
        fetchPockets(),
        fetchCategories(),
        fetchEntries(),
      ]);
      setPockets(nextPockets);
      setCategories(nextCategories);
      setEntries(nextEntries);
    } catch (caught) {
      setLoadError(
        caught instanceof Error ? caught.message : "Failed to load app data",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const reloadEntries = useCallback(async () => {
    try {
      setEntries(await fetchEntries());
    } catch {
      // Keep existing entries if refresh fails.
    }
  }, []);

  useEffect(() => {
    void loadSharedData();
  }, [loadSharedData]);

  if (!household || !user) {
    return null;
  }

  return (
    <EntrySheetProvider
      householdId={household.id}
      userId={user.id}
      pockets={pockets}
      categories={categories}
      entries={entries}
      onEntriesChanged={reloadEntries}
    >
      <NativeScaffold>
        {authError ? (
          <div className="px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <ErrorNote message={authError} />
          </div>
        ) : null}
        {loadError ? (
          <div className="px-4 pt-2">
            <ErrorNote message={loadError} />
          </div>
        ) : null}
        <Outlet context={{ loading, reloadSharedData: loadSharedData }} />
        <BottomTabBar disabled={loading} />
      </NativeScaffold>
    </EntrySheetProvider>
  );
}

export type MainLayoutContext = {
  loading: boolean;
  reloadSharedData: () => Promise<void>;
};
