import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { clockTime } from "@/ui/chart-format";
import { DEFAULT_TIMELINE_STATES, type TimelineState } from "@/ui/chart-types";
import { cn } from "@/ui/utils";

type Block = { state: string; start: number; end: number };
type TimelineRow = { id: string; name: string; states: (string | null)[] };

/**
 * One strip per item: up, retrying or failed over the range. Steps with
 * the same state are merged into one block, and hovering a block gives its times.
 */
@Component({
  selector: "ko-state-timeline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `
    <div class="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <h3 class="text-sm font-medium">{{ title() }}</h3>
      <ul class="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        @for (entry of legend(); track entry.state) {
          <li class="flex items-center gap-1.5">
            <span [class]="swatch(entry.tone.className)" aria-hidden="true"></span>
            {{ entry.tone.label }}
          </li>
        }
        <li class="flex items-center gap-1.5">
          <span
            class="size-2 rounded-sm bg-inset shadow-[var(--shadow-border)]"
            aria-hidden="true"
          ></span>
          {{ idleLabel() }}
        </li>
      </ul>
    </div>
    <div class="grid gap-2">
      @for (row of strips(); track row.id) {
        <div class="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-3">
          <span class="truncate text-xs text-muted-foreground">{{ row.name }}</span>
          <div
            class="relative h-3 overflow-hidden rounded-sm bg-inset shadow-[var(--shadow-border)]"
          >
            @for (block of row.blocks; track block.start) {
              <span
                [attr.title]="block.title"
                [class]="block.classes"
                [style.left]="block.left"
                [style.width]="block.width"
              ></span>
            }
          </div>
        </div>
      }
    </div>
    <div
      class="mt-2 grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 font-mono text-[10px] text-muted-foreground"
    >
      <span></span>
      <span class="flex justify-between">
        <span>{{ fromLabel() }}</span>
        <span>{{ toLabel() }}</span>
      </span>
    </div>
  `,
})
export class KoStateTimeline {
  readonly title = input<string>("State");
  /** One state per step of `stepMs` from `from`; null where there was nothing. */
  readonly rows = input.required<TimelineRow[]>();
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly stepMs = input.required<number>();
  /** Colour and legend word per state. A state not listed is drawn grey under its own name. */
  readonly states = input<Record<string, TimelineState>>(DEFAULT_TIMELINE_STATES);
  readonly idleLabel = input<string>("Not running");
  readonly class = input<string>("");

  protected readonly fromLabel = computed(() => clockTime(this.from(), false));
  protected readonly toLabel = computed(() => clockTime(this.to(), false));
  protected readonly classes = computed(() =>
    cn("block rounded-xl bg-card p-4 shadow-[var(--shadow-border)]", this.class()),
  );
  protected readonly legend = computed(() =>
    Object.entries(this.states()).map(([state, tone]) => ({ state, tone })),
  );

  protected swatch(className: string): string {
    return cn("size-2 rounded-sm", className);
  }

  protected readonly strips = computed(() => {
    const from = this.from();
    const to = this.to();
    const stepMs = this.stepMs();
    const states = this.states();
    const span = Math.max(1, to - from);
    return this.rows().map((row) => {
      const blocks: Block[] = [];
      row.states.forEach((state, index) => {
        if (!state) return;
        const start = from + index * stepMs;
        const last = blocks[blocks.length - 1];
        if (last && last.state === state && last.end === start) {
          last.end = start + stepMs;
        } else {
          blocks.push({ state, start, end: start + stepMs });
        }
      });
      return {
        id: row.id,
        name: row.name,
        blocks: blocks.map((block) => {
          const tone = states[block.state] ?? { className: "bg-offline", label: block.state };
          return {
            start: block.start,
            classes: cn("absolute inset-y-0", tone.className),
            title: `${tone.label} · ${clockTime(block.start)} to ${clockTime(Math.min(block.end, to))}`,
            left: `${((block.start - from) / span) * 100}%`,
            width: `${Math.max(0.3, ((block.end - block.start) / span) * 100)}%`,
          };
        }),
      };
    });
  });
}
