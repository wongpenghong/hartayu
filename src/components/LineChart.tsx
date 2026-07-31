import { formatYenCompact } from "@/lib/format-yen";

export type LineChartPoint = {
  label: string;
  value: number;
};

export function LineChart({
  points,
  emptyLabel = "No snapshots yet.",
}: {
  points: LineChartPoint[];
  emptyLabel?: string;
}) {
  if (points.length === 0) {
    return <p className="text-[14px] text-neutral-500">{emptyLabel}</p>;
  }

  const width = 320;
  const height = 140;
  const padding = { top: 12, right: 8, bottom: 28, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const minValue = Math.min(...points.map((point) => point.value), 0);
  const range = Math.max(maxValue - minValue, 1);

  const coordinates = points.map((point, index) => {
    const x =
      padding.left +
      (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
    const y =
      padding.top + plotHeight - ((point.value - minValue) / range) * plotHeight;
    return { ...point, x, y };
  });

  const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-36 w-full">
        <polyline
          fill="none"
          stroke="#007aff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polyline}
        />
        {coordinates.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3.5" fill="#007aff" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between gap-2">
        {coordinates.map((point) => (
          <div key={point.label} className="min-w-0 flex-1 text-center">
            <p className="truncate text-[11px] text-neutral-500">{point.label}</p>
            <p className="text-[12px] font-semibold tabular-nums">
              {formatYenCompact(point.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
