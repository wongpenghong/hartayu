import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  formatAuthError,
  memberEmail,
  usernameFromEmail,
} from "@/auth/member-auth";
import { fetchHousehold, fetchStarterCategories } from "@/household/household";
import { getSupabase } from "@/lib/supabase";

type HouseholdSummary = {
  id: string;
  name: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  username: string | null;
  household: HouseholdSummary | null;
  starterCategoryCount: number;
  loading: boolean;
  authError: string | null;
  signIn: (username: string, pin: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadMemberContext(): Promise<{
  household: HouseholdSummary | null;
  starterCategoryCount: number;
}> {
  const household = await fetchHousehold();
  if (!household) {
    return { household: null, starterCategoryCount: 0 };
  }

  const categories = await fetchStarterCategories();
  return { household, starterCategoryCount: categories.length };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<HouseholdSummary | null>(null);
  const [starterCategoryCount, setStarterCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshMemberContext = useCallback(async () => {
    try {
      const context = await loadMemberContext();
      setHousehold(context.household);
      setStarterCategoryCount(context.starterCategoryCount);
      if (!context.household) {
        setAuthError(
          "No household linked to this member. Run npm run seed:household -- <owner> <member> --fresh",
        );
      }
    } catch (error) {
      setAuthError(formatAuthError(error));
      setHousehold(null);
      setStarterCategoryCount(0);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!active) {
        return;
      }

      setSession(data.session);

      if (data.session) {
        await refreshMemberContext();
      }

      if (active) {
        setLoading(false);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      setAuthError(null);

      if (nextSession) {
        setLoading(true);
        await refreshMemberContext();
        setLoading(false);
      } else {
        setHousehold(null);
        setStarterCategoryCount(0);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshMemberContext, supabase.auth]);

  const signIn = useCallback(
    async (username: string, pin: string) => {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({
        email: memberEmail(username),
        password: pin,
      });
      if (error) {
        throw error;
      }
    },
    [supabase.auth],
  );

  const signOut = useCallback(async () => {
    setAuthError(null);
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }, [supabase.auth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      username: usernameFromEmail(session?.user?.email),
      household,
      starterCategoryCount,
      loading,
      authError,
      signIn,
      signOut,
      clearAuthError: () => setAuthError(null),
    }),
    [
      authError,
      household,
      loading,
      session,
      signIn,
      signOut,
      starterCategoryCount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
