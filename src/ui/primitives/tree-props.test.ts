import { describe, expect, it } from "vitest";
import {
  attributeNameOf,
  attributeValueOf,
  eventNameOf,
  staleKeys,
  styleEntriesOf,
  toPropsBinding,
  TreePropsApplier,
} from "./tree-props";

describe("eventNameOf", () => {
  it("maps React handler names to DOM event names", () => {
    expect(eventNameOf("onClick")).toBe("click");
    expect(eventNameOf("onKeyDown")).toBe("keydown");
    expect(eventNameOf("onDragStart")).toBe("dragstart");
    expect(eventNameOf("onDragOver")).toBe("dragover");
    expect(eventNameOf("onDoubleClick")).toBe("dblclick");
  });

  it("is null for a prop that is not a handler", () => {
    expect(eventNameOf("role")).toBeNull();
    expect(eventNameOf("once")).toBeNull();
    expect(eventNameOf("on")).toBeNull();
  });
});

describe("attributeNameOf", () => {
  it("lowercases camelCase DOM props and keeps dashed names", () => {
    expect(attributeNameOf("tabIndex")).toBe("tabindex");
    expect(attributeNameOf("className")).toBe("class");
    expect(attributeNameOf("htmlFor")).toBe("for");
    expect(attributeNameOf("aria-expanded")).toBe("aria-expanded");
    expect(attributeNameOf("data-tree-toggle")).toBe("data-tree-toggle");
  });
});

describe("attributeValueOf", () => {
  it("drops null and undefined, as React does", () => {
    expect(attributeValueOf("aria-expanded", undefined)).toBeNull();
    expect(attributeValueOf("role", null)).toBeNull();
  });

  it("writes booleans as strings on ARIA, data and enumerated attributes", () => {
    expect(attributeValueOf("aria-expanded", false)).toBe("false");
    expect(attributeValueOf("data-open", true)).toBe("true");
    expect(attributeValueOf("draggable", true)).toBe("true");
  });

  it("treats other booleans as present or absent", () => {
    expect(attributeValueOf("disabled", true)).toBe("");
    expect(attributeValueOf("disabled", false)).toBeNull();
  });

  it("stringifies numbers and strings", () => {
    expect(attributeValueOf("tabindex", -1)).toBe("-1");
    expect(attributeValueOf("aria-level", 2)).toBe("2");
    expect(attributeValueOf("role", "treeitem")).toBe("treeitem");
  });
});

describe("styleEntriesOf", () => {
  it("kebab-cases keys, adds px to plain numbers and drops empty values", () => {
    expect(
      styleEntriesOf({ pointerEvents: "none", top: 4, zIndex: 2, display: undefined }),
    ).toEqual({ "pointer-events": "none", top: "4px", "z-index": "2" });
  });

  it("is empty for a missing style", () => {
    expect(styleEntriesOf(undefined)).toEqual({});
  });
});

describe("toPropsBinding", () => {
  it("splits headless-tree props into attributes, styles, listeners and the ref", () => {
    const ref = () => undefined;
    const onClick = () => undefined;
    const onDragStart = () => undefined;
    const binding = toPropsBinding({
      ref,
      role: "treeitem",
      tabIndex: 0,
      "aria-expanded": undefined,
      "aria-selected": "true",
      draggable: true,
      style: { position: "relative" },
      onClick,
      onDragStart,
    });
    expect(binding.ref).toBe(ref);
    expect(binding.attributes).toEqual({
      role: "treeitem",
      tabindex: "0",
      "aria-expanded": null,
      "aria-selected": "true",
      draggable: "true",
    });
    expect(binding.styles).toEqual({ position: "relative" });
    expect(binding.listeners).toEqual({ click: onClick, dragstart: onDragStart });
  });

  it("ignores functions that are not handlers", () => {
    const binding = toPropsBinding({ getThing: () => 1 });
    expect(binding.attributes).toEqual({});
    expect(binding.listeners).toEqual({});
  });
});

describe("staleKeys", () => {
  it("lists the keys the previous binding set that the next one no longer sets", () => {
    expect(staleKeys({ a: "1", b: "2", c: null }, { a: "1", b: null })).toEqual(["b", "c"]);
    expect(staleKeys(undefined, { a: "1" })).toEqual([]);
  });
});

describe("TreePropsApplier", () => {
  function fakeRenderer() {
    const attributes = new Map<string, string>();
    const styles = new Map<string, string>();
    const listeners = new Map<string, Set<(event: unknown) => unknown>>();
    const renderer = {
      setAttribute: (_: unknown, name: string, value: string) => void attributes.set(name, value),
      removeAttribute: (_: unknown, name: string) => void attributes.delete(name),
      setStyle: (_: unknown, name: string, value: unknown) => void styles.set(name, String(value)),
      removeStyle: (_: unknown, name: string) => void styles.delete(name),
      listen: (_: unknown, event: string, handler: (event: unknown) => unknown) => {
        const set = listeners.get(event) ?? new Set();
        set.add(handler);
        listeners.set(event, set);
        return () => set.delete(handler);
      },
    };
    const fire = (event: string) => [...(listeners.get(event) ?? [])].forEach((h) => h({}));
    return { renderer, attributes, styles, fire };
  }

  it("applies attributes, styles, listeners and the ref", () => {
    const { renderer, attributes, styles, fire } = fakeRenderer();
    const element = {} as HTMLElement;
    const refs: unknown[] = [];
    const clicks: string[] = [];
    const applier = new TreePropsApplier(element, renderer);
    const ref = (el: unknown) => refs.push(el);
    applier.apply({
      ref,
      role: "treeitem",
      style: { paddingLeft: 8 },
      onClick: () => clicks.push("a"),
    });
    expect(attributes.get("role")).toBe("treeitem");
    expect(styles.get("padding-left")).toBe("8px");
    fire("click");
    expect(clicks).toEqual(["a"]);
    expect(refs).toEqual([element]);
  });

  it("removes stale attributes and styles, and swaps the listeners on re-apply", () => {
    const { renderer, attributes, styles, fire } = fakeRenderer();
    const clicks: string[] = [];
    const applier = new TreePropsApplier({} as HTMLElement, renderer);
    applier.apply({
      "aria-expanded": true,
      tabIndex: 0,
      style: { top: 1 },
      onClick: () => clicks.push("old"),
    });
    applier.apply({ "aria-expanded": undefined, tabIndex: -1, onClick: () => clicks.push("new") });
    expect(attributes.has("aria-expanded")).toBe(false);
    expect(attributes.get("tabindex")).toBe("-1");
    expect(styles.has("top")).toBe(false);
    fire("click");
    expect(clicks).toEqual(["new"]);
  });

  it("drops the listeners and hands the ref null on clear", () => {
    const { renderer, fire } = fakeRenderer();
    const refs: unknown[] = [];
    const clicks: string[] = [];
    const element = {} as HTMLElement;
    const applier = new TreePropsApplier(element, renderer);
    applier.apply({ ref: (el: unknown) => refs.push(el), onClick: () => clicks.push("x") });
    applier.clear();
    fire("click");
    expect(clicks).toEqual([]);
    expect(refs).toEqual([element, null]);
  });
});
