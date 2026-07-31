import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

const hubs = [
  {
    label: "Analysis",
    path: "/analysis",
    iconClass: "bg-[#007aff]",
    icon: (
      <>
        <path d="M5 18V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M10 18V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M15 18V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M20 18V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Budget",
    path: "/budget",
    iconClass: "bg-[#ff9500]",
    icon: (
      <>
        <path
          d="M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 9V7a3 3 0 0 1 6 0v2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    label: "Goals",
    path: "/goals",
    iconClass: "bg-[#34c759]",
    icon: (
      <>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 8v4l2.5 2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: "Portfolio",
    path: "/portfolio",
    iconClass: "bg-[#5856d6]",
    icon: (
      <>
        <path
          d="M4 18V8l8-4 8 4v10"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 18V11h6v7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </>
    ),
  },
] as const;

export default function MorePage() {
  const navigate = useNavigate();

  return (
    <main className="flex flex-1 flex-col px-4 pb-28 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="grid grid-cols-3 gap-x-2 gap-y-6 sm:grid-cols-4">
        {hubs.map((hub) => (
          <HubAppTile
            key={hub.path}
            label={hub.label}
            iconClass={hub.iconClass}
            onClick={() => navigate(hub.path)}
          >
            {hub.icon}
          </HubAppTile>
        ))}
      </div>
    </main>
  );
}

function HubAppTile({
  label,
  iconClass,
  onClick,
  children,
}: {
  label: string;
  iconClass: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-2xl px-1 py-1 transition active:scale-[0.92] active:opacity-80"
    >
      <span
        className={`flex h-[60px] w-[60px] items-center justify-center rounded-[16px] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition group-active:shadow-[0_2px_6px_rgba(0,0,0,0.12)] ${iconClass}`}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          {children}
        </svg>
      </span>
      <span className="max-w-[88px] text-center text-[12px] font-medium leading-tight text-neutral-900 dark:text-neutral-100">
        {label}
      </span>
    </button>
  );
}
