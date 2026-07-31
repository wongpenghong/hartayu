import { useMemo, useState } from "react";
import { formatMonthLabel, formatYen } from "@/lib/format-yen";

export type IncomeExpenseChartPoint = {
  id: string;
  label: string;
  incomeYen: number;
  expenseYen: number;
};

function yAxisTicks(maxValue: number, count: number): number[] {
  const step = maxValue / Math.max(count - 1, 1);
  return Array.from({ length: count }, (_, index) => Math.round(step * index));
}

export function IncomeExpenseChart({
  points,
  emptyLabel = "No entries in this window.",
}: {
  points: IncomeExpenseChartPoint[];
  emptyLabel?: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    points.length > 0 ? points.length - 1 : 0,
  );

  const layout = useMemo(() => {
    const width = 320;
    const height = 220;
    const padding = { top: 16, right: 12, bottom: 32, left: 52 };
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const maxValue = Math.max(
      ...points.flatMap((point) => [point.incomeYen, point.expenseYen]),
      1,
    );

    const toCoordinate = (value: number, index: number) => {
      const x =
        padding.left +
        (points.length === 1
          ? plotWidth / 2
          : (index / (points.length - 1)) * plotWidth);
      const y = padding.top + plotHeight - (value / maxValue) * plotHeight;
      return { x, y };
    };

    const incomeCoords = points.map((point, index) => ({
      ...toCoordinate(point.incomeYen, index),
      index,
    }));
    const expenseCoords = points.map((point, index) => ({
      ...toCoordinate(point.expenseYen, index),
      index,
    }));

    return {
      width,
      height,
      padding,
      plotWidth,
      plotHeight,
      maxValue,
      incomeCoords,
      expenseCoords,
      incomePolyline: incomeCoords.map((point) => `${point.x},${point.y}`).join(" "),
      expensePolyline: expenseCoords
        .map((point) => `${point.x},${point.y}`)
        .join(" "),
      yTicks: yAxisTicks(maxValue, 5),
    };
  }, [points]);

  if (points.length === 0) {
    return <p className="text-[14px] text-neutral-500">{emptyLabel}</p>;
  }

  const selected = points[selectedIndex] ?? points[points.length - 1];

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-[12px] font-medium">
        <span className="inline-flex items-center gap-1.5 text-[#34c759]">
          <span className="h-2 w-2 rounded-full bg-[#34c759]" />
          Income
        </span>
        <span className="inline-flex items-center gap-1.5 text-[#ff3b30]">
          <span className="h-2 w-2 rounded-full bg-[#ff3b30]" />
          Expense
        </span>
      </div>

      <svg viewBox={`0 0 ${layout.width} ${layout.height}`} className="w-full touch-none">
        {layout.yTicks.map((tick) => {
          const y =
            layout.padding.top +
            layout.plotHeight -
            (tick / layout.maxValue) * layout.plotHeight;
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

        <polyline
          fill="none"
          stroke="#34c759"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={layout.incomePolyline}
        />
        <polyline
          fill="none"
          stroke="#ff3b30"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={layout.expensePolyline}
        />

        {layout.incomeCoords.map((point) => {
          const active = point.index === selectedIndex;
          return (
            <circle
              key={`income-${point.index}`}
              cx={point.x}
              cy={point.y}
              r={active ? 5 : 3}
              fill="#34c759"
              stroke={active ? "#ffffff" : "none"}
              strokeWidth={active ? 2 : 0}
              className="cursor-pointer"
              onClick={() => setSelectedIndex(point.index)}
            />
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[9px] text-neutral-500">
        {points.map((point, index) =>
          index === 0 || index === points.length - 1 || index === selectedIndex ? (
            <span key={point.id}>{point.label}</span>
          ) : (
            <span key={point.id} aria-hidden />
          ),
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-[#f2f2f7] px-4 py-3 dark:bg-neutral-800">
        <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
          {formatMonthLabel(
            Number(selected.id.split("-")[0]),
            Number(selected.id.split("-")[1]),
          )}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[12px] text-neutral-500">Income</p>
            <p className="text-[17px] font-semibold tabular-nums text-[#34c759]">
              {formatYen(selected.incomeYen)}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-neutral-500">Expense</p>
            <p className="text-[17px] font-semibold tabular-nums text-[#ff3b30]">
              {formatYen(selected.expenseYen)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
