// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Dialog, DialogRef } from "@angular/cdk/dialog";
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
import {
  KO_DIALOG_BACKDROP_CLASS,
  KO_DIALOG_PANEL_CLASS,
  KO_DIALOG_SIZE,
} from "@/ui/primitives/dialog.service";
import { cn } from "@/ui/utils";

let nextId = 0;

/** Points the surrounding `role="dialog"` panel at this element, so the title names the dialog. */
export function linkToPanel(
  host: HTMLElement,
  attribute: "aria-labelledby" | "aria-describedby",
): void {
  const panel = host.closest('[role="dialog"]');
  if (panel && !panel.hasAttribute(attribute)) panel.setAttribute(attribute, host.id);
}

/** Marks the content of a `ko-dialog`: `<ng-template koDialogContent>`. */
@Directive({ selector: "ng-template[koDialogContent]" })
export class KoDialogContent {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

/** Closes the surrounding dialog: a `ko-dialog`, or one opened by `KoDialogService`. */
@Directive({
  selector: "button[koDialogClose]",
  host: { "[attr.type]": "'button'", "(click)": "close()" },
})
export class KoDialogClose {
  private readonly dialog = inject(KoDialog, { optional: true });
  private readonly ref = inject(DialogRef, { optional: true });

  protected close(): void {
    if (this.dialog) this.dialog.open.set(false);
    else this.ref?.close();
  }
}

/** Opens a `ko-dialog` on click. */
@Directive({
  selector: "[koDialogTrigger]",
  host: {
    "aria-haspopup": "dialog",
    "[attr.aria-expanded]": "dialog().open()",
    "(click)": "dialog().open.set(true)",
  },
})
export class KoDialogTrigger {
  readonly dialog = input.required<KoDialog>({ alias: "koDialogTrigger" });
}

/**
 * A modal dialog. `[(open)]` works both ways: Escape, a backdrop click and `koDialogClose` write
 * `false` back. The content goes in `<ng-template koDialogContent>`.
 */
@Component({
  selector: "ko-dialog",
  imports: [NgTemplateOutlet, NgIcon, KoDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <ng-template #shell>
      <div [class]="shellClasses()">
        <ng-container [ngTemplateOutlet]="content()?.template ?? null" />
        <button
          koDialogClose
          class="absolute right-3 top-3 rounded-sm p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ng-icon aria-hidden="true" size="1rem" [svg]="close" />
          <span class="sr-only">Close</span>
        </button>
      </div>
    </ng-template>
  `,
})
export class KoDialog {
  readonly open = model(false);
  /** The panel's max width, set through the overlay config (the CDK pane ignores `max-w-*`). */
  readonly maxWidth = input<string>(KO_DIALOG_SIZE.maxWidth);
  /** Classes merged onto the padded wrapper around the content, such as `p-0 gap-0`. */
  readonly contentClass = input<string>("");

  protected readonly close = lucideX;
  protected readonly content = contentChild(KoDialogContent);
  protected readonly shellClasses = computed(() =>
    cn("relative grid gap-4 p-5", this.contentClass()),
  );
  private readonly shell = viewChild.required<TemplateRef<unknown>>("shell");
  private readonly dialog = inject(Dialog);
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
    const ref = this.dialog.open(this.shell(), {
      role: "dialog",
      ariaModal: true,
      ...KO_DIALOG_SIZE,
      maxWidth: this.maxWidth(),
      viewContainerRef: this.viewContainerRef,
      panelClass: KO_DIALOG_PANEL_CLASS,
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
  selector: "ko-dialog-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoDialogHeader {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("flex flex-col gap-1.5 pr-8", this.class()));
}

@Component({
  selector: "ko-dialog-footer",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoDialogFooter {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", this.class()),
  );
}

@Component({
  selector: "ko-dialog-title",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()", "[attr.id]": "id" },
  template: `<ng-content />`,
})
export class KoDialogTitle {
  readonly class = input<string>("");
  protected readonly id = `ko-dialog-title-${nextId++}`;
  protected readonly classes = computed(() =>
    cn("block text-base font-medium tracking-tight", this.class()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => linkToPanel(host, "aria-labelledby"));
  }
}

@Component({
  selector: "ko-dialog-description",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()", "[attr.id]": "id" },
  template: `<ng-content />`,
})
export class KoDialogDescription {
  readonly class = input<string>("");
  protected readonly id = `ko-dialog-description-${nextId++}`;
  protected readonly classes = computed(() =>
    cn("block text-sm text-muted-foreground", this.class()),
  );

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => linkToPanel(host, "aria-describedby"));
  }
}
