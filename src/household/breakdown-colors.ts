export const BREAKDOWN_COLORS = [
  "#ff9500",
  "#34c759",
  "#af52de",
  "#007aff",
  "#ff3b30",
  "#5856d6",
  "#ff2d55",
  "#64d2ff",
] as const;

export function breakdownColor(index: number): string {
  return BREAKDOWN_COLORS[index % BREAKDOWN_COLORS.length];
}
