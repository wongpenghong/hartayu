import { formatYen, formatYenCompact } from "@/lib/format-yen";

export type DonutSegment = {
  id: string;
  label: string;
  value: number;
  color: string;
};

function arcPath(
  startAngle: number,
  endAngle: number,
  outerRadius: number,
  innerRadius: number,
): string {
  const startOuter = polarToCartesian(outerRadius, endAngle);
  const endOuter = polarToCartesian(outerRadius, startAngle);
  const startInner = polarToCartesian(innerRadius, startAngle);
  const endInner = polarToCartesian(innerRadius, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

function polarToCartesian(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 50 + radius * Math.cos(radians),
    y: 50 + radius * Math.sin(radians),
  };
}

function segmentOpacity(
  segmentId: string,
  selectedIds: ReadonlySet<string> | undefined,
): number {
  if (selectedIds == null || selectedIds.size === 0) {
    return 1;
  }
  return selectedIds.has(segmentId) ? 1 : 0.25;
}

export function DonutChart({
  segments,
  centerLabel,
  emptyLabel = "No data yet.",
  selectedIds,
  onSegmentClick,
}: {
  segments: DonutSegment[];
  centerLabel: string;
  emptyLabel?: string;
  selectedIds?: ReadonlySet<string>;
  onSegmentClick?: (segmentId: string) => void;
}) {
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  const ringTotal = visibleSegments.reduce((sum, segment) => sum + segment.value, 0);
  const hasSelection = selectedIds != null && selectedIds.size > 0;
  const displayTotal = hasSelection
    ? visibleSegments
        .filter((segment) => selectedIds.has(segment.id))
        .reduce((sum, segment) => sum + segment.value, 0)
    : ringTotal;
  let cursor = 0;
  const interactive = onSegmentClick != null;

  function renderRing() {
    if (ringTotal === 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          className="stroke-[#ececee] dark:stroke-neutral-700"
          stroke="currentColor"
          strokeWidth="14"
        />
      );
    }

    if (visibleSegments.length === 1) {
      const segment = visibleSegments[0];
      return (
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={segment.color}
          strokeWidth="14"
          opacity={segmentOpacity(segment.id, selectedIds)}
          className={interactive ? "cursor-pointer" : undefined}
          onClick={interactive ? () => onSegmentClick(segment.id) : undefined}
        />
      );
    }

    return visibleSegments.map((segment) => {
      const sweep = Math.min((segment.value / ringTotal) * 360, 359.999);
      const path = arcPath(cursor, cursor + sweep, 42, 28);
      cursor += sweep;
      return (
        <path
          key={segment.id}
          d={path}
          fill={segment.color}
          stroke="currentColor"
          className={`text-white dark:text-neutral-900${interactive ? " cursor-pointer" : ""}`}
          strokeWidth="0.6"
          opacity={segmentOpacity(segment.id, selectedIds)}
          onClick={interactive ? () => onSegmentClick(segment.id) : undefined}
        />
      );
    });
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          {renderRing()}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[18px] font-bold tabular-nums">
            {formatYenCompact(displayTotal)}
          </p>
          <p className="text-[11px] text-neutral-500">{centerLabel}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {visibleSegments.length === 0 ? (
          <p className="text-[14px] text-neutral-500">{emptyLabel}</p>
        ) : (
          visibleSegments.map((segment) => (
            <button
              key={segment.id}
              type="button"
              disabled={!interactive}
              onClick={interactive ? () => onSegmentClick(segment.id) : undefined}
              className={`flex w-full items-center gap-2 text-left${
                interactive ? " cursor-pointer active:opacity-70" : ""
              }`}
              style={{ opacity: segmentOpacity(segment.id, selectedIds) }}
            >
              <span
                className="h-3 w-3 shrink-0 rounded-[3px]"
                style={{ backgroundColor: segment.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {segment.label}
              </span>
              <span className="text-[14px] font-semibold tabular-nums text-neutral-700 dark:text-neutral-300">
                {formatYen(segment.value)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
