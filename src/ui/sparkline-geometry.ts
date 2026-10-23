/**
 * The point lists of a sparkline, one per run between nulls (a null breaks the line).
 * A lone point between gaps is a single-point run. X spreads over `width`; Y scales to
 * the largest value (at least 1) with a 2px margin.
 */
export function sparklineSegments(
  values: (number | null)[],
  width: number,
  height: number,
): [number, number][][] {
  const present = values.filter((value): value is number => value != null);
  const max = Math.max(...present, 1);
  const step = width / Math.max(1, values.length - 1);
  const runs: [number, number][][] = [];
  let drawing = false;
  values.forEach((value, index) => {
    if (value == null) {
      drawing = false;
      return;
    }
    if (!drawing) runs.push([]);
    runs[runs.length - 1].push([index * step, height - 2 - (value / max) * (height - 4)]);
    drawing = true;
  });
  return runs;
}
