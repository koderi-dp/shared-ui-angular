import { isPlatformBrowser } from "@angular/common";
import { computed, DestroyRef, inject, PLATFORM_ID, signal, type Signal } from "@angular/core";
import {
  type ColumnLimits,
  type ColumnWidths,
  parseStoredWidths,
  resetColumnWidth,
  serializeWidths,
  setColumnWidth,
  widthsStorageKey,
} from "./column-widths";

export type ColumnWidthsState = {
  widths: Signal<ColumnWidths>;
  setWidth(id: string, width: number): void;
  resetWidth(id: string): void;
};

// Same-tab writes don't fire the `storage` event, so writers notify here too.
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
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

/**
 * Column widths the operator chose for one grid, persisted under `pylon.grid.<storageKey>.v1`.
 * Call it in an injection context. On the server (and before storage is readable) the widths
 * are `{}`. `setWidth` and `resetWidth` write through at once; when storage is unavailable or
 * refuses the write, the widths are kept in memory for this page view, so a resize still
 * applies. Other grids with the same key, in this tab or another, pick up the change.
 */
export function columnWidthsState(
  storageKey: Signal<string>,
  columns: Signal<ColumnLimits[]>,
): ColumnWidthsState {
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const key = computed(() => widthsStorageKey(storageKey()));
  const version = signal(0);
  // Widths storage refused, for the key they belong to.
  const memory = signal<{ key: string; widths: ColumnWidths } | null>(null);

  if (browser) {
    const bump = () => version.update((v) => v + 1);
    listeners.add(bump);
    window.addEventListener("storage", bump);
    inject(DestroyRef).onDestroy(() => {
      listeners.delete(bump);
      window.removeEventListener("storage", bump);
    });
  }

  const stored = computed(() => {
    version();
    return browser ? parseStoredWidths(readRaw(key()), columns()) : {};
  });

  const widths = computed(() => {
    const held = memory();
    return held && held.key === key() ? held.widths : stored();
  });

  const save = (next: ColumnWidths) => {
    const k = key();
    if (browser && writeRaw(k, next)) {
      memory.set(null);
      notify();
    } else {
      memory.set({ key: k, widths: next });
    }
  };

  return {
    widths,
    setWidth(id, width) {
      const limits = columns().find((c) => c.id === id);
      if (!limits || !Number.isFinite(width)) return;
      save(setColumnWidth(widths(), id, width, limits));
    },
    resetWidth(id) {
      save(resetColumnWidth(widths(), id));
    },
  };
}
