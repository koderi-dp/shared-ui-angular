import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core";
import { lucideActivity, lucideTimer, lucideTrendingUp } from "@ng-icons/lucide";
import { RANGES, seriesColor, type RangeId } from "@/ui/chart-format";
import { KoSparkline } from "@/ui/sparkline.component";
import { KoStateTimeline } from "@/ui/state-timeline.component";
import { KoTimeChart } from "@/ui/time-chart.component";
import { KoPageHeader } from "@/ui/page-header.component";
import { KoPageShell } from "@/ui/page-shell.component";
import { KoCard, KoCardContent, KoCardHeader, KoCardTitle } from "@/ui/primitives/card.component";
import { KoTabs, KoTabsList, KoTabsTrigger } from "@/ui/primitives/tabs.component";
import { chartRows, TIMELINE_STEP_MS, timelineRows } from "@/demo/data";

const TIMELINE_ROWS = timelineRows();

/** The chart set: one range control, one line chart, one trend line, one timeline. */
@Component({
  selector: "ko-charts-page",
  imports: [
    KoPageShell,
    KoPageHeader,
    KoTabs,
    KoTabsList,
    KoTabsTrigger,
    KoTimeChart,
    KoSparkline,
    KoStateTimeline,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Metrics"
        title="Charts"
        description="Time series, trend lines and state strips, with the range passed in as a prop."
      >
        <ko-tabs koActions [(value)]="range">
          <ko-tabs-list>
            @for (item of ranges; track item.id) {
              <button koTabsTrigger [value]="item.id">{{ item.label }}</button>
            }
          </ko-tabs-list>
        </ko-tabs>
      </ko-page-header>

      <div class="grid gap-4 xl:grid-cols-2">
        <ko-time-chart
          title="Throughput"
          [icon]="icons.trend"
          [description]="'Per second, last ' + seconds() / 60 + ' minutes'"
          [rows]="rows()"
          [series]="throughputSeries"
          [from]="from()"
          [to]="now"
          [format]="mbps"
          [formatAxis]="plain"
          [reference]="target"
        />
        <ko-time-chart
          title="Latency"
          [icon]="icons.timer"
          description="Round trip per region"
          [rows]="rows()"
          [series]="latencySeries"
          [from]="from()"
          [to]="now"
          [format]="ms"
        />
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <ko-time-chart
          title="No samples yet"
          [icon]="icons.activity"
          description="What a panel shows before the first report arrives"
          [rows]="[]"
          [series]="throughputSeries"
          [from]="from()"
          [to]="now"
          [format]="mbps"
          emptyLabel="Waiting for the first report from the worker."
        />
        <ko-card>
          <ko-card-header>
            <ko-card-title>Trend lines</ko-card-title>
          </ko-card-header>
          <ko-card-content class="grid gap-4">
            @for (example of trends; track example.label) {
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-muted-foreground">{{ example.label }}</span>
                <ko-sparkline [values]="example.values" [label]="example.label + ' trend'" />
              </div>
            }
          </ko-card-content>
        </ko-card>
      </div>

      <ko-state-timeline
        title="State, last hour"
        [rows]="timeline"
        [from]="now - timeline[0].states.length * stepMs"
        [to]="now"
        [stepMs]="stepMs"
      />
    </ko-page-shell>
  `,
})
export class KoChartsPage {
  protected readonly ranges = RANGES;
  protected readonly icons = {
    trend: lucideTrendingUp,
    timer: lucideTimer,
    activity: lucideActivity,
  };
  protected readonly now = Date.now();
  protected readonly range = signal<RangeId>("15m");
  protected readonly seconds = computed(
    () => RANGES.find((item) => item.id === this.range())?.seconds ?? 900,
  );
  protected readonly from = computed(() => this.now - this.seconds() * 1000);
  protected readonly rows = computed(() => chartRows(this.from(), this.now));

  protected readonly throughputSeries = [
    { id: "throughput", name: "Throughput", color: seriesColor(0) },
  ];
  protected readonly latencySeries = [
    { id: "latency", name: "US", color: seriesColor(1) },
    { id: "latencyEu", name: "EU", color: seriesColor(2) },
  ];
  protected readonly target = [{ value: 240, label: "Target" }];
  protected readonly mbps = (value: number) => `${value} MB/s`;
  protected readonly ms = (value: number) => `${value} ms`;
  protected readonly plain = (value: number) => `${value}`;

  protected readonly trends: { label: string; values: (number | null)[] }[] = [
    { label: "Steady", values: [12, 13, 12, 14, 13, 15, 14, 16] },
    { label: "Rising", values: [4, 8, 12, 18, 24, 32, 41, 52] },
    { label: "With a gap, then stopped", values: [30, 28, 26, 24, null, null, 6, 2] },
    { label: "Not enough to draw", values: [7, null] },
  ];
  protected readonly timeline = TIMELINE_ROWS;
  protected readonly stepMs = TIMELINE_STEP_MS;
}
