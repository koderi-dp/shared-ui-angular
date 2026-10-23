import type { EChartsCoreOption } from "echarts/core";
import { clockTime, timeTicks } from "@/ui/chart-format";
import type { ChartRow, ChartSeries } from "@/ui/chart-types";

/** Resolved theme colours, read from the CSS variables by the component so this stays pure. */
export type TimeChartTheme = {
  text: string;
  grid: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipMuted: string;
};

export type TimeChartInput = {
  rows: ChartRow[];
  series: ChartSeries[];
  from: number;
  to: number;
  format: (v: number) => string;
  formatAxis?: (v: number) => string;
  reference?: { value: number; label: string }[];
  theme: TimeChartTheme;
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Gap in px between the pointer and the tooltip box, as Recharts places it. */
const TOOLTIP_OFFSET = 10;

/**
 * Recharts' placement: the box sits 10px right of and below the pointer, flips to the left when it
 * would pass the chart's right edge, and is kept inside the chart.
 */
export function tooltipPosition(
  point: number[],
  _params: unknown,
  _dom: unknown,
  _rect: unknown,
  size: { contentSize: number[]; viewSize: number[] },
): [number, number] {
  const [width, height] = size.contentSize;
  const [viewWidth, viewHeight] = size.viewSize;
  const right = point[0] + TOOLTIP_OFFSET;
  const x = right + width > viewWidth ? point[0] - TOOLTIP_OFFSET - width : right;
  const y = point[1] + TOOLTIP_OFFSET;
  return [
    Math.max(0, Math.min(x, viewWidth - width)),
    Math.max(0, Math.min(y, viewHeight - height)),
  ];
}

/** Crosshair tooltip content, the React `ChartTooltip` markup: the time, then a row per series. */
function tooltipHtml(
  ts: number,
  entries: { series: ChartSeries; value: number }[],
  format: (v: number) => string,
): string {
  if (entries.length === 0) return "";
  const lines = entries
    .map(
      ({ series, value }) =>
        `<div class="flex items-center gap-2">` +
        `<span class="size-2 shrink-0 rounded-sm" style="background-color:${escapeHtml(series.color)}" aria-hidden="true"></span>` +
        `<span class="min-w-0 flex-1 truncate text-muted-foreground">${escapeHtml(series.name)}</span>` +
        `<span class="font-mono tabular-nums">${escapeHtml(format(value))}</span>` +
        `</div>`,
    )
    .join("");
  return (
    `<div class="rounded-md bg-popover px-2.5 py-2 text-xs shadow-[var(--shadow-elevated)]">` +
    `<div class="mb-1 font-mono text-[11px] text-muted-foreground">${clockTime(ts)}</div>` +
    `<div class="grid gap-1">${lines}</div></div>`
  );
}

/** Whether any series has a non-null value in any row; otherwise the chart shows its empty label. */
export function hasChartData(rows: ChartRow[], series: ChartSeries[]): boolean {
  return rows.some((row) => series.some((item) => row[item.id] != null));
}

/**
 * The ECharts option for a time chart. A null value (or a missing key) stays null in the
 * data and the line is not connected across it: that is a gap, not a zero.
 */
export function buildTimeChartOption(input: TimeChartInput): EChartsCoreOption {
  const { rows, series, from, to, format, reference = [], theme } = input;
  const formatAxis = input.formatAxis ?? format;
  const axis = timeTicks(from, to);
  const refMax = reference.length ? Math.max(...reference.map((line) => line.value)) : null;

  const lines = series.map((item, index) => ({
    id: item.id,
    name: item.name,
    type: "line" as const,
    data: rows.map((row) => [row.t, row[item.id] ?? null] as [number, number | null]),
    connectNulls: false,
    // The hover dot (Recharts activeDot r=4): hidden at rest, shown by the axis tooltip.
    showSymbol: false,
    symbol: "circle",
    symbolSize: 8,
    emphasis: { scale: false },
    animation: false,
    lineStyle: { color: item.color, width: 2 },
    itemStyle: { color: item.color, borderColor: "#12141a", borderWidth: 2 },
    ...(index === 0 && reference.length
      ? {
          markLine: {
            silent: true,
            symbol: "none",
            animation: false,
            lineStyle: { color: theme.text, type: [4, 4] as number[], width: 1 },
            data: reference.map((line) => ({
              yAxis: line.value,
              label: {
                formatter: line.label,
                position: "insideEndTop" as const,
                color: theme.text,
                fontSize: 10,
              },
            })),
          },
        }
      : {}),
  }));

  return {
    animation: false,
    grid: { top: 8, right: 20, bottom: 0, left: 0, containLabel: true },
    xAxis: {
      type: "time",
      min: from,
      max: to,
      axisLine: { lineStyle: { color: theme.grid } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: {
        color: theme.text,
        fontSize: 11,
        hideOverlap: true,
        customValues: axis.ticks,
        formatter: (value: number) => clockTime(value, axis.withSeconds),
      },
    },
    yAxis: {
      type: "value",
      min: 0,
      // A reference line above the data still has to be inside the plot.
      ...(refMax == null ? {} : { max: (v: { max: number }) => Math.max(v.max, refMax) }),
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.text, fontSize: 11, formatter: (v: number) => formatAxis(v) },
    },
    tooltip: {
      trigger: "axis",
      // The box is drawn by the formatter; ECharts' own chrome is switched off.
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      confine: true,
      transitionDuration: 0,
      textStyle: { color: theme.tooltipText },
      extraCssText: "box-shadow: none;",
      position: tooltipPosition,
      axisPointer: {
        type: "line",
        lineStyle: { color: "rgb(236 238 242 / 25%)", width: 1, type: "solid" },
      },
      formatter: (params: unknown) => {
        const list = (Array.isArray(params) ? params : [params]) as {
          seriesId?: string;
          value?: [number, number | null];
        }[];
        if (list.length === 0 || !list[0].value) return "";
        const entries = series.flatMap((item) => {
          const hit = list.find((p) => p.seriesId === item.id);
          const value = hit?.value?.[1];
          return value == null ? [] : [{ series: item, value }];
        });
        return tooltipHtml(list[0].value[0], entries, format);
      },
    },
    series: lines,
  };
}
