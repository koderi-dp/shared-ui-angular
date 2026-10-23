import { describe, expect, it } from "vitest";
import type { ChartRow, ChartSeries } from "@/ui/charts";
import { buildTimeChartOption, type TimeChartTheme } from "@/ui/time-chart-options";

const theme: TimeChartTheme = {
  text: "#8b909c",
  grid: "rgba(236,238,242,0.08)",
  tooltipBg: "#16181f",
  tooltipText: "#eceef2",
  tooltipMuted: "#8b909c",
};
const series: ChartSeries[] = [
  { id: "cpu", name: "CPU", color: "#3987e5" },
  { id: "mem", name: "Memory", color: "#d95926" },
];
const rows: ChartRow[] = [
  { t: 1000, cpu: 10, mem: 20 },
  { t: 2000, cpu: null, mem: 30 },
  { t: 3000, cpu: 12, mem: 40 },
];
const base = { rows, series, from: 1000, to: 3000, format: (v: number) => `${v}%`, theme };

type Opt = {
  xAxis: { type: string; min: number; max: number };
  series: {
    type: string;
    data: [number, number | null][];
    connectNulls: boolean;
    showSymbol: boolean;
    lineStyle: { color: string };
    areaStyle?: unknown;
    markLine?: { data: { yAxis: number }[] };
  }[];
};
const build = (extra = {}) => buildTimeChartOption({ ...base, ...extra }) as unknown as Opt;

describe("buildTimeChartOption", () => {
  it("makes one line per series with its colour", () => {
    const option = build();
    expect(option.series.map((s) => s.type)).toEqual(["line", "line"]);
    expect(option.series.map((s) => s.lineStyle.color)).toEqual(["#3987e5", "#d95926"]);
    expect(option.series.every((s) => s.showSymbol === false)).toBe(true);
  });

  it("keeps null in the data and does not connect across it", () => {
    const [cpu] = build().series;
    expect(cpu.data).toEqual([
      [1000, 10],
      [2000, null],
      [3000, 12],
    ]);
    expect(build().series.every((s) => s.connectNulls === false)).toBe(true);
  });

  it("treats a missing key as a gap", () => {
    const option = build({ rows: [{ t: 1, cpu: 1 } as ChartRow] });
    expect(option.series[1].data).toEqual([[1, null]]);
  });

  it("builds from empty rows without throwing", () => {
    const option = build({ rows: [] });
    expect(option.series.map((s) => s.data)).toEqual([[], []]);
  });

  it("fills under every line only when asked", () => {
    expect(build().series.some((s) => s.areaStyle)).toBe(false);
    expect(build({ fill: true }).series.every((s) => s.areaStyle)).toBe(true);
  });

  it("turns a reference into a markLine at its value", () => {
    const [cpu, mem] = build({ reference: [{ value: 80, label: "Limit" }] }).series;
    expect(cpu.markLine?.data).toEqual([expect.objectContaining({ yAxis: 80 })]);
    expect(mem.markLine).toBeUndefined();
  });

  it("pins the time axis to from and to", () => {
    const { xAxis } = build();
    expect(xAxis.type).toBe("time");
    expect([xAxis.min, xAxis.max]).toEqual([1000, 3000]);
  });
});
