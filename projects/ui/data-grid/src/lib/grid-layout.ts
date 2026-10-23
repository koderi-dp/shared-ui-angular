export type Breakpoint = "sm" | "md" | "lg" | "xl";

export const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export function visibleColumnIds(
  columns: { id: string; hideBelow?: Breakpoint }[],
  viewportWidth: number,
): string[] {
  return columns
    .filter((c) => !c.hideBelow || viewportWidth >= BREAKPOINT_PX[c.hideBelow])
    .map((c) => c.id);
}

export function pinnedOffsets(
  columns: { id: string; pinned?: "left" }[],
  widths: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  let left = 0;
  for (const c of columns) {
    if (c.pinned !== "left") continue;
    out[c.id] = left;
    left += widths[c.id] ?? 0;
  }
  return out;
}

export function compareSortValues(
  a: string | number | null,
  b: string | number | null,
  desc: boolean,
): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  let result: number;
  if (typeof a === "number" && typeof b === "number") {
    result = a - b;
  } else {
    result = String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  }
  return desc ? -result : result;
}

/** `[data-grid-select]` marks the selection column's cells, so clicks there never count as row clicks. */
export const INTERACTIVE_SELECTOR =
  'button, a, input, select, textarea, label, [role="button"], [data-grid-select]';

export function isInteractiveTarget(
  target: { closest(selector: string): unknown } | null,
  row: { contains(node: unknown): boolean },
): boolean {
  if (!target) return false;
  if (!row.contains(target)) return true;
  const hit = target.closest(INTERACTIVE_SELECTOR);
  if (!hit || hit === row) return false;
  return row.contains(hit);
}

export type HeaderSelectionState = "all" | "some" | "none";

export function toggleSelection(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Adds the inclusive range between anchor and target (in `orderedIds` order). */
export function selectRange(
  selected: ReadonlySet<string>,
  orderedIds: readonly string[],
  anchorId: string | null,
  targetId: string,
): Set<string> {
  const next = new Set(selected);
  const to = orderedIds.indexOf(targetId);
  const from = anchorId == null ? -1 : orderedIds.indexOf(anchorId);
  if (to < 0 || from < 0) {
    next.add(targetId);
    return next;
  }
  const [lo, hi] = from <= to ? [from, to] : [to, from];
  for (let i = lo; i <= hi; i++) next.add(orderedIds[i]!);
  return next;
}

export function headerSelectionState(
  selected: ReadonlySet<string>,
  visibleIds: readonly string[],
): HeaderSelectionState {
  let count = 0;
  for (const id of visibleIds) if (selected.has(id)) count++;
  if (count === 0) return "none";
  return count === visibleIds.length ? "all" : "some";
}

/** All visible selected → deselect the visible ids; else select them all. Hidden ids are kept. */
export function toggleAll(
  selected: ReadonlySet<string>,
  visibleIds: readonly string[],
): Set<string> {
  const next = new Set(selected);
  if (headerSelectionState(selected, visibleIds) === "all") {
    for (const id of visibleIds) next.delete(id);
  } else {
    for (const id of visibleIds) next.add(id);
  }
  return next;
}
