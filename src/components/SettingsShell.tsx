import type { ReactNode } from "react";
import { PillTabs } from "@/components/NativeUI";

export type SettingsTab = "pockets" | "categories" | "asset-classes" | "bills";

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
    <>
      <header className="px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
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
              { value: "bills", label: "Bills" },
              { value: "asset-classes", label: "Assets" },
            ]}
          />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 pb-28">{children}</main>
    </>
  );
}
