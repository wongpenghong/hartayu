import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useEntrySheet } from "@/components/EntrySheetProvider";
import { IconButton } from "@/components/NativeUI";

export function BottomTabBar({ disabled }: { disabled?: boolean }) {
  const location = useLocation();
  const { openAddEntry } = useEntrySheet();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto grid w-full grid-cols-4 items-end rounded-[28px] bg-white px-2 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <NavTab
          to="/"
          label="Home"
          active={location.pathname === "/"}
          icon={<HomeIcon active={location.pathname === "/"} />}
        />
        <NavTab
          to="/entries"
          label="Entries"
          active={location.pathname === "/entries"}
          icon={<EntriesIcon active={location.pathname === "/entries"} />}
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
      className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-1.5 ${
        active ? "bg-[#ececee]" : ""
      }`}
    >
      {icon}
      <span
        className={`text-[11px] font-medium ${
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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EntriesIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 18V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 18V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M15 18V13" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 18V8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const color = active ? "#007aff" : "#111827";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
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
