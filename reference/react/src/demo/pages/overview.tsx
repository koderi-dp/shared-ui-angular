import { Link } from "@tanstack/react-router";
import { Plus, RefreshCw, Rows3, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Sparkline, StateTimeline, TimeChart } from "@/ui/charts";
import { seriesColor } from "@/ui/chart-format";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { useCommands } from "@/ui/layout/command-palette-state";
import { ListFilterBar } from "@/ui/list-filter-bar";
import { notify } from "@/ui/notify";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Button } from "@/ui/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/primitives/card";
import { Switch } from "@/ui/primitives/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/primitives/table";
import { StatusBadge } from "@/ui/status";
import { usePersisted } from "@/ui/use-persisted";
import { cn, formatBytes, formatDuration } from "@/ui/utils";
import {
  chartRows,
  type DemoItem,
  demoItems,
  demoStates,
  TIMELINE_STEP_MS,
  timelineRows,
} from "../data";

const TIMELINE_ROWS = timelineRows();
const SERIES = [
  { id: "latency", name: "US", color: seriesColor(1) },
  { id: "latencyEu", name: "EU", color: seriesColor(2) },
];

/** What a list page looks like: a header, filters, a table, and metrics under it. */
export function OverviewPage() {
  // A fixed window, so the charts do not shift on every render.
  const [now] = useState(() => Date.now());
  const [filter, setFilter] = useState("");
  const [dense, setDense] = usePersisted("showcase.denseRows", false);
  const [items, setItems] = useState(demoItems);
  // Kept after the dialog closes, so its title does not change while it fades out.
  const [pendingDelete, setPendingDelete] = useState<DemoItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  // The cell's own padding sets the row height, so dense trims it as well as the height.
  const cell = dense ? "h-8 py-1" : undefined;

  const commands = useMemo(
    () => [
      {
        id: "new-item",
        label: "New item",
        group: "Actions",
        icon: Plus,
        description: "Create an item",
        run: () => notify.created("Item"),
      },
      {
        id: "dense-rows",
        label: dense ? "Use comfortable rows" : "Use dense rows",
        group: "Actions",
        icon: Rows3,
        keywords: ["table", "compact"],
        run: () => setDense(!dense),
      },
    ],
    [dense, setDense],
  );
  useCommands(commands);

  const query = filter.trim().toLowerCase();
  const rows = query
    ? items.filter((item) =>
        [item.name, item.owner, item.state].some((field) => field.toLowerCase().includes(query)),
      )
    : items;

  const from = now - TIMELINE_ROWS[0].states.length * TIMELINE_STEP_MS;
  const running = items.filter((item) => item.state === "running").length;
  const stored = items.reduce((total, item) => total + item.bytes, 0);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Showcase"
        title="Overview"
        description="A list page with its metrics: the pieces every screen in these starters is built from."
        actions={
          <>
            <Button
              icon={RefreshCw}
              variant="secondary"
              onClick={() => notify.success("Refreshed")}
            >
              Refresh
            </Button>
            <Button icon={Plus} onClick={() => notify.created("Item")}>
              New item
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">{items.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Running</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">
              {running}
              <span className="text-base text-muted-foreground">/{items.length}</span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Stored</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-medium tabular-nums">{formatBytes(stored)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">Row spacing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2.5">
              <Switch
                id="dense-rows"
                checked={dense}
                onCheckedChange={setDense}
                aria-label="Dense rows"
              />
              <label htmlFor="dense-rows" className="text-sm text-muted-foreground">
                Dense, and remembered after a reload
              </label>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4">
        <ListFilterBar
          value={filter}
          onChange={setFilter}
          placeholder="Filter by name, owner or state…"
        />
        <div className="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Stored</TableHead>
                <TableHead className="text-right">Uptime</TableHead>
                <TableHead>Trend</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className={cell}>
                    <Link
                      to="/detail/$id"
                      params={{ id: item.id }}
                      className="font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                      {item.id}
                    </span>
                  </TableCell>
                  <TableCell className={cell}>{item.owner}</TableCell>
                  <TableCell className={cell}>
                    <StatusBadge state={item.state} />
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", cell)}>
                    {formatBytes(item.bytes)}
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", cell)}>
                    {item.uptimeMs ? formatDuration(item.uptimeMs) : "—"}
                  </TableCell>
                  <TableCell className={cell}>
                    <Sparkline values={item.history} label={`${item.name} throughput, last hour`} />
                  </TableCell>
                  <TableCell className={cell}>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={`Delete ${item.name}`}
                      title={`Delete ${item.name}`}
                      onClick={() => {
                        setPendingDelete(item);
                        setConfirmOpen(true);
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {rows.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {items.length === 0 ? "No items left." : `Nothing matches “${filter}”.`}
            </p>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TimeChart
          title="Latency"
          icon={<RefreshCw />}
          description="Round trip per region, last hour"
          rows={chartRows(from, now)}
          series={SERIES}
          from={from}
          to={now}
          format={(value) => `${value} ms`}
        />
        <StateTimeline
          title="State, last hour"
          rows={TIMELINE_ROWS}
          from={from}
          to={now}
          stepMs={TIMELINE_STEP_MS}
          states={demoStates}
          idleLabel="Not running"
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${pendingDelete?.name ?? "item"}?`}
        description="The item and its history are removed. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          if (!pendingDelete) return;
          setItems((current) => current.filter((item) => item.id !== pendingDelete.id));
          notify.deleted(pendingDelete.name);
          setConfirmOpen(false);
        }}
      />
    </PageShell>
  );
}
