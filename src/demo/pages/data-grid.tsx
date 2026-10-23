import { useState } from "react";
import {
  DataGrid,
  KeyValueTable,
  progressColumn,
  statusColumn,
  tagsColumn,
  type DataGridColumn,
  type StatusTone,
} from "@/ui/data-grid";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/primitives/card";

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

const COLUMNS: DataGridColumn<Guest>[] = [
  {
    id: "name",
    header: "Name",
    size: 180,
    pinned: "left",
    sortValue: (guest) => guest.name,
    cell: (guest) => (
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{guest.name}</span>
        <span className="text-[10px] text-muted-foreground">VM {guest.vmid}</span>
      </div>
    ),
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

/** The data grid on a page of its own: pinned, resizable, sortable columns and selection. */
export function DataGridPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [opened, setOpened] = useState<string | null>(null);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Registry"
        title="Data grid"
        description="One table component: column widths remembered per grid, pinned and sortable columns, and the progress, status and tags column types."
      />

      <Card>
        <CardHeader>
          <CardTitle>Guests</CardTitle>
          <CardDescription>
            Drag a header edge to resize (double-click resets it); click a header to sort.{" "}
            {selected.size} selected{opened ? `, last opened ${opened}` : ""}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataGrid
            storageKey="showcase.guests"
            layout="fixed"
            resizable
            stickyHeader
            rows={GUESTS}
            getRowId={(guest) => String(guest.vmid)}
            columns={COLUMNS}
            onRowClick={(guest) => setOpened(guest.name)}
            selection={{ selected, onChange: setSelected }}
            selectionLabel={(guest) => `Select ${guest.name}`}
            className="max-h-[24rem] overflow-auto rounded-md shadow-[var(--shadow-border)]"
            classNames={{
              table: "text-left text-xs",
              thead: "bg-card text-[10px] tracking-wide text-muted-foreground",
              headerRow: "border-b border-border",
              headerCell: "px-3 py-2 font-semibold",
              row: "cursor-pointer border-b border-border/60 transition-colors hover:bg-secondary/40 data-[selected=true]:bg-secondary/60",
              cell: "px-3 py-2.5",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key/value table</CardTitle>
          <CardDescription>
            For record and form layouts that are not one row per record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KeyValueTable
            caption="Guest configuration"
            columns={[
              { id: "key", header: "Setting", colClassName: "w-1/3" },
              { id: "value", header: "Value" },
            ]}
            classNames={{
              table: "w-full text-left text-xs",
              thead: "text-[10px] uppercase tracking-wider text-muted-foreground",
              headerRow: "border-b border-border",
              headerCell: "px-3 py-2 font-semibold",
            }}
          >
            {[
              ["Cores", "4"],
              ["Memory", "8 GiB"],
              ["Boot order", "scsi0, net0"],
            ].map(([key, value]) => (
              <KeyValueTable.Row key={key} className="border-b border-border/60 last:border-0">
                <KeyValueTable.Key className="px-3 py-2 font-medium text-muted-foreground">
                  {key}
                </KeyValueTable.Key>
                <KeyValueTable.Cell className="px-3 py-2 font-mono">{value}</KeyValueTable.Cell>
              </KeyValueTable.Row>
            ))}
          </KeyValueTable>
        </CardContent>
      </Card>
    </PageShell>
  );
}
