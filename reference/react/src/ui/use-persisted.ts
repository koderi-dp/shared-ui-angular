import { useCallback, useSyncExternalStore } from "react";

const CHANGED = "persisted-change";

/** Holds a value for this page's lifetime when localStorage is full or blocked. */
const memory = new Map<string, string>();

function read<T>(key: string, initial: T): T {
  try {
    const stored = memory.get(key) ?? localStorage.getItem(key);
    return stored === null ? initial : (JSON.parse(stored) as T);
  } catch {
    return initial;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

/**
 * State kept in localStorage, so a reload keeps it. A value that cannot be read is the
 * initial one. The server render and the first client render use the initial value, so a
 * server-rendered page hydrates without a mismatch and then shows the stored value.
 * Values are compared by their JSON, so objects and arrays work too.
 */
export function usePersisted<T>(key: string, initial: T): [T, (next: T) => void] {
  const initialJson = JSON.stringify(initial);
  const json = useSyncExternalStore(
    subscribe,
    () => JSON.stringify(read(key, initial)),
    () => initialJson,
  );
  const set = useCallback(
    (next: T) => {
      const json = JSON.stringify(next);
      try {
        localStorage.setItem(key, json);
        memory.delete(key);
      } catch {
        memory.set(key, json);
      }
      window.dispatchEvent(new Event(CHANGED));
    },
    [key],
  );
  return [JSON.parse(json) as T, set];
}
