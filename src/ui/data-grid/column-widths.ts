export type ColumnLimits = { id: string; minSize: number; maxSize: number };
export type ColumnWidths = Record<string, number>;

export function widthsStorageKey(storageKey: string): string {
  return `pylon.grid.${storageKey}.v1`;
}

export function clampWidth(width: number, limits: ColumnLimits): number {
  return Math.min(limits.maxSize, Math.max(limits.minSize, Math.round(width)));
}

export function parseStoredWidths(raw: string | null, columns: ColumnLimits[]): ColumnWidths {
  if (!raw) return {};
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) return {};
  const record = data as Record<string, unknown>;
  const out: ColumnWidths = {};
  for (const col of columns) {
    if (!Object.prototype.hasOwnProperty.call(record, col.id)) continue;
    const value = record[col.id];
    if (typeof value !== "number" || !Number.isFinite(value)) continue;
    out[col.id] = clampWidth(value, col);
  }
  return out;
}

export function setColumnWidth(
  widths: ColumnWidths,
  id: string,
  width: number,
  limits: ColumnLimits,
): ColumnWidths {
  return { ...widths, [id]: clampWidth(width, limits) };
}

export function resetColumnWidth(widths: ColumnWidths, id: string): ColumnWidths {
  const { [id]: _removed, ...rest } = widths;
  return rest;
}

export function serializeWidths(widths: ColumnWidths): string {
  return JSON.stringify(widths);
}
