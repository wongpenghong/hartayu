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

export function DonutChart({
  segments,
  centerLabel,
  emptyLabel = "No data yet.",
}: {
  segments: DonutSegment[];
  centerLabel: string;
  emptyLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const visibleSegments = segments.filter((segment) => segment.value > 0);
  let cursor = 0;

  function renderRing() {
    if (total === 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="#ececee"
          strokeWidth="14"
        />
      );
    }

    if (visibleSegments.length === 1) {
      return (
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={visibleSegments[0].color}
          strokeWidth="14"
        />
      );
    }

    return visibleSegments.map((segment) => {
      const sweep = Math.min((segment.value / total) * 360, 359.999);
      const path = arcPath(cursor, cursor + sweep, 42, 28);
      cursor += sweep;
      return (
        <path
          key={segment.id}
          d={path}
          fill={segment.color}
          stroke="#ffffff"
          strokeWidth="0.6"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[18px] font-bold tabular-nums">
            {formatYenCompact(total)}
          </p>
          <p className="text-[11px] text-neutral-500">{centerLabel}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        {visibleSegments.length === 0 ? (
          <p className="text-[14px] text-neutral-500">{emptyLabel}</p>
        ) : (
          visibleSegments.map((segment) => (
            <div key={segment.id} className="flex items-center gap-2">
              <span
                className="h-3 w-3 shrink-0 rounded-[3px]"
                style={{ backgroundColor: segment.color }}
              />
              <span className="min-w-0 flex-1 truncate text-[14px] font-medium">
                {segment.label}
              </span>
              <span className="text-[14px] font-semibold tabular-nums text-neutral-700">
                {formatYen(segment.value)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
