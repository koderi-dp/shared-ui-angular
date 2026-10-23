import { isPlatformBrowser } from "@angular/common";
import {
  assertInInjectionContext,
  DestroyRef,
  inject,
  PLATFORM_ID,
  signal,
  type WritableSignal,
} from "@angular/core";

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

function write(key: string, json: string): void {
  try {
    localStorage.setItem(key, json);
    memory.delete(key);
  } catch {
    memory.set(key, json);
  }
}

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A signal kept in localStorage, so a reload keeps it. A value that cannot be read is the
 * initial one; when localStorage is blocked or full, the value is kept in memory for the
 * page's lifetime. `set`/`update` write JSON and tell every other `persisted` signal with the
 * same key (a `persisted-change` event on this page, `storage` from other tabs). Values are
 * compared by their JSON, so objects and arrays work too. Call it in an injection context: its
 * listeners are removed when that context is destroyed. On the server it is a plain
 * `signal(initial)` and touches nothing.
 */
export function persisted<T>(key: string, initial: T): WritableSignal<T> {
  assertInInjectionContext(persisted);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return signal(initial);

  const value = signal<T>(read(key, initial), { equal: sameJson });
  const setLocal = value.set;
  const set = (next: T) => {
    write(key, JSON.stringify(next));
    setLocal(next);
    window.dispatchEvent(new Event(CHANGED));
  };
  value.set = set;
  value.update = (fn) => set(fn(value()));

  const onChange = () => setLocal(read(key, initial));
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  inject(DestroyRef).onDestroy(() => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  });
  return value;
}
