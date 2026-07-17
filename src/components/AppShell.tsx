import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  backTo,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex items-start justify-between gap-4">
          <div>
            {backTo ? (
              <Link
                to={backTo}
                className="mb-2 inline-block text-sm text-sky-400"
              >
                Back
              </Link>
            ) : null}
            <p className="text-sm font-medium text-slate-400">Hartayu</p>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          {actions}
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-6 px-4 py-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-slate-300">{label}</span>
      {children}
    </label>
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-base outline-none ring-sky-500 focus:ring-2 disabled:opacity-60"
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-base outline-none ring-sky-500 focus:ring-2 disabled:opacity-60"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  );
}

export function PrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-300 disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-rose-900 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
      {message}
    </p>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      {children}
    </div>
  );
}
