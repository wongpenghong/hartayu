import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#f2f2f7] px-4 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Hartayu
        </p>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">{title}</h1>
        <p className="mt-1 text-[15px] text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
      </header>
      <main className="flex flex-1 flex-col justify-center py-8">
        <div className="rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-neutral-900 dark:shadow-none">
          {children}
        </div>
      </main>
      <footer className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        {footer}
      </footer>
    </div>
  );
}
