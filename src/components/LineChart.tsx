import { useEffect, useMemo, useState } from "react";
import { formatYen } from "@/lib/format-yen";

export type LineChartPoint = {
  date: string;
  label: string;
  value: number;
  caption?: string;
};

function formatChartDate(date: string): string {
  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
  const [year, month, day] = date.split("-");
  return `${year}/${month}/${day}(${weekday})`;
}

function yAxisTicks(maxValue: number, minValue: number, count: number): number[] {
  const range = Math.max(maxValue - minValue, 1);
  const step = range / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, index) =>
    Math.round(minValue + step * index),
  );
}

export function LineChart({
  points,
  emptyLabel = "No snapshots yet.",
}: {
  points: LineChartPoint[];
  emptyLabel?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    points.length > 0 ? points.length - 1 : 0,
  );

  useEffect(() => {
    setSelectedIndex(points.length > 0 ? points.length - 1 : 0);
  }, [points]);

  const layout = useMemo(() => {
    const width = 320;
    const height = 220;
    const padding = { top: 16, right: 12, bottom: 32, left: 52 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const minValue = 0;
    const range = Math.max(maxValue - minValue, 1);

    const coordinates = points.map((point, index) => {
      const x =
        padding.left +
        (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
      const y = padding.top + plotHeight - ((point.value - minValue) / range) * plotHeight;
      return { ...point, x, y, index };
    });

    const areaPath =
      coordinates.length <= 1
        ? ""
        : `M ${coordinates[0].x} ${padding.top + plotHeight} ${coordinates
            .map((point) => `L ${point.x} ${point.y}`)
            .join(" ")} L ${coordinates[coordinates.length - 1].x} ${padding.top + plotHeight} Z`;

    const polyline = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
    const yTicks = yAxisTicks(maxValue, minValue, 5);
    const singlePointY = coordinates.length === 1 ? coordinates[0].y : null;

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      coordinates,
      areaPath,
      polyline,
      yTicks,
      minValue,
      range,
      singlePointY,
    };
  }, [points]);

  if (points.length === 0) {
    return <p className="text-[14px] text-neutral-500">{emptyLabel}</p>;
  }

  const selected = points[selectedIndex] ?? points[points.length - 1];
  const selectedCoord = layout.coordinates[selectedIndex] ?? layout.coordinates.at(-1);
  const selectedHeading = selected.caption?.trim()
    ? `${formatChartDate(selected.date)} · ${selected.caption}`
    : formatChartDate(selected.date);

  return (
    <div>
      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full touch-none">
        <defs>
          <linearGradient id="lineChartArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#007aff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#007aff" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {layout.yTicks.map((tick) => {
          const y =
            layout.padding.top +
            layout.plotHeight -
            ((tick - layout.minValue) / layout.range) * layout.plotHeight;
          return (
            <g key={tick}>
              <line
                x1={layout.padding.left}
                x2={layout.width - layout.padding.right}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeOpacity="0.12"
                strokeDasharray="3 4"
                className="text-neutral-500"
              />
              <text
                x={layout.padding.left - 6}
                y={y + 4}
                textAnchor="end"
                className="fill-neutral-500 text-[9px]"
              >
                {tick.toLocaleString("ja-JP")}
              </text>
            </g>
          );
        })}

        {layout.areaPath ? (
          <path d={layout.areaPath} fill="url(#lineChartArea)" stroke="none" />
        ) : null}

        {layout.singlePointY != null ? (
          <>
            <line
              x1={layout.padding.left}
              x2={layout.padding.left + layout.plotWidth}
              y1={layout.singlePointY}
              y2={layout.singlePointY}
              stroke="#007aff"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.35"
            />
            <line
              x1={layout.coordinates[0].x}
              x2={layout.coordinates[0].x}
              y1={layout.padding.top + layout.plotHeight}
              y2={layout.singlePointY}
              stroke="#007aff"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.45"
            />
          </>
        ) : (
          <polyline
            fill="none"
            stroke="#007aff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={layout.polyline}
          />
        )}

        {layout.coordinates.map((point) => {
          const active = point.index === selectedIndex;
          return (
            <g key={`${point.label}-${point.index}`}>
              <circle
                cx={point.x}
                cy={point.y}
                r="16"
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setSelectedIndex(point.index)}
              />
              <circle
                cx={point.x}
                cy={point.y}
                r={active ? 6 : points.length === 1 ? 5 : 3.5}
                fill="#007aff"
                stroke={active ? "#ffffff" : "none"}
                strokeWidth={active ? 2 : 0}
                className="pointer-events-none"
              />
            </g>
          );
        })}

        {layout.coordinates.map((point) => (
          <text
            key={`label-${point.label}-${point.index}`}
            x={point.x}
            y={layout.height - 8}
            textAnchor="middle"
            className="fill-neutral-500 text-[9px]"
          >
            {point.label}
          </text>
        ))}

        {selectedCoord ? (
          <g pointerEvents="none">
            <rect
              x={Math.min(Math.max(selectedCoord.x - 58, 8), layout.width - 124)}
              y={Math.max(selectedCoord.y - 48, 8)}
              width="116"
              height={selected.caption ? 44 : 36}
              rx="8"
              className="fill-white stroke-[#ececee] dark:fill-neutral-800 dark:stroke-neutral-700"
            />
            <text
              x={Math.min(Math.max(selectedCoord.x, 66), layout.width - 66)}
              y={Math.max(selectedCoord.y - (selected.caption ? 34 : 28), 22)}
              textAnchor="middle"
              className="fill-neutral-900 text-[9px] font-semibold dark:fill-neutral-100"
            >
              {formatChartDate(selected.date)}
            </text>
            {selected.caption ? (
              <text
                x={Math.min(Math.max(selectedCoord.x, 66), layout.width - 66)}
                y={Math.max(selectedCoord.y - 22, 34)}
                textAnchor="middle"
                className="fill-neutral-500 text-[8px] dark:fill-neutral-400"
              >
                {selected.caption}
              </text>
            ) : null}
            <text
              x={Math.min(Math.max(selectedCoord.x, 66), layout.width - 66)}
              y={Math.max(
                selectedCoord.y - (selected.caption ? 8 : 14),
                selected.caption ? 48 : 36,
              )}
              textAnchor="middle"
              className="fill-[#007aff] text-[10px] font-semibold"
            >
              {formatYen(selected.value)}
            </text>
          </g>
        ) : null}
      </svg>

      <div className="mt-3 rounded-2xl bg-[#f2f2f7] px-4 py-3 text-center dark:bg-neutral-800">
        <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
          {selectedHeading}
        </p>
        <p className="mt-0.5 text-[17px] font-semibold tabular-nums text-[#007aff]">
          {formatYen(selected.value)}
        </p>
        <p className="mt-1 text-[12px] text-neutral-500">
          {points.length === 1
            ? "One snapshot saved — add another date to see a trend line"
            : "Tap a point to inspect a snapshot"}
        </p>
      </div>
    </div>
  );
}
