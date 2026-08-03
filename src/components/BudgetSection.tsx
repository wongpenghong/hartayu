import type { ReactNode } from "react";
import { budgetGroupTone } from "@/household/budget-colors";
import type { BudgetGroup } from "@/household/budget-groups";

export function BudgetSection({
  group,
  title,
  children,
}: {
  group: BudgetGroup | "other";
  title: string;
  children: ReactNode;
}) {
  const tone = budgetGroupTone(group);

  return (
    <section
      className={`rounded-3xl border-l-4 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${tone.section} ${tone.sectionBorder}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
        <h2
          className={`text-[13px] font-semibold uppercase tracking-wide ${tone.accent}`}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
