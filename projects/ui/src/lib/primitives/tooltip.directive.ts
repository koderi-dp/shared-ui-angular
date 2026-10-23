// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Overlay, type ConnectedPosition, type OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";
import { isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
} from "@angular/core";

/** The React app shell's `TooltipProvider` delay. */
export const KO_TOOLTIP_DELAY = 300;
const OFFSET = 6;

export type KoTooltipSide = "top" | "right" | "bottom" | "left";

const POSITIONS: Record<KoTooltipSide, ConnectedPosition> = {
  top: {
    originX: "center",
    originY: "top",
    overlayX: "center",
    overlayY: "bottom",
    offsetY: -OFFSET,
  },
  bottom: {
    originX: "center",
    originY: "bottom",
    overlayX: "center",
    overlayY: "top",
    offsetY: OFFSET,
  },
  left: {
    originX: "start",
    originY: "center",
    overlayX: "end",
    overlayY: "center",
    offsetX: -OFFSET,
  },
  right: {
    originX: "end",
    originY: "center",
    overlayX: "start",
    overlayY: "center",
    offsetX: OFFSET,
  },
};
const OPPOSITE: Record<KoTooltipSide, KoTooltipSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

let nextId = 0;

/** The tooltip bubble, rendered inside the overlay pane (so no Tailwind sizing on the pane). */
@Component({
  selector: "ko-tooltip-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "tooltip",
    "[attr.id]": "id()",
    class:
      "block z-50 overflow-hidden rounded-md bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-[var(--shadow-elevated)]",
  },
  template: `{{ text() }}`,
})
export class KoTooltipContent {
  readonly text = signal("");
  readonly id = signal("");
}

/**
 * `[koTooltip]="text"`: a tooltip on hover (after 300ms) and focus (at once). It hides on blur,
 * mouseleave and Escape, and is linked to the host with `aria-describedby`. Replaces React's
 * `TooltipProvider`; there is nothing to provide.
 */
@Directive({
  selector: "[koTooltip]",
  host: {
    "(mouseenter)": "scheduleShow()",
    "(mouseleave)": "hide()",
    "(focus)": "show()",
    "(blur)": "hide()",
    "(keydown.escape)": "hide()",
    "(click)": "hide()",
  },
})
export class KoTooltip {
  readonly koTooltip = input.required<string>();
  readonly koTooltipSide = input<KoTooltipSide>("top");

  protected readonly id = `ko-tooltip-${nextId++}`;
  /** The consumer's own `aria-describedby`, captured when the tooltip shows and restored on hide. */
  private original: string | null = null;
  private shown = false;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly overlay = inject(Overlay);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private ref?: OverlayRef;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.hide());
  }

  protected scheduleShow(): void {
    this.cancel();
    this.timer = setTimeout(() => this.show(), KO_TOOLTIP_DELAY);
  }

  protected show(): void {
    this.cancel();
    const text = this.koTooltip();
    if (!this.browser || this.ref || !text) return;
    const side = this.koTooltipSide();
    const ref = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.host)
        .withPush(false)
        .withPositions([POSITIONS[side], POSITIONS[OPPOSITE[side]]]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    const content = ref.attach(new ComponentPortal(KoTooltipContent));
    content.instance.text.set(text);
    content.instance.id.set(this.id);
    this.ref = ref;
    this.shown = true;
    this.original = this.host.getAttribute("aria-describedby");
    this.host.setAttribute("aria-describedby", `${this.original ?? ""} ${this.id}`.trim());
  }

  protected hide(): void {
    this.cancel();
    this.ref?.dispose();
    this.ref = undefined;
    if (this.shown) {
      this.shown = false;
      if (this.original === null) this.host.removeAttribute("aria-describedby");
      else this.host.setAttribute("aria-describedby", this.original);
    }
  }

  private cancel(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
}
