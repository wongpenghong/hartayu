import { useAuth } from "@/auth/AuthProvider";

export default function HomePage() {
  const { household, starterCategoryCount, authError, signOut } = useAuth();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-400">Household finance</p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {household?.name ?? "Hartayu"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {authError ? (
          <p className="rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
            {authError}
          </p>
        ) : null}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-400">Household ready</p>
          <p className="mt-1 text-base text-slate-200">
            Starter categories loaded: {starterCategoryCount}
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Accounts and entries arrive in tickets #5 and #6.
          </p>
        </section>
      </main>
    </div>
  );
}
