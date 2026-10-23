import { describe, expect, it } from "vitest";
import {
  compareSortValues,
  headerSelectionState,
  INTERACTIVE_SELECTOR,
  isInteractiveTarget,
  pinnedOffsets,
  selectRange,
  toggleAll,
  toggleSelection,
  visibleColumnIds,
} from "./grid-layout";

describe("visibleColumnIds", () => {
  const cols = [
    { id: "a" },
    { id: "b", hideBelow: "xl" as const },
    { id: "c", hideBelow: "md" as const },
  ];
  it("hides below the breakpoint and shows at it", () => {
    expect(visibleColumnIds(cols, 1279)).toEqual(["a", "c"]);
    expect(visibleColumnIds(cols, 1280)).toEqual(["a", "b", "c"]);
  });
  it("hides md columns under 768", () => {
    expect(visibleColumnIds(cols, 700)).toEqual(["a"]);
  });
});

describe("pinnedOffsets", () => {
  it("returns empty when nothing pinned", () => {
    expect(pinnedOffsets([{ id: "a" }], { a: 100 })).toEqual({});
  });
  it("sums widths of earlier pinned columns", () => {
    const cols = [
      { id: "a", pinned: "left" as const },
      { id: "b", pinned: "left" as const },
      { id: "c" },
    ];
    expect(pinnedOffsets(cols, { a: 100, b: 50, c: 70 })).toEqual({ a: 0, b: 100 });
    expect(pinnedOffsets(cols, { a: 200, b: 50, c: 70 })).toEqual({ a: 0, b: 200 });
  });
});

describe("compareSortValues", () => {
  it("compares numbers", () => {
    expect(compareSortValues(1, 2, false)).toBeLessThan(0);
    expect(compareSortValues(1, 2, true)).toBeGreaterThan(0);
  });
  it("compares strings numerically", () => {
    expect(compareSortValues("vm10", "vm9", false)).toBeGreaterThan(0);
  });
  it("puts null last in both directions", () => {
    expect(compareSortValues(null, 1, false)).toBeGreaterThan(0);
    expect(compareSortValues(null, 1, true)).toBeGreaterThan(0);
    expect(compareSortValues(1, null, true)).toBeLessThan(0);
    expect(compareSortValues(null, null, true)).toBe(0);
  });
});

describe("INTERACTIVE_SELECTOR", () => {
  it("treats the selection column's cells as interactive", () => {
    expect(INTERACTIVE_SELECTOR).toContain("[data-grid-select]");
  });
});

describe("isInteractiveTarget", () => {
  const button = {};
  const inside = (closest: () => unknown) => ({ closest });
  const targets = new Set<unknown>();
  const row = { contains: (n: unknown) => n === button || n === row || targets.has(n) };
  const contained = (closest: () => unknown) => {
    const t = inside(closest);
    targets.add(t);
    return t;
  };
  it("true for a contained interactive element", () => {
    expect(
      isInteractiveTarget(
        contained(() => button),
        row,
      ),
    ).toBe(true);
  });
  it("false when nothing matches", () => {
    expect(
      isInteractiveTarget(
        contained(() => null),
        row,
      ),
    ).toBe(false);
  });
  it("false when match is the row itself", () => {
    expect(
      isInteractiveTarget(
        contained(() => row),
        row,
      ),
    ).toBe(false);
  });
  it("false for null target", () => {
    expect(isInteractiveTarget(null, row)).toBe(false);
  });
  it("false when match is outside the row", () => {
    expect(
      isInteractiveTarget(
        contained(() => ({})),
        row,
      ),
    ).toBe(false);
  });
  it("true when the target itself is outside the row (portalled menu)", () => {
    expect(isInteractiveTarget({ closest: () => null }, row)).toBe(true);
  });
});

describe("toggleSelection", () => {
  it("adds a missing id and removes a present one, without mutating", () => {
    const start = new Set(["a"]);
    expect([...toggleSelection(start, "b")].sort()).toEqual(["a", "b"]);
    expect([...toggleSelection(start, "a")]).toEqual([]);
    expect([...start]).toEqual(["a"]);
  });
});

describe("selectRange", () => {
  const order = ["a", "b", "c", "d", "e"];
  it("adds the inclusive range forward and backward", () => {
    expect([...selectRange(new Set(), order, "b", "d")].sort()).toEqual(["b", "c", "d"]);
    expect([...selectRange(new Set(), order, "d", "b")].sort()).toEqual(["b", "c", "d"]);
  });
  it("keeps existing selection and does not mutate", () => {
    const start = new Set(["e"]);
    expect([...selectRange(start, order, "a", "b")].sort()).toEqual(["a", "b", "e"]);
    expect([...start]).toEqual(["e"]);
  });
  it("falls back to just the target when the anchor is unknown", () => {
    expect([...selectRange(new Set(), order, "zz", "c")]).toEqual(["c"]);
    expect([...selectRange(new Set(), order, null, "c")]).toEqual(["c"]);
  });
});

describe("headerSelectionState", () => {
  it("reports all, some, none against the visible ids", () => {
    expect(headerSelectionState(new Set(["a", "b"]), ["a", "b"])).toBe("all");
    expect(headerSelectionState(new Set(["a", "x"]), ["a", "b"])).toBe("some");
    expect(headerSelectionState(new Set(["x"]), ["a", "b"])).toBe("none");
  });
  it("is none for no visible rows", () => {
    expect(headerSelectionState(new Set(["a"]), [])).toBe("none");
  });
});

describe("toggleAll", () => {
  it("adds every visible id when not all are selected, keeping hidden ones", () => {
    expect([...toggleAll(new Set(["a", "x"]), ["a", "b"])].sort()).toEqual(["a", "b", "x"]);
  });
  it("removes only the visible ids when all are selected", () => {
    expect([...toggleAll(new Set(["a", "b", "x"]), ["a", "b"])]).toEqual(["x"]);
  });
});
