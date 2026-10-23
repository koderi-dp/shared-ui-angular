// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Dialog, DialogRef } from "@angular/cdk/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { NgTemplateOutlet } from "@angular/common";
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  TemplateRef,
  untracked,
  viewChild,
  ViewContainerRef,
} from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { lucideX } from "@ng-icons/lucide";
import { linkToPanel } from "@/ui/primitives/dialog-panel";
import { KO_DIALOG_BACKDROP_CLASS } from "@/ui/primitives/dialog.service";
import { cn } from "@/ui/utils";

let nextId = 0;

/** Marks the content of a `ko-sheet`: `<ng-template koSheetContent>`. */
@Directive({ selector: "ng-template[koSheetContent]" })
export class KoSheetContent {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Closes the surrounding `ko-sheet`. */
@Directive({
  selector: "button[koSheetClose]",
  host: { "[attr.type]": "'button'", "(click)": "sheet?.open.set(false)" },
})
export class KoSheetClose {
  protected readonly sheet = inject(KoSheet, { optional: true });
}

/** Opens a `ko-sheet` on click. */
@Directive({
  selector: "[koSheetTrigger]",
  host: {
    "aria-haspopup": "dialog",
    "[attr.aria-expanded]": "sheet().open()",
    "(click)": "sheet().open.set(true)",
  },
})
export class KoSheetTrigger {
  readonly sheet = input.required<KoSheet>({ alias: "koSheetTrigger" });
}

/**
 * A side panel on the same CDK dialog as `ko-dialog`: focus trap, Escape, backdrop click and
 * focus return. `[(open)]` works both ways.
 */
@Component({
  selector: "ko-sheet",
  imports: [NgTemplateOutlet, NgIcon, KoSheetClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <ng-template #shell>
      <div class="relative flex h-full flex-col">
        <ng-container [ngTemplateOutlet]="content()?.template ?? null" />
        <button
          koSheetClose
          class="absolute right-3 top-3 rounded-sm p-2 text-muted-foreground hover:bg-secondary"
        >
          <ng-icon aria-hidden="true" size="1rem" [svg]="close" />
          <span class="sr-only">Close</span>
        </button>
      </div>
    </ng-template>
  `,
})
export class KoSheet {
  readonly open = model(false);
  readonly side = input<"left" | "right">("right");
  /** The panel's width, set through the overlay config (the CDK pane ignores `w-*`). */
  readonly width = input("18rem");

  protected readonly close = lucideX;
  protected readonly content = contentChild(KoSheetContent);
  private readonly shell = viewChild.required<TemplateRef<unknown>>("shell");
  private readonly dialog = inject(Dialog);
  private readonly overlay = inject(Overlay);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private ref?: DialogRef<unknown, unknown>;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => (open ? this.show() : this.ref?.close()));
    });
    inject(DestroyRef).onDestroy(() => this.ref?.close());
  }

  private show(): void {
    if (this.ref) return;
    const left = this.side() === "left";
    const position = this.overlay.position().global().top("0");
    const ref = this.dialog.open(this.shell(), {
      role: "dialog",
      ariaModal: true,
      viewContainerRef: this.viewContainerRef,
      width: this.width(),
      height: "100%",
      positionStrategy: left ? position.left("0") : position.right("0"),
      panelClass: [
        "bg-card",
        "shadow-[var(--shadow-elevated)]",
        "duration-300",
        "animate-in",
        left ? "slide-in-from-left" : "slide-in-from-right",
      ],
      backdropClass: KO_DIALOG_BACKDROP_CLASS,
    });
    this.ref = ref;
    ref.closed.subscribe(() => {
      if (this.ref === ref) this.ref = undefined;
      this.open.set(false);
    });
  }
}

@Component({
  selector: "ko-sheet-title",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()", "[attr.id]": "id" },
  template: `<ng-content />`,
})
export class KoSheetTitle {
  readonly class = input<string>("");
  protected readonly id = `ko-sheet-title-${nextId++}`;
  protected readonly classes = computed(() => cn("block text-sm font-semibold", this.class()));

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => linkToPanel(host, "aria-labelledby"));
  }
}

@Component({
  selector: "ko-sheet-description",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()", "[attr.id]": "id" },
  template: `<ng-content />`,
})
export class KoSheetDescription {
  readonly class = input<string>("");
  protected readonly id = `ko-sheet-description-${nextId++}`;
  protected readonly classes = computed(() =>
    cn("block text-xs text-muted-foreground", this.class()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => linkToPanel(host, "aria-describedby"));
  }
}
