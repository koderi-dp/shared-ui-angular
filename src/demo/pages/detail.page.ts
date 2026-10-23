import { ChangeDetectionStrategy, Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import {
  lucideBoxes,
  lucideCopy,
  lucidePause,
  lucidePlay,
  lucideRefreshCw,
  lucideTrash2,
} from "@ng-icons/lucide";
import { NgIcon } from "@ng-icons/core";
import {
  type DetailAction,
  type DetailTabDefinition,
  KoDetailEmpty,
  KoDetailSection,
  KoDetailShell,
  KoOverviewPanel,
  KoOverviewRow,
} from "@/ui/detail-shell.component";
import { KoField, KoNumberInput, KoSwitchField } from "@/ui/form.component";
import { notify } from "@/ui/notify";
import { KoButton } from "@/ui/primitives/button.component";
import { KoStatusBadge } from "@/ui/status.component";
import { statusLabel } from "@/ui/status-text";
import { formatBytes, formatDuration } from "@/ui/utils";
import { demoItems } from "@/demo/items";

type TabId = "overview" | "settings" | "jobs";

const TABS: readonly DetailTabDefinition<TabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "settings", label: "Settings" },
  // No count: the tab shows the empty state, and a count would contradict it.
  { id: "jobs", label: "Jobs" },
];

/** The detail frame: a title bar, a tab strip, an action rail and a footer. */
@Component({
  selector: "ko-detail-page",
  imports: [
    KoDetailShell,
    KoDetailSection,
    KoDetailEmpty,
    KoOverviewPanel,
    KoOverviewRow,
    KoField,
    KoNumberInput,
    KoSwitchField,
    KoStatusBadge,
    KoButton,
    NgIcon,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-detail-shell
      class="h-dvh"
      [icon]="boxes"
      [title]="item.name"
      [tabs]="tabs"
      [actions]="actions()"
      [(activeTab)]="tab"
      refreshable
      (refresh)="refresh()"
    >
      <span koSubtitle
        >{{ item.owner }} · <span class="font-mono">{{ item.id }}</span></span
      >
      <ko-status-badge koBadge [state]="state()" />

      @switch (tab()) {
        @case ("overview") {
          <div class="grid gap-4 p-4">
            <ko-detail-section title="Summary">
              <ko-overview-panel>
                <ko-overview-row label="State" [value]="stateLabel()" />
                <ko-overview-row label="Owner" [value]="item.owner" />
                <ko-overview-row label="Uptime" [value]="uptime()" />
                <ko-overview-row label="Stored" [value]="stored" />
                <ko-overview-row label="Reference" mono [copy]="item.id" [value]="item.id" />
              </ko-overview-panel>
            </ko-detail-section>
            <ko-detail-section title="Recent events">
              <button koAction koButton size="sm" variant="ghost" (click)="exported()">
                Export
              </button>
              <ko-overview-panel>
                <ko-overview-row label="16:04" value="Worker started" />
                <ko-overview-row label="16:05" value="Destination connected" />
                <ko-overview-row label="16:31" value="Report received" />
              </ko-overview-panel>
            </ko-detail-section>
          </div>
        }
        @case ("settings") {
          <div class="grid max-w-2xl gap-4 p-4">
            <ko-field label="Workers" hint="How many run at once for this item.">
              <ko-number-input ariaLabel="Workers" [min]="1" [max]="16" [(ngModel)]="workers" />
            </ko-field>
            <ko-switch-field
              label="Paused"
              description="A paused item keeps its settings and runs nothing."
              [(checked)]="paused"
            />
          </div>
        }
        @case ("jobs") {
          <ko-detail-empty>
            <ng-icon
              aria-hidden="true"
              size="1.25rem"
              class="text-muted-foreground"
              [svg]="boxes"
            />
            <p>No jobs have run for this item yet.</p>
            <button koButton size="sm" variant="secondary" (click)="created()">Run a job</button>
          </ko-detail-empty>
        }
      }

      <span koFooter>Created 12 days ago</span>
      <span koFooter class="font-mono">{{ stored }} stored</span>
    </ko-detail-shell>
  `,
})
export class KoDetailPage {
  // `:id` picks the item; anything unknown falls back to the first.
  protected readonly item =
    demoItems.find((row) => row.id === inject(ActivatedRoute).snapshot.paramMap.get("id")) ??
    demoItems[0];

  protected readonly boxes = lucideBoxes;
  protected readonly tabs = TABS;
  protected readonly stored = formatBytes(this.item.bytes);
  protected readonly tab = signal<TabId>("overview");
  protected readonly workers = signal(this.item.id === "itm-01" ? 4 : 2);
  protected readonly paused = signal(false);
  protected readonly state = computed(() => (this.paused() ? "stopped" : this.item.state));
  protected readonly stateLabel = computed(() => statusLabel(this.state()));
  protected readonly uptime = computed(() =>
    !this.paused() && this.item.uptimeMs ? formatDuration(this.item.uptimeMs) : "—",
  );

  protected readonly actions = computed<DetailAction[]>(() => [
    {
      id: "toggle",
      label: this.paused() ? "Resume" : "Pause",
      icon: this.paused() ? lucidePlay : lucidePause,
      variant: "primary",
      run: () => {
        const wasPaused = this.paused();
        this.paused.set(!wasPaused);
        notify.success(wasPaused ? "Resumed" : "Paused");
      },
    },
    { id: "duplicate", label: "Duplicate", icon: lucideCopy, run: () => notify.created("Item") },
    {
      id: "restart",
      label: "Restart",
      icon: lucideRefreshCw,
      run: () => notify.success("Restarted"),
    },
    {
      id: "delete",
      label: "Delete",
      icon: lucideTrash2,
      variant: "danger",
      disabled: this.state() === "running",
      run: () => notify.deleted("Item"),
    },
  ]);

  protected refresh(): void {
    notify.success("Refreshed");
  }
  protected exported(): void {
    notify.success("Exported");
  }
  protected created(): void {
    notify.created("Job");
  }
}
