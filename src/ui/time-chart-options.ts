import type { EChartsCoreOption } from "echarts/core";
import { clockTime, timeTicks } from "@/ui/chart-format";
import type { ChartRow, ChartSeries } from "@/ui/charts";

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
  fill?: boolean;
  theme: TimeChartTheme;
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Crosshair tooltip content: the time, then one row per series with a value. */
function tooltipHtml(
  ts: number,
  entries: { series: ChartSeries; value: number }[],
  format: (v: number) => string,
  theme: TimeChartTheme,
): string {
  if (entries.length === 0) return "";
  const lines = entries
    .map(
      ({ series, value }) =>
        `<div style="display:flex;align-items:center;gap:8px">` +
        `<span style="width:8px;height:8px;flex:none;border-radius:2px;background:${escapeHtml(series.color)}"></span>` +
        `<span style="flex:1;color:${theme.tooltipMuted}">${escapeHtml(series.name)}</span>` +
        `<span style="font-family:var(--font-mono);font-variant-numeric:tabular-nums">${escapeHtml(format(value))}</span>` +
        `</div>`,
    )
    .join("");
  return (
    `<div style="font-size:12px;color:${theme.tooltipText}">` +
    `<div style="margin-bottom:4px;font-family:var(--font-mono);font-size:11px;color:${theme.tooltipMuted}">${clockTime(ts)}</div>` +
    `<div style="display:grid;gap:4px">${lines}</div></div>`
  );
}

/**
 * The ECharts option for a time chart. A null value (or a missing key) stays null in the
 * data and the line is not connected across it: that is a gap, not a zero.
 */
export function buildTimeChartOption(input: TimeChartInput): EChartsCoreOption {
  const { rows, series, from, to, format, reference = [], fill = false, theme } = input;
  const formatAxis = input.formatAxis ?? format;
  const axis = timeTicks(from, to);
  const refMax = reference.length ? Math.max(...reference.map((line) => line.value)) : null;

  const lines = series.map((item, index) => ({
    id: item.id,
    name: item.name,
    type: "line" as const,
    data: rows.map((row) => [row.t, row[item.id] ?? null] as [number, number | null]),
    connectNulls: false,
    showSymbol: false,
    symbolSize: 8,
    animation: false,
    lineStyle: { color: item.color, width: 2 },
    itemStyle: { color: item.color, borderColor: theme.tooltipBg, borderWidth: 2 },
    ...(fill ? { areaStyle: { color: item.color, opacity: 0.12 } } : {}),
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
      axisPointer: { lineStyle: { color: theme.text, opacity: 0.5 } },
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
      backgroundColor: theme.tooltipBg,
      borderWidth: 0,
      padding: [8, 10],
      extraCssText: "border-radius:6px;box-shadow:var(--shadow-elevated);",
      axisPointer: { type: "line", lineStyle: { color: theme.text, opacity: 0.5 } },
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
        return tooltipHtml(list[0].value[0], entries, format, theme);
      },
    },
    series: lines,
  };
}
