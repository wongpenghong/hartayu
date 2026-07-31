import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";
import { GroupCard, ListRow } from "@/components/NativeUI";

export default function MorePage() {
  const navigate = useNavigate();

  return (
    <>
      <header className="px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">More</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">
        <GroupCard>
          <ListRow onClick={() => navigate("/analysis")}>
            <HubIcon>
              <path d="M5 18V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M10 18V10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M15 18V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M20 18V8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </HubIcon>
            <span className="min-w-0 flex-1 text-[17px] font-medium">Analysis</span>
            <span className="text-[20px] text-neutral-300">›</span>
          </ListRow>
          <ListRow onClick={() => navigate("/limits")}>
            <HubIcon>
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
            </HubIcon>
            <span className="min-w-0 flex-1 text-[17px] font-medium">Payment limits</span>
            <span className="text-[20px] text-neutral-300">›</span>
          </ListRow>
          <ListRow onClick={() => navigate("/portfolio")}>
            <HubIcon>
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
            </HubIcon>
            <span className="min-w-0 flex-1 text-[17px] font-medium">Portfolio</span>
            <span className="text-[20px] text-neutral-300">›</span>
          </ListRow>
        </GroupCard>
      </main>
    </>
  );
}

function HubIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#007aff]/10 text-[#007aff]">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        {children}
      </svg>
    </span>
  );
}
