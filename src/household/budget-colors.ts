import type { BudgetGroup } from "@/household/budget-groups";

export type BudgetTone = {
  section: string;
  sectionBorder: string;
  card: string;
  accent: string;
  muted: string;
  dot: string;
  track: string;
  fill: string;
  overTrack: string;
  overFill: string;
  overText: string;
};

export const BUDGET_GROUP_TONES: Record<BudgetGroup | "other", BudgetTone> = {
  needs: {
    section: "bg-[#f4f1fb] dark:bg-[#2a2538]",
    sectionBorder: "border-l-[#9b87d9]",
    card: "bg-white/95 dark:bg-white/10",
    accent: "text-[#5c4d82] dark:text-[#d5c9f0]",
    muted: "text-[#8a7fad] dark:text-[#a89bc4]",
    dot: "bg-[#9b87d9]",
    track: "bg-[#e8e0f5] dark:bg-[#3d3555]",
    fill: "bg-[#9b87d9]",
    overTrack: "bg-[#f8e8ea] dark:bg-[#3d2a2e]",
    overFill: "bg-[#e895a8]",
    overText: "text-[#c76b7a] dark:text-[#f0b4bf]",
  },
  wants: {
    section: "bg-[#fff5eb] dark:bg-[#2f261f]",
    sectionBorder: "border-l-[#f0a868]",
    card: "bg-white/95 dark:bg-white/10",
    accent: "text-[#9a6535] dark:text-[#f0c99a]",
    muted: "text-[#b8895a] dark:text-[#c9a078]",
    dot: "bg-[#f0a868]",
    track: "bg-[#fde8d4] dark:bg-[#4a3828]",
    fill: "bg-[#f0a868]",
    overTrack: "bg-[#f8e8ea] dark:bg-[#3d2a2e]",
    overFill: "bg-[#e895a8]",
    overText: "text-[#c76b7a] dark:text-[#f0b4bf]",
  },
  savings: {
    section: "bg-[#eef6fc] dark:bg-[#1f2a33]",
    sectionBorder: "border-l-[#7eb8da]",
    card: "bg-white/95 dark:bg-white/10",
    accent: "text-[#3d6f8c] dark:text-[#b8d9ef]",
    muted: "text-[#6b94ad] dark:text-[#89adc2]",
    dot: "bg-[#7eb8da]",
    track: "bg-[#dcecf5] dark:bg-[#2a3d4a]",
    fill: "bg-[#7eb8da]",
    overTrack: "bg-[#f8e8ea] dark:bg-[#3d2a2e]",
    overFill: "bg-[#e895a8]",
    overText: "text-[#c76b7a] dark:text-[#f0b4bf]",
  },
  other: {
    section: "bg-[#f2f2f7] dark:bg-neutral-900",
    sectionBorder: "border-l-neutral-400",
    card: "bg-white/95 dark:bg-white/10",
    accent: "text-neutral-700 dark:text-neutral-200",
    muted: "text-neutral-500 dark:text-neutral-400",
    dot: "bg-neutral-400",
    track: "bg-[#e5e5ea] dark:bg-neutral-700",
    fill: "bg-neutral-500 dark:bg-neutral-400",
    overTrack: "bg-[#f8e8ea] dark:bg-[#3d2a2e]",
    overFill: "bg-[#e895a8]",
    overText: "text-[#c76b7a] dark:text-[#f0b4bf]",
  },
};

export function budgetGroupTone(group: BudgetGroup | "other"): BudgetTone {
  return BUDGET_GROUP_TONES[group];
}

export function budgetProgressTone(tone: BudgetTone) {
  return {
    track: tone.track,
    fill: tone.fill,
    overTrack: tone.overTrack,
    overFill: tone.overFill,
  };
}
