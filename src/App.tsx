export default function App() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-slate-400">Household finance</p>
        <h1 className="text-2xl font-semibold tracking-tight">Hartayu</h1>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        <p className="text-base text-slate-300">
          Shared ledger for expenses and income in JPY.
        </p>
        <p className="mt-2 text-sm text-slate-500">Sign in coming in ticket #3.</p>
      </main>
    </div>
  );
}
