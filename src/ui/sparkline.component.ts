import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

const WIDTH = 72;
const HEIGHT = 20;

/** Point lists for the runs between nulls; a null value breaks the line. */
function segments(values: (number | null)[]): string[] {
  const present = values.filter((value): value is number => value != null);
  const max = Math.max(...present, 1);
  const step = WIDTH / Math.max(1, values.length - 1);
  const runs: string[][] = [];
  let drawing = false;
  values.forEach((value, index) => {
    if (value == null) {
      drawing = false;
      return;
    }
    const x = (index * step).toFixed(1);
    const y = (HEIGHT - 2 - (value / max) * (HEIGHT - 4)).toFixed(1);
    if (!drawing) runs.push([]);
    runs[runs.length - 1].push(`${x},${y}`);
    drawing = true;
  });
  // A lone point between gaps has no length; draw it as a zero-length stroke so it still shows.
  return runs.map((run) => (run.length === 1 ? `${run[0]} ${run[0]}` : run.join(" ")));
}

/**
 * A tiny trend line for a table cell, drawn as plain SVG. A null value breaks the
 * line: the thing was not running then. The cell's number beside it is the value;
 * this only shows whether it has been steady.
 */
@Component({
  selector: "ko-sparkline",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()", "[attr.aria-hidden]": "drawable() ? null : 'true'" },
  template: `
    @if (drawable()) {
      <svg
        width="72"
        height="20"
        viewBox="0 0 72 20"
        role="img"
        [attr.aria-label]="label()"
        class="block"
      >
        <title>{{ label() }}</title>
        @for (points of runs(); track $index) {
          <polyline
            [attr.points]="points"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        }
      </svg>
    }
  `,
})
export class KoSparkline {
  readonly values = input.required<(number | null)[]>();
  readonly label = input.required<string>();
  readonly class = input<string>("");

  protected readonly drawable = computed(
    () => this.values().filter((value) => value != null).length >= 2,
  );
  protected readonly runs = computed(() => (this.drawable() ? segments(this.values()) : []));
  protected readonly classes = computed(() =>
    cn("inline-block h-5 w-[72px] shrink-0", this.drawable() && "text-signal", this.class()),
  );
}
