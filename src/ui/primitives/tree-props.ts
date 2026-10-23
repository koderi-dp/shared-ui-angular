/**
 * headless-tree hands out React-shaped props (`item.getProps()`, `tree.getContainerProps()`,
 * `item.getDragHandleProps()`): camelCase DOM props, a `style` object, `onClick`-style
 * handlers and a `ref` callback. These turn that bag into what an Angular directive applies
 * through `Renderer2`: attributes, styles, DOM listeners and the ref.
 */

export type TreeElementProps = Record<string, unknown>;

export type TreeListener = (event: Event) => unknown;

export type TreePropsBinding = {
  /** Attribute name to value; `null` means the attribute is not set. */
  attributes: Record<string, string | null>;
  /** Kebab-case style property to value. */
  styles: Record<string, string>;
  /** DOM event name to handler. */
  listeners: Record<string, TreeListener>;
  ref?: (element: HTMLElement | null) => void;
};

const EVENT_ALIASES: Record<string, string> = { doubleclick: "dblclick" };
const ATTRIBUTE_ALIASES: Record<string, string> = { className: "class", htmlFor: "for" };
/** Attributes whose boolean values are written out as "true"/"false", like ARIA. */
const ENUMERATED = new Set(["draggable", "spellcheck", "contenteditable"]);
/** Style properties a plain number is written to without a unit. */
const UNITLESS = new Set(["z-index", "opacity", "flex", "flex-grow", "flex-shrink", "order"]);

/** `onKeyDown` → `keydown`; `null` for a prop that is not an event handler. */
export function eventNameOf(prop: string): string | null {
  const match = /^on([A-Z][A-Za-z]*)$/.exec(prop);
  if (!match) return null;
  const name = match[1].toLowerCase();
  return EVENT_ALIASES[name] ?? name;
}

/** `tabIndex` → `tabindex`, `className` → `class`; dashed names stay as they are. */
export function attributeNameOf(prop: string): string {
  if (prop in ATTRIBUTE_ALIASES) return ATTRIBUTE_ALIASES[prop];
  return prop.includes("-") ? prop : prop.toLowerCase();
}

/** The attribute value React would render, or `null` when it renders none. */
export function attributeValueOf(name: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "boolean") {
    if (name.startsWith("aria-") || name.startsWith("data-") || ENUMERATED.has(name)) {
      return String(value);
    }
    return value ? "" : null;
  }
  return String(value);
}

const kebab = (prop: string) => prop.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/** A React style object as kebab-case properties; empty values are left out. */
export function styleEntriesOf(style: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!style || typeof style !== "object") return out;
  for (const [key, value] of Object.entries(style as Record<string, unknown>)) {
    if (value === null || value === undefined || value === "") continue;
    const prop = kebab(key);
    out[prop] = typeof value === "number" && !UNITLESS.has(prop) ? `${value}px` : String(value);
  }
  return out;
}

/** Splits a headless-tree props bag into attributes, styles, listeners and the ref. */
export function toPropsBinding(props: TreeElementProps): TreePropsBinding {
  const binding: TreePropsBinding = { attributes: {}, styles: {}, listeners: {} };
  for (const [prop, value] of Object.entries(props)) {
    if (prop === "ref") {
      if (typeof value === "function") binding.ref = value as TreePropsBinding["ref"];
      continue;
    }
    if (prop === "style") {
      binding.styles = styleEntriesOf(value);
      continue;
    }
    if (typeof value === "function") {
      const event = eventNameOf(prop);
      if (event) binding.listeners[event] = value as TreeListener;
      continue;
    }
    const name = attributeNameOf(prop);
    binding.attributes[name] = attributeValueOf(name, value);
  }
  return binding;
}

/** The keys `previous` had that `next` no longer sets, so they can be removed. */
export function staleKeys(
  previous: Record<string, string | null> | undefined,
  next: Record<string, string | null>,
): string[] {
  if (!previous) return [];
  return Object.keys(previous).filter((key) => next[key] === undefined || next[key] === null);
}

/** The part of `Renderer2` the applier writes through. */
export type TreePropsRenderer = {
  setAttribute(el: unknown, name: string, value: string): void;
  removeAttribute(el: unknown, name: string): void;
  setStyle(el: unknown, style: string, value: unknown, flags?: number): void;
  removeStyle(el: unknown, style: string, flags?: number): void;
  listen(target: unknown, eventName: string, callback: (event: unknown) => unknown): () => void;
};

/** `RendererStyleFlags2.DashCase`: the style names given are kebab-case. */
const DASH_CASE = 2;

/**
 * Applies one props bag after another to the same element: stale attributes and styles are
 * removed, every listener is swapped for the new closure, and the ref is told about the
 * element (and told `null` when a different ref takes over, or on `clear`).
 */
export class TreePropsApplier {
  private previous?: TreePropsBinding;
  private unlisten: (() => void)[] = [];

  constructor(
    private readonly element: HTMLElement,
    private readonly renderer: TreePropsRenderer,
  ) {}

  apply(props: TreeElementProps): void {
    const { element, renderer, previous } = this;
    const next = toPropsBinding(props);
    this.removeListeners();

    for (const name of staleKeys(previous?.attributes, next.attributes)) {
      renderer.removeAttribute(element, name);
    }
    for (const [name, value] of Object.entries(next.attributes)) {
      if (value !== null) renderer.setAttribute(element, name, value);
    }
    for (const prop of staleKeys(previous?.styles, next.styles)) {
      renderer.removeStyle(element, prop, DASH_CASE);
    }
    for (const [prop, value] of Object.entries(next.styles)) {
      renderer.setStyle(element, prop, value, DASH_CASE);
    }
    for (const [event, handler] of Object.entries(next.listeners)) {
      this.unlisten.push(renderer.listen(element, event, handler as (event: unknown) => unknown));
    }
    if (previous?.ref && previous.ref !== next.ref) previous.ref(null);
    next.ref?.(element);
    this.previous = next;
  }

  /** Removes the listeners and tells the ref the element is gone. */
  clear(): void {
    this.removeListeners();
    this.previous?.ref?.(null);
    this.previous = undefined;
  }

  private removeListeners(): void {
    for (const off of this.unlisten) off();
    this.unlisten = [];
  }
}
