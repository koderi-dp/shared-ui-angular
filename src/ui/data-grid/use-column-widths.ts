import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  type ColumnLimits,
  type ColumnWidths,
  parseStoredWidths,
  resetColumnWidth,
  serializeWidths,
  setColumnWidth,
  widthsStorageKey,
} from "@/ui/data-grid/column-widths";

// Same-tab writes don't fire the `storage` event, so writers notify here too.
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, widths: ColumnWidths): boolean {
  try {
    if (Object.keys(widths).length === 0) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, serializeWidths(widths));
    return true;
  } catch {
    return false;
  }
}

const getServerSnapshot = () => null;

/**
 * Column widths the operator chose for one grid, persisted under
 * `pylon.grid.<storageKey>.v1`. Storage is read through `useSyncExternalStore`
 * so server render and hydration see `{}` and the client then picks up the
 * stored value without a hydration mismatch. `setWidth` only updates local
 * state (live drag); `commit` writes; `reset` writes immediately. When storage
 * is unavailable the widths still apply for this page view.
 */
export function useColumnWidths(
  storageKey: string,
  columns: ColumnLimits[],
): {
  widths: ColumnWidths;
  setWidth(id: string, w: number): void;
  commit(): void;
  reset(id: string): void;
} {
  const key = widthsStorageKey(storageKey);
  const raw = useSyncExternalStore(subscribe, () => readRaw(key), getServerSnapshot);

  const limitsSig = JSON.stringify(columns.map((c) => [c.id, c.minSize, c.maxSize]));
  // Re-parse only when the stored value or the column limits actually change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stored = useMemo(() => parseStoredWidths(raw, columns), [raw, limitsSig]);

  // Uncommitted widths (during a drag, or when storage refused the write).
  const [pending, setPending] = useState<ColumnWidths | null>(null);
  const pendingRef = useRef<ColumnWidths | null>(null);

  const limitsById = useMemo(() => {
    const out = new Map<string, ColumnLimits>();
    for (const c of columns) out.set(c.id, c);
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limitsSig]);

  const setWidth = useCallback(
    (id: string, w: number) => {
      const limits = limitsById.get(id);
      if (!limits || !Number.isFinite(w)) return;
      const next = setColumnWidth(pendingRef.current ?? stored, id, w, limits);
      pendingRef.current = next;
      setPending(next);
    },
    [limitsById, stored],
  );

  const commit = useCallback(() => {
    const next = pendingRef.current;
    if (!next) return;
    if (writeRaw(key, next)) {
      pendingRef.current = null;
      setPending(null);
      notify();
    }
  }, [key]);

  const reset = useCallback(
    (id: string) => {
      const next = resetColumnWidth(pendingRef.current ?? stored, id);
      if (writeRaw(key, next)) {
        pendingRef.current = null;
        setPending(null);
        notify();
      } else {
        pendingRef.current = next;
        setPending(next);
      }
    },
    [key, stored],
  );

  return { widths: pending ?? stored, setWidth, commit, reset };
}
