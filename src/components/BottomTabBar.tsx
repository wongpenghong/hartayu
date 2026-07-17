import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { IconButton } from "@/components/NativeUI";

export function BottomTabBar({ disabled }: { disabled?: boolean }) {
  const location = useLocation();
  const { openAddEntry } = useEntrySheet();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto grid w-full grid-cols-6 items-end rounded-[28px] bg-white px-1 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <NavTab
          to="/"
          label="Home"
          active={location.pathname === "/"}
          icon={<HomeIcon active={location.pathname === "/"} />}
        />
        <NavTab
          to="/analysis"
          label="Analysis"
          active={location.pathname === "/analysis"}
          icon={<AnalysisIcon active={location.pathname === "/analysis"} />}
        />
        <div className="flex justify-center">
          <IconButton
            label="Add entry"
            size="lg"
            disabled={disabled}
            onClick={openAddEntry}
          />
        </div>
        <NavTab
          to="/entries"
          label="Transactions"
          active={location.pathname === "/entries"}
          icon={<TransactionsIcon active={location.pathname === "/entries"} />}
        />
        <NavTab
          to="/limits"
          label="Limits"
          active={location.pathname === "/limits"}
          icon={<LimitsIcon active={location.pathname === "/limits"} />}
        />
        <NavTab
          to="/settings"
          label="Settings"
          active={location.pathname === "/settings"}
          icon={<SettingsIcon active={location.pathname === "/settings"} />}
        />
      </div>
    </nav>
  );
}

function NavTab({
  to,
  label,
  active,
  icon,
}: {
  to: string;
  label: string;
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 ${
        active ? "bg-[#ececee]" : ""
      }`}
    >
      {icon}
      <span
        className={`text-[10px] font-medium leading-tight ${
          active ? "text-[#007aff]" : "text-neutral-900"
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalysisIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 18V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 18V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 18V13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 18V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TransactionsIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 8h10M7 12h10M7 16h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="4"
        y="5"
        width="16"
        height="14"
        rx="2.5"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}

function LimitsIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9 9V7a3 3 0 0 1 6 0v2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="3.2" stroke={color} strokeWidth="1.8" />
      <path
        d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
