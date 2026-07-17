import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { NativeScaffold, PillTabs } from "@/components/NativeUI";

export type SettingsTab = "pockets" | "categories";

export function SettingsShell({
  activeTab,
  onTabChange,
  children,
}: {
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
  children: ReactNode;
}) {
  return (
    <NativeScaffold>
      <header className="sticky top-0 z-10 bg-[#f2f2f7]/90 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-[15px] font-medium text-[#007aff]"
          >
            <span aria-hidden>‹</span> Home
          </Link>
        </div>
        <h1 className="text-[34px] font-bold leading-tight tracking-tight">
          Settings
        </h1>
        <div className="mt-4">
          <PillTabs
            value={activeTab}
            onChange={onTabChange}
            options={[
              { value: "pockets", label: "Pockets" },
              { value: "categories", label: "Categories" },
            ]}
          />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">{children}</main>
    </NativeScaffold>
  );
}
