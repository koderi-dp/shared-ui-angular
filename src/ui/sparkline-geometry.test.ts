import { describe, expect, it } from "vitest";
import { sparklineSegments } from "@/ui/sparkline-geometry";

describe("sparklineSegments", () => {
  it("draws one run for unbroken values", () => {
    const runs = sparklineSegments([1, 2, 3], 72, 20);
    expect(runs).toHaveLength(1);
    expect(runs[0]).toHaveLength(3);
    expect(runs[0][0][0]).toBe(0);
    expect(runs[0][2][0]).toBe(72);
  });

  it("splits at nulls", () => {
    const runs = sparklineSegments([30, 28, null, null, 6, 2], 72, 20);
    expect(runs.map((run) => run.length)).toEqual([2, 2]);
  });

  it("gives a lone point between gaps a single-point run", () => {
    const runs = sparklineSegments([5, null, 7, null, 9, 9], 72, 20);
    expect(runs.map((run) => run.length)).toEqual([1, 1, 2]);
  });

  it("puts the largest value at the top margin and zero at the bottom", () => {
    const [run] = sparklineSegments([0, 10], 72, 20);
    expect(run[0][1]).toBe(18);
    expect(run[1][1]).toBe(2);
  });

  it("returns no runs for all nulls", () => {
    expect(sparklineSegments([null, null], 72, 20)).toEqual([]);
  });
});
