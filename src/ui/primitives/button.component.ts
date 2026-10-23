// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { lucideLoaderCircle } from "@ng-icons/lucide";
import type { VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/ui/primitives/button-variants";
import { cn } from "@/ui/utils";

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * The app button, on a native `<button>` or `<a>`. Prefer icon + text for actions, and keep the
 * label stable while loading. On an anchor, `disabled` sets `aria-disabled` and drops the tab stop.
 */
@Component({
  selector: "button[koButton], a[koButton]",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class]": "classes()",
    "[attr.disabled]": "isButton && inactive() ? '' : null",
    "[attr.aria-busy]": "loading() ? 'true' : null",
    "[attr.aria-disabled]": "inactive() ? 'true' : null",
    "[attr.tabindex]": "!isButton && inactive() ? -1 : tabindex()",
    "(click)": "onClick($event)",
  },
  template: `
    @if (icon(); as svg) {
      <ng-icon
        aria-hidden="true"
        size="1rem"
        [svg]="loading() ? spinner : svg"
        [class.animate-spin]="loading()"
        [class.motion-reduce:animate-none]="loading()"
      />
    }
    <span
      class="inline-flex items-center justify-center gap-2"
      [class.opacity-0]="loading() && !icon()"
    >
      <ng-content />
    </span>
    @if (loading() && !icon()) {
      <ng-icon
        aria-hidden="true"
        size="1rem"
        class="absolute animate-spin motion-reduce:animate-none"
        [svg]="spinner"
      />
    }
  `,
})
export class KoButton {
  readonly variant = input<ButtonVariants["variant"]>("default");
  readonly size = input<ButtonVariants["size"]>("default");
  readonly icon = input<string>();
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  /** Re-reads a static `tabindex` so the host binding never strips it from an enabled control. */
  readonly tabindex = input<string | number | null>(null);

  protected readonly spinner = lucideLoaderCircle;
  protected readonly isButton =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement.tagName === "BUTTON";
  protected readonly inactive = computed(() => this.disabled() || this.loading());
  protected readonly classes = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this.loading() && "disabled:!opacity-100",
      this.class(),
    ),
  );

  protected onClick(event: Event): void {
    if (this.inactive()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}

/** Compact toolbar action with a required accessible name and native tooltip. */
@Component({
  selector: "button[koIconButton]",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[class]": "classes()",
    "[attr.aria-label]": "label()",
    "[attr.title]": "label()",
    "[attr.disabled]": "inactive() ? '' : null",
    "[attr.aria-busy]": "loading() ? 'true' : null",
    "[attr.aria-disabled]": "inactive() ? 'true' : null",
  },
  template: `
    <ng-icon
      aria-hidden="true"
      size="1rem"
      [svg]="loading() ? spinner : icon()"
      [class.animate-spin]="loading()"
      [class.motion-reduce:animate-none]="loading()"
    />
  `,
})
export class KoIconButton {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly variant = input<ButtonVariants["variant"]>("ghost");
  readonly size = input<"icon" | "icon-sm">("icon-sm");
  readonly loading = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");

  protected readonly spinner = lucideLoaderCircle;
  protected readonly inactive = computed(() => this.disabled() || this.loading());
  protected readonly classes = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this.loading() && "disabled:!opacity-100",
      this.class(),
    ),
  );
}
