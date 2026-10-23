// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Overlay, type OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";
import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  PLATFORM_ID,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from "@angular/core";

/** Marks the content of a `ko-popover`: `<ng-template koPopoverContent>`. */
@Directive({ selector: "ng-template[koPopoverContent]" })
export class KoPopoverContent {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Toggles a `ko-popover` and anchors it to this element. */
@Directive({
  selector: "[koPopoverTrigger]",
  host: {
    "aria-haspopup": "dialog",
    "[attr.aria-expanded]": "popover().open()",
    "(click)": "popover().open.set(!popover().open())",
  },
})
export class KoPopoverTrigger {
  readonly popover = input.required<KoPopover>({ alias: "koPopoverTrigger" });

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef);
    effect(() => this.popover().anchor.set(element.nativeElement));
  }
}

/**
 * A popover anchored to its `koPopoverTrigger`. `[(open)]` works both ways: an outside click and
 * Escape write `false` back. The content goes in `<ng-template koPopoverContent>`.
 */
@Component({
  selector: "ko-popover",
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <ng-template #shell>
      <div
        role="dialog"
        tabindex="-1"
        class="z-50 min-w-44 overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-[var(--shadow-elevated)] outline-none animate-in fade-in-0 zoom-in-95"
      >
        <ng-container [ngTemplateOutlet]="content()?.template ?? null" />
      </div>
    </ng-template>
  `,
})
export class KoPopover {
  readonly open = model(false);
  /** Set by `koPopoverTrigger`. */
  readonly anchor = signal<HTMLElement | undefined>(undefined);

  protected readonly content = contentChild(KoPopoverContent);
  private readonly shell = viewChild.required<TemplateRef<unknown>>("shell");
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly injector = inject(Injector);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private ref?: OverlayRef;

  constructor() {
    effect(() => {
      const open = this.open();
      const anchor = this.anchor();
      untracked(() => (open ? this.show(anchor) : this.hide()));
    });
    inject(DestroyRef).onDestroy(() => this.ref?.dispose());
  }

  private show(anchor: HTMLElement | undefined): void {
    if (!this.browser || this.ref || !anchor) return;
    const ref = this.overlay.create({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(anchor)
        .withPush(false)
        .withPositions([
          { originX: "start", originY: "bottom", overlayX: "start", overlayY: "top", offsetY: 6 },
          { originX: "start", originY: "top", overlayX: "start", overlayY: "bottom", offsetY: -6 },
        ]),
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
    this.ref = ref;
    ref.attach(new TemplatePortal(this.shell(), this.viewContainerRef));
    afterNextRender(
      () => ref.overlayElement.querySelector<HTMLElement>('[role="dialog"]')?.focus(),
      { injector: this.injector },
    );
    ref.outsidePointerEvents().subscribe((event) => {
      if (!anchor.contains(event.target as Node)) this.open.set(false);
    });
    ref.keydownEvents().subscribe((event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      this.open.set(false);
    });
  }

  private hide(): void {
    const ref = this.ref;
    if (!ref) return;
    this.ref = undefined;
    if (ref.overlayElement.contains(document.activeElement)) this.anchor()?.focus();
    ref.dispose();
  }
}
