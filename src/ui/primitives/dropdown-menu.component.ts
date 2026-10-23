// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from "@angular/cdk/menu";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
} from "@angular/core";
import { cn } from "@/ui/utils";

/**
 * Opens the menu template on click, Enter, Space or ArrowDown (CDK Menu): the first item gets
 * focus, and Escape closes and refocuses this element. `[koDropdownTrigger]="menuTemplate"`.
 */
@Directive({
  selector: "[koDropdownTrigger]",
  hostDirectives: [{ directive: CdkMenuTrigger, inputs: ["cdkMenuTriggerFor: koDropdownTrigger"] }],
})
export class KoDropdownTrigger {
  constructor() {
    inject(CdkMenuTrigger).menuPosition = [
      { originX: "start", originY: "bottom", overlayX: "start", overlayY: "top", offsetY: 6 },
      { originX: "start", originY: "top", overlayX: "start", overlayY: "bottom", offsetY: -6 },
    ];
  }
}

/** The menu panel; put it in the template given to `koDropdownTrigger`. */
@Component({
  selector: "ko-dropdown-menu",
  hostDirectives: [CdkMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      "block z-50 min-w-44 overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-[var(--shadow-elevated)] animate-in fade-in-0 zoom-in-95",
  },
  template: `<ng-content />`,
})
export class KoDropdownMenu {}

/** A menu item. `(triggered)` fires on click, Enter or Space, and the menu then closes. */
@Directive({
  selector: "button[koDropdownItem]",
  hostDirectives: [
    {
      directive: CdkMenuItem,
      inputs: ["cdkMenuItemDisabled: disabled"],
      outputs: ["cdkMenuItemTriggered: triggered"],
    },
  ],
  host: { type: "button", "[class]": "classes()" },
})
export class KoDropdownItem {
  readonly variant = input<"default" | "destructive">("default");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm outline-none focus:bg-secondary aria-disabled:pointer-events-none aria-disabled:opacity-40",
      this.variant() === "destructive" && "text-destructive focus:bg-destructive/10",
      this.class(),
    ),
  );
}

@Component({
  selector: "ko-dropdown-label",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoDropdownLabel {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("block px-2.5 py-1.5 text-xs font-medium text-muted-foreground", this.class()),
  );
}

@Component({
  selector: "ko-dropdown-separator",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: "separator", "[class]": "classes()" },
  template: ``,
})
export class KoDropdownSeparator {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("block -mx-1 my-1 h-px bg-border", this.class()));
}
