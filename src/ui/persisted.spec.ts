import { PLATFORM_ID, provideZonelessChangeDetection, type WritableSignal } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { persisted } from "@/ui/persisted";

let nextKey = 0;
/** A fresh key per test: the in-memory fallback is module-level and outlives a test. */
const freshKey = () => `persisted-spec-${nextKey++}`;

function create<T>(key: string, initial: T): WritableSignal<T> {
  return TestBed.runInInjectionContext(() => persisted(key, initial));
}

describe("persisted", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns the initial value when nothing is stored", () => {
    expect(create(freshKey(), { a: 1 })()).toEqual({ a: 1 });
  });

  it("writes JSON on set, and a new signal with the same key reads it", () => {
    const key = freshKey();
    const value = create(key, [1]);
    value.set([1, 2]);
    expect(value()).toEqual([1, 2]);
    expect(localStorage.getItem(key)).toBe("[1,2]");
    expect(create(key, [0])()).toEqual([1, 2]);

    value.update((list) => [...list, 3]);
    expect(localStorage.getItem(key)).toBe("[1,2,3]");
  });

  it("keeps two signals with the same key in sync", () => {
    const key = freshKey();
    const first = create(key, "a");
    const second = create(key, "a");
    first.set("b");
    expect(second()).toBe("b");
    second.update((value) => `${value}c`);
    expect(first()).toBe("bc");
  });

  it("follows a storage event from another tab", () => {
    const key = freshKey();
    const value = create(key, 1);
    localStorage.setItem(key, "5");
    window.dispatchEvent(new StorageEvent("storage", { key }));
    expect(value()).toBe(5);
  });

  it("returns the initial value when the stored JSON is broken", () => {
    const key = freshKey();
    localStorage.setItem(key, "{nope");
    expect(create(key, 7)()).toBe(7);
  });

  it("removes its listeners when the injector is destroyed", () => {
    const key = freshKey();
    const remove = vi.spyOn(window, "removeEventListener");
    create(key, 0);
    TestBed.resetTestingModule();
    const removed = remove.mock.calls.map(([type]) => type);
    expect(removed).toContain("storage");
    expect(removed).toContain("persisted-change");
  });

  // Review Focus 1: a blocked or full localStorage.
  it("falls back to memory when localStorage throws", () => {
    const key = freshKey();
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    const value = create(key, "initial");
    expect(value()).toBe("initial");
    value.set("kept");
    expect(value()).toBe("kept");
    expect(create(key, "initial")()).toBe("kept");
  });

  // Review Focus 2: server rendering, no window.
  it("returns the initial value on the server and never touches localStorage", () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: PLATFORM_ID, useValue: "server" }],
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem");
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const listen = vi.spyOn(window, "addEventListener");
    const key = freshKey();
    localStorage.setItem(key, '"stored"');
    setItem.mockClear();

    const value = create(key, "initial");
    expect(value()).toBe("initial");
    value.set("next");
    expect(value()).toBe("next");
    expect(getItem).not.toHaveBeenCalled();
    expect(setItem).not.toHaveBeenCalled();
    expect(listen).not.toHaveBeenCalled();
  });
});
