import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { KoPopover, KoPopoverContent, KoPopoverTrigger, cn } from "@koderi-dp/ui";
import { fitChipCount, moreTagsLabel } from "./chip-fit";

export type ChipColor = { bg: string; fg: string };

export const CHIP = "max-w-40 truncate rounded px-1.5 py-0.5 text-[10px] font-medium";

/** Used when no `color` is given. */
const NEUTRAL_CHIP = "bg-secondary text-secondary-foreground";

const GAP = 4; // matches gap-1

const FOCUS_RING =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** One tag. With `onSelect` it is a button (its click and keydown stay inside); otherwise a span. */
@Component({
  selector: "ko-chip",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    @if (onSelect(); as select) {
      <button
        type="button"
        [class]="buttonClass()"
        [style.background-color]="color()?.bg ?? null"
        [style.color]="color()?.fg ?? null"
        [title]="tag()"
        (keydown)="$event.stopPropagation()"
        (click)="$event.stopPropagation(); select(tag())"
      >
        {{ tag() }}
      </button>
    } @else {
      <span
        [class]="spanClass()"
        [style.background-color]="color()?.bg ?? null"
        [style.color]="color()?.fg ?? null"
        [title]="tag()"
        >{{ tag() }}</span
      >
    }
  `,
})
export class KoChip {
  readonly tag = input.required<string>();
  readonly color = input<ChipColor>();
  readonly onSelect = input<(tag: string) => void>();
  readonly class = input<string>("");

  private readonly base = computed(() => (this.color() ? CHIP : cn(CHIP, NEUTRAL_CHIP)));
  protected readonly buttonClass = computed(() => cn(this.base(), this.class(), FOCUS_RING));
  protected readonly spanClass = computed(() => cn(this.base(), this.class()));
}

/**
 * One non-wrapping line: as many chips as fit, plus a "+N" button that opens a popover listing
 * the rest. The "+N" click and keydown stop propagation; the popover is in an overlay, so clicks
 * inside it never reach a row.
 */
@Component({
  selector: "ko-chip-list",
  imports: [KoChip, KoPopover, KoPopoverContent, KoPopoverTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "hostClass()" },
  template: `
    <span class="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
      @for (tag of shown(); track tag) {
        <ko-chip [tag]="tag" [color]="color()?.(tag)" [onSelect]="onSelect()" class="shrink-0" />
      }
      @if (hidden().length > 0) {
        <button
          type="button"
          [attr.aria-label]="moreLabel()"
          [class]="moreClass"
          [koPopoverTrigger]="more"
          (keydown)="$event.stopPropagation()"
          (click)="$event.stopPropagation()"
        >
          +{{ hidden().length }}
        </button>
        <ko-popover #more [(open)]="moreOpen">
          <ng-template koPopoverContent>
            <div class="flex max-w-80 flex-wrap gap-1 p-0.5">
              @for (tag of hidden(); track tag) {
                <ko-chip [tag]="tag" [color]="color()?.(tag)" [onSelect]="popoverSelect()" />
              }
            </div>
          </ng-template>
        </ko-popover>
      }
    </span>
    <span
      #measure
      aria-hidden="true"
      class="pointer-events-none invisible absolute top-0 left-0 flex flex-nowrap gap-1 whitespace-nowrap"
    >
      @for (tag of list(); track tag) {
        <span [class]="chip" [title]="tag" tabindex="-1">{{ tag }}</span>
      }
      <span [class]="chip">+{{ list().length }}</span>
    </span>
  `,
})
export class KoChipList {
  readonly tags = input<string[] | null | undefined>([]);
  readonly color = input<(tag: string) => ChipColor>();
  readonly onSelect = input<(tag: string) => void>();
  readonly class = input<string>("");

  protected readonly chip = CHIP;
  protected readonly moreClass = cn(CHIP, "shrink-0 bg-muted text-muted-foreground", FOCUS_RING);
  protected readonly moreOpen = signal(false);
  protected readonly list = computed(() => this.tags() ?? []);
  /** null = not measured yet (SSR / first paint): render all chips, clipped. */
  private readonly count = signal<number | null>(null);
  protected readonly shown = computed(() => this.list().slice(0, this.fitted()));
  protected readonly hidden = computed(() => this.list().slice(this.fitted()));
  protected readonly moreLabel = computed(() => moreTagsLabel(this.hidden().length));
  protected readonly hostClass = computed(() =>
    cn("relative flex min-w-0 overflow-hidden", this.class()),
  );
  protected readonly popoverSelect = computed(() => {
    const select = this.onSelect();
    if (!select) return undefined;
    return (tag: string) => {
      this.moreOpen.set(false);
      select(tag);
    };
  });

  private readonly fitted = computed(() => {
    const count = this.count();
    const total = this.list().length;
    return count === null ? total : Math.min(count, total);
  });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly measureRef = viewChild.required<ElementRef<HTMLElement>>("measure");

  constructor() {
    let observer: ResizeObserver | undefined;
    afterRenderEffect(() => {
      this.list();
      const wrap = this.host.nativeElement;
      const measure = this.measureRef().nativeElement;
      if (typeof ResizeObserver === "undefined") return;
      const run = () => {
        const kids = Array.from(measure.children) as HTMLElement[];
        const plus = kids.pop();
        const widths = kids.map((k) => k.offsetWidth);
        this.count.set(fitChipCount(widths, wrap.clientWidth, plus?.offsetWidth ?? 0, GAP));
      };
      observer?.disconnect();
      // Fires once on observe, which also covers the initial measure and re-measure on tags change.
      observer = new ResizeObserver(run);
      observer.observe(wrap);
    });
    inject(DestroyRef).onDestroy(() => observer?.disconnect());
  }
}
