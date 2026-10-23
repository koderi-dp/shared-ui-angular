import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { LineChart } from "echarts/charts";
import { GridComponent, MarkLineComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { NgxEchartsDirective, provideEchartsCore } from "ngx-echarts";
import type { ChartRow, ChartSeries } from "@/ui/chart-types";
import { buildTimeChartOption, hasChartData, type TimeChartTheme } from "@/ui/time-chart-options";
import { cn } from "@/ui/utils";

echarts.use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer]);

/**
 * A line chart over time with one line per series, in the frame Pylon's metric panels
 * use. The legend is always shown for two or more series and carries each one's latest
 * value, so nothing has to be read off the tooltip.
 */
@Component({
  selector: "ko-time-chart",
  imports: [NgIcon, NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", "[class]": "classes()" },
  template: `
    <div class="mb-3 flex items-start gap-2">
      <span class="mt-0.5 shrink-0 text-muted-foreground">
        <ng-icon aria-hidden="true" size="16px" [svg]="icon()" />
      </span>
      <div class="min-w-0 flex-1">
        <h3 class="truncate text-sm font-medium">{{ title() }}</h3>
        @if (description()) {
          <p class="truncate text-xs text-muted-foreground">{{ description() }}</p>
        }
      </div>
      @if (series().length === 1) {
        <span class="shrink-0 text-sm tabular-nums">{{ legend()[0].text }}</span>
      }
    </div>
    @if (series().length > 1) {
      <ul class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        @for (item of legend(); track item.id) {
          <li class="flex min-w-0 items-center gap-1.5">
            <span
              class="size-2 shrink-0 rounded-sm"
              [style.background-color]="item.color"
              aria-hidden="true"
            ></span>
            <span class="truncate text-muted-foreground">{{ item.name }}</span>
            <span class="font-mono tabular-nums">{{ item.text }}</span>
          </li>
        }
      </ul>
    }
    <div [class]="plotClasses()" role="img" [attr.aria-label]="title() + ' over time'">
      @if (!hasData()) {
        <div
          class="absolute inset-0 grid place-items-center rounded-lg bg-inset text-xs text-muted-foreground"
        >
          {{ emptyLabel() }}
        </div>
      } @else if (option(); as chartOption) {
        <div echarts class="absolute inset-0" [options]="chartOption"></div>
      }
    </div>
  `,
})
export class KoTimeChart {
  readonly title = input.required<string>();
  /** An `@ng-icons/lucide` SVG string. */
  readonly icon = input.required<string>();
  readonly description = input<string>();
  readonly rows = input.required<ChartRow[]>();
  readonly series = input.required<ChartSeries[]>();
  readonly from = input.required<number>();
  readonly to = input.required<number>();
  readonly format = input.required<(value: number) => string>();
  readonly formatAxis = input<(value: number) => string>();
  /** Dashed horizontal lines for what a value is meant to be, such as the encoder target. */
  readonly reference = input<{ value: number; label: string }[]>();
  readonly emptyLabel = input<string>("No data");
  /** Layout only: the plot grows to the height its grid row gives the panel, and is never shorter than the fixed size. */
  readonly fill = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly theme = signal<TimeChartTheme | null>(null);

  protected readonly classes = computed(() =>
    cn(
      "block min-w-0 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]",
      this.fill() && "flex flex-col",
      this.class(),
    ),
  );
  protected readonly plotClasses = computed(() =>
    cn("relative", this.fill() ? "min-h-44 flex-1" : "h-44"),
  );

  protected readonly legend = computed(() => {
    const rows = this.rows();
    const format = this.format();
    return this.series().map((item) => {
      let value: number | null = null;
      for (let index = rows.length - 1; index >= 0 && value == null; index--) {
        value = rows[index][item.id] ?? null;
      }
      return { ...item, text: value == null ? "—" : format(value) };
    });
  });

  protected readonly hasData = computed(() => hasChartData(this.rows(), this.series()));

  /** Null until the browser has resolved the theme colours, so nothing is built on the server. */
  protected readonly option = computed(() => {
    const theme = this.theme();
    if (!theme) return null;
    return buildTimeChartOption({
      rows: this.rows(),
      series: this.series(),
      from: this.from(),
      to: this.to(),
      format: this.format(),
      formatAxis: this.formatAxis(),
      reference: this.reference(),
      theme,
    });
  });

  constructor() {
    afterNextRender(() => {
      const styles = getComputedStyle(this.host);
      const read = (name: string) => styles.getPropertyValue(name).trim();
      this.theme.set({
        text: read("--color-muted-foreground"),
        grid: read("--color-border"),
        tooltipBg: read("--color-popover"),
        tooltipText: read("--color-popover-foreground"),
        tooltipMuted: read("--color-muted-foreground"),
      });
    });
  }
}
