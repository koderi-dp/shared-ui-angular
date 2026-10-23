import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type TemplateRef,
  viewChild,
} from "@angular/core";
import {
  type DataGridColumn,
  KoDataGrid,
  KoKeyValueTable,
  progressColumn,
  type StatusTone,
  statusColumn,
  tagsColumn,
} from "@koderi-dp/ui/data-grid";
import {
  KoPageHeader,
  KoPageShell,
  KoCard,
  KoCardContent,
  KoCardDescription,
  KoCardHeader,
  KoCardTitle,
} from "@koderi-dp/ui";

type Guest = {
  vmid: number;
  name: string;
  status: "running" | "stopped" | "paused";
  cpu: number;
  memory: number;
  disk: number;
  tags: string[];
};

const GUESTS: Guest[] = [
  {
    vmid: 100,
    name: "atlas",
    status: "running",
    cpu: 12,
    memory: 48,
    disk: 31,
    tags: ["prod", "web"],
  },
  {
    vmid: 101,
    name: "borealis",
    status: "running",
    cpu: 87,
    memory: 91,
    disk: 64,
    tags: ["prod", "db", "backup", "eu-west", "critical"],
  },
  { vmid: 102, name: "cinder", status: "stopped", cpu: 0, memory: 0, disk: 12, tags: ["staging"] },
  { vmid: 103, name: "dune", status: "paused", cpu: 3, memory: 22, disk: 77, tags: [] },
  {
    vmid: 104,
    name: "ember",
    status: "running",
    cpu: 54,
    memory: 66,
    disk: 93,
    tags: ["ci", "runner", "linux", "docker"],
  },
  { vmid: 105, name: "fjord", status: "running", cpu: 7, memory: 35, disk: 40, tags: ["dev"] },
];

const STATUS_TONE: Record<Guest["status"], StatusTone> = {
  running: "live",
  paused: "warning",
  stopped: "neutral",
};

const pct = (value: number) => ({ percent: value, label: `${value}%` });

const SETTINGS = [
  ["Cores", "4"],
  ["Memory", "8 GiB"],
  ["Boot order", "scsi0, net0"],
] as const;

/** The data grid on a page of its own: pinned, resizable, sortable columns and selection. */
@Component({
  selector: "ko-data-grid-page",
  imports: [
    KoPageShell,
    KoPageHeader,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardDescription,
    KoCardContent,
    KoDataGrid,
    KoKeyValueTable,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Registry"
        title="Data grid"
        description="One table component: column widths remembered per grid, pinned and sortable columns, and the progress, status and tags column types."
      />

      <ko-card>
        <ko-card-header>
          <ko-card-title>Guests</ko-card-title>
          <ko-card-description>
            Drag a header edge to resize (double-click resets it); click a header to sort.
            {{ selected().size }} selected{{ opened() ? ", last opened " + opened() : "" }}.
          </ko-card-description>
        </ko-card-header>
        <ko-card-content>
          <ko-data-grid
            storageKey="showcase.guests"
            layout="fixed"
            resizable
            stickyHeader
            [rows]="guests"
            [getRowId]="getRowId"
            [columns]="columns()"
            [selection]="selected()"
            [selectionLabel]="selectionLabel"
            class="max-h-[24rem] overflow-auto rounded-md shadow-[var(--shadow-border)]"
            [classNames]="classNames"
            (rowClick)="opened.set($event.name)"
            (selectionChange)="selected.set($event)"
          />
          <ng-template #nameCell let-guest>
            <div class="flex flex-col">
              <span class="font-medium text-foreground">{{ guest.name }}</span>
              <span class="text-[10px] text-muted-foreground">VM {{ guest.vmid }}</span>
            </div>
          </ng-template>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Key/value table</ko-card-title>
          <ko-card-description>
            For record and form layouts that are not one row per record.
          </ko-card-description>
        </ko-card-header>
        <ko-card-content>
          <ko-key-value-table
            caption="Guest configuration"
            [columns]="kvColumns"
            [classNames]="kvClassNames"
          >
            @for (setting of settings; track setting[0]) {
              <tr class="border-b border-border/60 last:border-0">
                <th scope="row" class="px-3 py-2 font-medium text-muted-foreground">
                  {{ setting[0] }}
                </th>
                <td class="px-3 py-2 font-mono">{{ setting[1] }}</td>
              </tr>
            }
          </ko-key-value-table>
        </ko-card-content>
      </ko-card>
    </ko-page-shell>
  `,
})
export class KoDataGridPage {
  protected readonly guests = GUESTS;
  protected readonly settings = SETTINGS;
  protected readonly selected = signal<Set<string>>(new Set());
  protected readonly opened = signal<string | null>(null);
  protected readonly getRowId = (guest: Guest) => String(guest.vmid);
  protected readonly selectionLabel = (guest: Guest) => `Select ${guest.name}`;

  private readonly nameCell = viewChild.required<TemplateRef<{ $implicit: Guest }>>("nameCell");

  protected readonly columns = computed<DataGridColumn<Guest>[]>(() => {
    const nameCell = this.nameCell();
    return [
      {
        id: "name",
        header: "Name",
        size: 180,
        pinned: "left",
        sortValue: (guest) => guest.name,
        cell: () => nameCell,
      },
      statusColumn<Guest>({
        id: "status",
        header: "Status",
        size: 110,
        status: (guest) => guest.status,
        tone: (status) => STATUS_TONE[status as Guest["status"]],
        style: "dot",
        sortable: true,
      }),
      progressColumn<Guest>({
        id: "cpu",
        header: "CPU",
        size: 140,
        variant: "cpu",
        value: (guest) => pct(guest.cpu),
        sortValue: (guest) => guest.cpu,
      }),
      progressColumn<Guest>({
        id: "memory",
        header: "Memory",
        size: 140,
        variant: "memory",
        value: (guest) => pct(guest.memory),
        sortValue: (guest) => guest.memory,
        hideBelow: "md",
      }),
      progressColumn<Guest>({
        id: "disk",
        header: "Disk",
        size: 140,
        variant: "disk",
        value: (guest) => pct(guest.disk),
        sortValue: (guest) => guest.disk,
        hideBelow: "lg",
      }),
      tagsColumn<Guest>({ id: "tags", header: "Tags", size: 200, tags: (guest) => guest.tags }),
    ];
  });

  protected readonly classNames = {
    table: "text-left text-xs",
    thead: "bg-card text-[10px] tracking-wide text-muted-foreground",
    headerRow: "border-b border-border",
    headerCell: "px-3 py-2 font-semibold",
    row: "cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40 data-[selected=true]:bg-secondary/60",
    cell: "px-3 py-2.5",
  };

  protected readonly kvColumns = [
    { id: "key", header: "Setting", colClassName: "w-1/3" },
    { id: "value", header: "Value" },
  ];

  protected readonly kvClassNames = {
    table: "w-full text-left text-xs",
    thead: "text-[10px] uppercase tracking-wider text-muted-foreground",
    headerRow: "border-b border-border",
    headerCell: "px-3 py-2 font-semibold",
  };
}
