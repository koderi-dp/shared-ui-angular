import { computed, Directive, input } from "@angular/core";
import { cn } from "../utils";

/**
 * Written for this registry (Zard has no scroll-area). Native scrolling with a thin themed
 * scrollbar replaces Radix's custom one. Give it a height to make it scroll.
 */
@Directive({ selector: "div[koScrollArea]", host: { "[class]": "classes()" } })
export class KoScrollArea {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "relative overflow-auto rounded-[inherit] [scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin]",
      this.class(),
    ),
  );
}
