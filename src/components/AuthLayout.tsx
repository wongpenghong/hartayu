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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-950 px-4 text-slate-50">
      <header className="border-b border-slate-800 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium text-slate-400">Hartayu</p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </header>
      <main className="flex flex-1 flex-col justify-center py-8">{children}</main>
      <footer className="pb-[max(1rem,env(safe-area-inset-bottom))] text-center">
        {footer}
      </footer>
    </div>
  );
}

export function AuthField({
  label,
  type,
  autoComplete,
  inputMode,
  pattern,
  maxLength,
  value,
  onChange,
  required,
  minLength,
}: {
  label: string;
  type: string;
  autoComplete?: string;
  inputMode?: "numeric" | "text";
  pattern?: string;
  maxLength?: number;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-base outline-none ring-sky-500 focus:ring-2"
        type={type}
        autoComplete={autoComplete}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
      />
    </label>
  );
}
