import { expect, it } from "vitest";
import { clockTime, seriesColor, SERIES_COLORS, timeTicks } from "./chart-format";

it("keeps a series' colour by its position and greys the overflow", () => {
  expect(seriesColor(0)).toBe(SERIES_COLORS[0]);
  expect(seriesColor(SERIES_COLORS.length - 1)).toBe(SERIES_COLORS[SERIES_COLORS.length - 1]);
  expect(seriesColor(SERIES_COLORS.length)).toBe("#8b909c");
  expect(seriesColor(99)).toBe("#8b909c");
});

it("names the same series differently, so two lines are never one colour", () => {
  expect(new Set(SERIES_COLORS).size).toBe(SERIES_COLORS.length);
});

it("draws a clock time in 24 hours, with seconds only when asked", () => {
  const ts = new Date(2026, 0, 2, 9, 5, 7).getTime();
  expect(clockTime(ts)).toBe("09:05:07");
  expect(clockTime(ts, false)).toBe("09:05");
});

it("puts time ticks on round minutes, without seconds, for each range the pages offer", () => {
  const to = new Date(2026, 0, 2, 22, 18, 22).getTime();
  const minutes = (ticks: number[]) => ticks.map((t) => clockTime(t, false));

  const five = timeTicks(to - 5 * 60_000, to);
  expect(minutes(five.ticks)).toEqual(["22:14", "22:15", "22:16", "22:17", "22:18"]);
  expect(five.withSeconds).toBe(false);

  const fifteen = timeTicks(to - 15 * 60_000, to);
  expect(minutes(fifteen.ticks)).toEqual([
    "22:04",
    "22:06",
    "22:08",
    "22:10",
    "22:12",
    "22:14",
    "22:16",
    "22:18",
  ]);

  const hour = timeTicks(to - 60 * 60_000, to);
  expect(minutes(hour.ticks)).toEqual(["21:20", "21:30", "21:40", "21:50", "22:00", "22:10"]);
});

it("keeps seconds on the labels only when the ticks are under a minute apart", () => {
  const to = new Date(2026, 0, 2, 9, 0, 0).getTime();
  const { ticks, withSeconds } = timeTicks(to - 60_000, to);
  expect(withSeconds).toBe(true);
  expect(ticks.map((t) => clockTime(t))).toEqual([
    "08:59:00",
    "08:59:15",
    "08:59:30",
    "08:59:45",
    "09:00:00",
  ]);
});

it("never draws more ticks than asked for", () => {
  const to = Date.now();
  for (const span of [30_000, 7 * 60_000, 3 * 3_600_000, 5 * 86_400_000]) {
    expect(timeTicks(to - span, to).ticks.length).toBeLessThanOrEqual(8);
  }
});
