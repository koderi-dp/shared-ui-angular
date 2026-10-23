/**
 * How many chips fit on one line. When some chips are hidden, room for the
 * "+N" chip (and the gap before it) is reserved.
 */
export function fitChipCount(
  chipWidths: number[],
  available: number,
  plusWidth: number,
  gap: number,
): number {
  const total = chipWidths.length;
  let used = 0;
  let best = 0;
  for (let n = 1; n <= total; n++) {
    used += chipWidths[n - 1] + (n > 1 ? gap : 0);
    const needed = n < total ? used + gap + plusWidth : used;
    if (needed <= available) best = n;
  }
  return best;
}

/** Accessible name for the "+N" chip that opens the hidden tags. */
export function moreTagsLabel(hidden: number): string {
  return `Show ${hidden} more ${hidden === 1 ? "tag" : "tags"}`;
}
