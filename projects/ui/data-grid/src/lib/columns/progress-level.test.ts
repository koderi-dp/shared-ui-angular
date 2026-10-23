import { describe, expect, it } from "vitest";
import { usageBarFillClass, metricBarLabelClass, usageLevel } from "./progress-level";

describe("usageLevel", () => {
  it("is ok below 75", () => {
    expect(usageLevel(0)).toBe("ok");
    expect(usageLevel(74.9)).toBe("ok");
  });
  it("is warn from 75 up to 90", () => {
    expect(usageLevel(75)).toBe("warn");
    expect(usageLevel(89.9)).toBe("warn");
  });
  it("is critical from 90", () => {
    expect(usageLevel(90)).toBe("critical");
    expect(usageLevel(100)).toBe("critical");
  });
});

describe("usageBarFillClass", () => {
  it("uses the destructive fill when critical, for every variant", () => {
    for (const v of ["cpu", "memory", "disk"] as const) {
      expect(usageBarFillClass(95, v)).toBe("bg-destructive");
    }
  });
  it("uses the amber fill when warn, for every variant", () => {
    for (const v of ["cpu", "memory", "disk"] as const) {
      expect(usageBarFillClass(80, v)).toBe("bg-amber-500");
    }
  });
  it("uses a neutral fill for cpu and emerald for memory and disk when ok", () => {
    expect(usageBarFillClass(10, "cpu")).toBe("bg-foreground/65");
    expect(usageBarFillClass(10, "memory")).toBe("bg-emerald-500");
    expect(usageBarFillClass(10, "disk")).toBe("bg-emerald-500");
  });
});

describe("metricBarLabelClass", () => {
  it("is muted when the bar is empty", () => {
    expect(metricBarLabelClass(0, 0)).toBe("text-muted-foreground");
  });
  it("is white with a shadow over a wide warn or critical fill", () => {
    const white = "font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]";
    expect(metricBarLabelClass(80, 80)).toBe(white);
    expect(metricBarLabelClass(95, 28)).toBe(white);
  });
  it("is foreground for an ok fill or a narrow warn fill", () => {
    expect(metricBarLabelClass(50, 50)).toBe("text-foreground");
    expect(metricBarLabelClass(95, 27)).toBe("text-foreground");
  });
});
