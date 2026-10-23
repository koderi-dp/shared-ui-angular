import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { lucidePlus, lucideRefreshCw, lucideRows3, lucideTrash2 } from "@ng-icons/lucide";
import {
  chartRows,
  type DemoItem,
  demoItems,
  demoStates,
  TIMELINE_STEP_MS,
  timelineRows,
} from "@/demo/data";
import {
  seriesColor,
  KoConfirmDialog,
  KoListFilterBar,
  notify,
  KoPageHeader,
  KoPageShell,
  persisted,
  KoButton,
  KoIconButton,
  KoCard,
  KoCardContent,
  KoCardHeader,
  KoCardTitle,
  KoSwitch,
  KoTable,
  KoTableBody,
  KoTableCell,
  KoTableHead,
  KoTableHeader,
  KoTableRow,
  KoStatusBadge,
  cn,
  formatBytes,
  formatDuration,
} from "@koderi-dp/ui";
import { injectCommands } from "@koderi-dp/ui/layout";
import { KoSparkline } from "@/ui/sparkline.component";
import { KoStateTimeline } from "@/ui/state-timeline.component";
import { KoTimeChart } from "@/ui/time-chart.component";

const TIMELINE_ROWS = timelineRows();

/** What a list page looks like: a header, filters, a table, and metrics under it. */
@Component({
  selector: "ko-overview-page",
  imports: [
    RouterLink,
    KoPageShell,
    KoPageHeader,
    KoButton,
    KoIconButton,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardContent,
    KoSwitch,
    KoListFilterBar,
    KoTable,
    KoTableHeader,
    KoTableBody,
    KoTableRow,
    KoTableHead,
    KoTableCell,
    KoStatusBadge,
    KoSparkline,
    KoTimeChart,
    KoStateTimeline,
    KoConfirmDialog,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Showcase"
        title="Overview"
        description="A list page with its metrics: the pieces every screen in these starters is built from."
      >
        <button koActions koButton variant="secondary" [icon]="icons.refresh" (click)="refreshed()">
          Refresh
        </button>
        <button koActions koButton [icon]="icons.plus" (click)="created()">New item</button>
      </ko-page-header>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ko-card>
          <ko-card-header>
            <ko-card-title class="text-muted-foreground">Items</ko-card-title>
          </ko-card-header>
          <ko-card-content>
            <p class="text-2xl font-medium tabular-nums">{{ items().length }}</p>
          </ko-card-content>
        </ko-card>
        <ko-card>
          <ko-card-header>
            <ko-card-title class="text-muted-foreground">Running</ko-card-title>
          </ko-card-header>
          <ko-card-content>
            <p class="text-2xl font-medium tabular-nums">
              {{ running()
              }}<span class="text-base text-muted-foreground">/{{ items().length }}</span>
            </p>
          </ko-card-content>
        </ko-card>
        <ko-card>
          <ko-card-header>
            <ko-card-title class="text-muted-foreground">Stored</ko-card-title>
          </ko-card-header>
          <ko-card-content>
            <p class="text-2xl font-medium tabular-nums">{{ stored() }}</p>
          </ko-card-content>
        </ko-card>
        <ko-card>
          <ko-card-header>
            <ko-card-title class="text-muted-foreground">Row spacing</ko-card-title>
          </ko-card-header>
          <ko-card-content>
            <div class="flex items-center gap-2.5">
              <ko-switch id="dense-rows" aria-label="Dense rows" [(checked)]="dense" />
              <label for="dense-rows" class="text-sm text-muted-foreground">
                Dense, and remembered after a reload
              </label>
            </div>
          </ko-card-content>
        </ko-card>
      </div>

      <section class="grid gap-4">
        <ko-list-filter-bar placeholder="Filter by name, owner or state…" [(value)]="filter" />
        <div class="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          <ko-table>
            <thead koTableHeader>
              <tr koTableRow>
                <th koTableHead>Name</th>
                <th koTableHead>Owner</th>
                <th koTableHead>State</th>
                <th koTableHead class="text-right">Stored</th>
                <th koTableHead class="text-right">Uptime</th>
                <th koTableHead>Trend</th>
                <th koTableHead class="w-12"></th>
              </tr>
            </thead>
            <tbody koTableBody>
              @for (item of rows(); track item.id) {
                <tr koTableRow>
                  <td koTableCell [class]="cell()">
                    <a [routerLink]="['/detail', item.id]" class="font-medium hover:underline">{{
                      item.name
                    }}</a>
                    <span class="ml-2 font-mono text-[11px] text-muted-foreground">{{
                      item.id
                    }}</span>
                  </td>
                  <td koTableCell [class]="cell()">{{ item.owner }}</td>
                  <td koTableCell [class]="cell()"><ko-status-badge [state]="item.state" /></td>
                  <td koTableCell [class]="numeric()">{{ bytes(item.bytes) }}</td>
                  <td koTableCell [class]="numeric()">{{ uptime(item.uptimeMs) }}</td>
                  <td koTableCell [class]="cell()">
                    <ko-sparkline
                      [values]="item.history"
                      [label]="item.name + ' throughput, last hour'"
                    />
                  </td>
                  <td koTableCell [class]="cell()">
                    <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
                    <button
                      koIconButton
                      [icon]="icons.trash"
                      [label]="'Delete ' + item.name"
                      (click)="ask(item)"
                    ></button>
                  </td>
                </tr>
              }
            </tbody>
          </ko-table>
          @if (rows().length === 0) {
            <p class="px-4 py-8 text-center text-sm text-muted-foreground">
              @if (items().length === 0) {
                No items left.
              } @else {
                Nothing matches “{{ filter() }}”.
              }
            </p>
          }
        </div>
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <ko-time-chart
          title="Latency"
          [icon]="icons.refresh"
          description="Round trip per region, last hour"
          [rows]="chart"
          [series]="series"
          [from]="from"
          [to]="now"
          [format]="ms"
        />
        <ko-state-timeline
          title="State, last hour"
          idleLabel="Not running"
          [rows]="timeline"
          [from]="from"
          [to]="now"
          [stepMs]="stepMs"
          [states]="states"
        />
      </div>

      <ko-confirm-dialog
        confirmLabel="Delete"
        description="The item and its history are removed. This cannot be undone."
        destructive
        [title]="'Delete ' + (pendingDelete()?.name ?? 'item') + '?'"
        [(open)]="confirmOpen"
        (confirm)="remove()"
      />
    </ko-page-shell>
  `,
})
export class KoOverviewPage {
  protected readonly icons = {
    plus: lucidePlus,
    refresh: lucideRefreshCw,
    trash: lucideTrash2,
  };
  protected readonly series = [
    { id: "latency", name: "US", color: seriesColor(1) },
    { id: "latencyEu", name: "EU", color: seriesColor(2) },
  ];
  protected readonly timeline = TIMELINE_ROWS;
  protected readonly states = demoStates;
  protected readonly stepMs = TIMELINE_STEP_MS;
  // A fixed window, so the charts do not shift on every change.
  protected readonly now = Date.now();
  protected readonly from = this.now - TIMELINE_ROWS[0].states.length * TIMELINE_STEP_MS;
  protected readonly chart = chartRows(this.from, this.now);

  protected readonly filter = signal("");
  protected readonly dense = persisted("showcase.denseRows", false);
  protected readonly items = signal<DemoItem[]>(demoItems);
  // Kept after the dialog closes, so its title does not change while it fades out.
  protected readonly pendingDelete = signal<DemoItem | null>(null);
  protected readonly confirmOpen = signal(false);

  // The cell's own padding sets the row height, so dense trims it as well as the height.
  protected readonly cell = computed(() => (this.dense() ? "h-8 py-1" : ""));
  protected readonly numeric = computed(() => cn("text-right tabular-nums", this.cell()));
  protected readonly rows = computed(() => {
    const query = this.filter().trim().toLowerCase();
    const items = this.items();
    return query
      ? items.filter((item) =>
          [item.name, item.owner, item.state].some((field) => field.toLowerCase().includes(query)),
        )
      : items;
  });
  protected readonly running = computed(
    () => this.items().filter((item) => item.state === "running").length,
  );
  protected readonly stored = computed(() =>
    formatBytes(this.items().reduce((total, item) => total + item.bytes, 0)),
  );

  protected readonly ms = (value: number) => `${value} ms`;

  constructor() {
    injectCommands(
      computed(() => [
        {
          id: "new-item",
          label: "New item",
          group: "Actions",
          icon: lucidePlus,
          description: "Create an item",
          run: () => this.created(),
        },
        {
          id: "dense-rows",
          label: this.dense() ? "Use comfortable rows" : "Use dense rows",
          group: "Actions",
          icon: lucideRows3,
          keywords: ["table", "compact"],
          run: () => this.dense.update((dense) => !dense),
        },
      ]),
    );
  }

  protected bytes(value: number): string {
    return formatBytes(value);
  }

  protected uptime(ms: number): string {
    return ms ? formatDuration(ms) : "—";
  }

  protected ask(item: DemoItem): void {
    this.pendingDelete.set(item);
    this.confirmOpen.set(true);
  }

  protected remove(): void {
    const pending = this.pendingDelete();
    if (!pending) return;
    this.items.update((current) => current.filter((item) => item.id !== pending.id));
    notify.deleted(pending.name);
    this.confirmOpen.set(false);
  }

  protected created(): void {
    notify.created("Item");
  }

  protected refreshed(): void {
    notify.success("Refreshed");
  }
}
