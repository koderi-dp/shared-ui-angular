import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { sparklineSegments } from "./sparkline-geometry";
import { cn } from "@koderi-dp/ui";

const WIDTH = 72;
const HEIGHT = 20;

/** Point lists for the runs between nulls; a lone point is drawn as a zero-length stroke. */
function segments(values: (number | null)[]): string[] {
  return sparklineSegments(values, WIDTH, HEIGHT).map((run) => {
    const points = run.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
    return points.length === 1 ? `${points[0]} ${points[0]}` : points.join(" ");
  });
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
