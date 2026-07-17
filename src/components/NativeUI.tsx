import type { ReactNode } from "react";

export function NativeScaffold({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-[#f2f2f7] text-neutral-900">
      {children}
    </div>
  );
}

export function PillTabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className="rounded-[10px] bg-[#e3e3e8] p-[3px]">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[8px] py-2 text-[13px] font-semibold transition ${
              value === option.value
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function GroupCard({
  title,
  footer,
  children,
}: {
  title?: string;
  footer?: string;
  children: ReactNode;
}) {
  return (
    <section>
      {title ? (
        <h2 className="mb-2 px-4 text-[13px] font-normal uppercase tracking-wide text-neutral-500">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {children}
      </div>
      {footer ? (
        <p className="mt-2 px-4 text-[13px] leading-relaxed text-neutral-500">
          {footer}
        </p>
      ) : null}
    </section>
  );
}

export function ListRow({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  const className =
    "flex w-full items-center gap-3 border-b border-[#ececee] px-4 py-3.5 text-left last:border-b-0";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${className} active:bg-neutral-50`}>
        {children}
      </button>
    );
  }

  return <div className={className}>{children}</div>;
}

export function SheetOverlay({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ececee] px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="text-[15px] font-medium text-[#007aff]"
          >
            Cancel
          </button>
          <p className="text-[15px] font-semibold">{title}</p>
          <span className="w-14" />
        </div>
        <div className="space-y-4 p-4">{children}</div>
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-[13px] font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  disabled,
  className = "text-[17px]",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      className={`w-full rounded-xl bg-[#f2f2f7] px-3 py-3 outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50 ${className}`}
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export function YenAmountField({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[28px] font-semibold tabular-nums outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50"
      inputMode="numeric"
      autoComplete="off"
      placeholder="¥0"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
}

export function IdrAmountField({
  value,
  onChange,
  onBlur,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[17px] font-medium tabular-nums outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50"
      inputMode="numeric"
      autoComplete="off"
      placeholder="Rp0 (optional)"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
}

export function DateField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[17px] outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50"
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  );
}

export function MonthField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <input
      className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[17px] outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50"
      type="month"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  );
}

export function SelectField({
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
      className="w-full rounded-xl bg-[#f2f2f7] px-3 py-3 text-[17px] outline-none ring-[#007aff] focus:ring-2 disabled:opacity-50"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    >
      {children}
    </select>
  );
}

export function PrimaryAction({
  children,
  disabled,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  variant?: "primary" | "destructive" | "secondary";
}) {
  const styles = {
    primary: "bg-[#007aff] text-white",
    destructive: "bg-[#ff3b30] text-white",
    secondary: "bg-[#f2f2f7] text-neutral-900",
  }[variant];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl px-4 py-3.5 text-[17px] font-semibold disabled:opacity-50 ${styles}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  size = "md",
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: "md" | "lg";
}) {
  const sizeClass =
    size === "lg"
      ? "h-14 w-14 -mt-7 text-3xl shadow-lg"
      : "h-11 w-11 text-2xl shadow-md";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center rounded-full bg-[#007aff] leading-none text-white disabled:bg-neutral-300 ${sizeClass}`}
    >
      +
    </button>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <p className="rounded-xl bg-[#ffebee] px-3 py-2 text-[14px] text-[#c62828]">
      {message}
    </p>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="px-4 py-8 text-center text-[15px] text-neutral-500">
      {message}
    </p>
  );
}

export function PocketIcon({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || "P";
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007aff]/10 text-[15px] font-semibold text-[#007aff]">
      {initial}
    </span>
  );
}

export function CategoryIcon({ kind }: { kind: "expense" | "income" }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] ${
        kind === "expense"
          ? "bg-[#ff9500]/12 text-[#ff9500]"
          : "bg-[#34c759]/12 text-[#34c759]"
      }`}
    >
      {kind === "expense" ? "↓" : "↑"}
    </span>
  );
}

export function MemberChip({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[#f2f2f7] px-2 py-0.5 text-[12px] font-medium text-neutral-500">
      {label}
    </span>
  );
}

export function LimitProgressBar({
  spentYen,
  limitYen,
}: {
  spentYen: number;
  limitYen: number;
}) {
  const ratio = limitYen > 0 ? Math.min(spentYen / limitYen, 1) : 0;

  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-[#e8f5c4]">
      <div
        className="h-full rounded-full bg-neutral-900 transition-all"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}
