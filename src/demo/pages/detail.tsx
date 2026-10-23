import { useParams } from "@tanstack/react-router";
import { Boxes, Copy, Pause, Play, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  DetailEmpty,
  DetailSection,
  DetailShell,
  OverviewPanel,
  OverviewRow,
  type DetailTabDefinition,
} from "@/ui/detail-shell";
import { Field, NumberInput, SwitchField } from "@/ui/form";
import { notify } from "@/ui/notify";
import { Button } from "@/ui/primitives/button";
import { StatusBadge } from "@/ui/status";
import { statusLabel } from "@/ui/status-text";
import { formatBytes, formatDuration } from "@/ui/utils";
import { type DemoItem, demoItems } from "../data";

type TabId = "overview" | "settings" | "jobs";

const TABS: readonly DetailTabDefinition<TabId>[] = [
  { id: "overview", label: "Overview" },
  { id: "settings", label: "Settings" },
  // No count: the tab shows the empty state, and a count would contradict it.
  { id: "jobs", label: "Jobs" },
];

/** The detail frame: a title bar, a tab strip, an action rail and a footer. */
export function DetailPage() {
  // `strict: false` keeps this showcase free of route-id plumbing.
  const params = useParams({ strict: false }) as { id?: string };
  const item = demoItems.find((row) => row.id === params.id) ?? demoItems[0];
  // Keyed, so moving to another item starts its tabs and settings afresh.
  return <ItemDetail key={item.id} item={item} />;
}

function ItemDetail({ item }: { item: DemoItem }) {
  const [tab, setTab] = useState<TabId>("overview");
  const [workers, setWorkers] = useState(item.id === "itm-01" ? 4 : 2);
  const [paused, setPaused] = useState(false);
  const state = paused ? "stopped" : item.state;

  return (
    <DetailShell
      icon={<Boxes />}
      title={item.name}
      subtitle={
        <>
          {item.owner} · <span className="font-mono">{item.id}</span>
        </>
      }
      badge={<StatusBadge state={state} />}
      tabs={TABS}
      activeTab={tab}
      onActiveTabChange={setTab}
      onRefresh={() => notify.success("Refreshed")}
      actions={[
        {
          id: "toggle",
          label: paused ? "Resume" : "Pause",
          icon: paused ? Play : Pause,
          variant: "primary",
          onClick: () => {
            setPaused((value) => !value);
            notify.success(paused ? "Resumed" : "Paused");
          },
        },
        {
          id: "duplicate",
          label: "Duplicate",
          icon: Copy,
          onClick: () => notify.created("Item"),
        },
        {
          id: "restart",
          label: "Restart",
          icon: RefreshCw,
          onClick: () => notify.success("Restarted"),
        },
        {
          id: "delete",
          label: "Delete",
          icon: Trash2,
          variant: "danger",
          disabled: state === "running",
          onClick: () => notify.deleted("Item"),
        },
      ]}
      footer={
        <>
          <span>Created 12 days ago</span>
          <span className="font-mono">{formatBytes(item.bytes)} stored</span>
        </>
      }
    >
      {tab === "overview" ? (
        <div className="grid gap-4 p-4">
          <DetailSection title="Summary">
            <OverviewPanel>
              <OverviewRow label="State" value={statusLabel(state)} />
              <OverviewRow label="Owner" value={item.owner} />
              <OverviewRow
                label="Uptime"
                value={!paused && item.uptimeMs ? formatDuration(item.uptimeMs) : "—"}
              />
              <OverviewRow label="Stored" value={formatBytes(item.bytes)} />
              <OverviewRow label="Reference" copy={item.id} mono value={item.id} />
            </OverviewPanel>
          </DetailSection>
          <DetailSection
            title="Recent events"
            action={
              <Button size="sm" variant="ghost" onClick={() => notify.success("Exported")}>
                Export
              </Button>
            }
          >
            <OverviewPanel>
              <OverviewRow label="16:04" value="Worker started" />
              <OverviewRow label="16:05" value="Destination connected" />
              <OverviewRow label="16:31" value="Report received" />
            </OverviewPanel>
          </DetailSection>
        </div>
      ) : null}

      {tab === "settings" ? (
        <div className="grid max-w-2xl gap-4 p-4">
          <Field label="Workers" hint="How many run at once for this item.">
            <NumberInput
              value={workers}
              onChange={setWorkers}
              min={1}
              max={16}
              aria-label="Workers"
            />
          </Field>
          <SwitchField
            checked={paused}
            onCheckedChange={setPaused}
            label="Paused"
            description="A paused item keeps its settings and runs nothing."
          />
        </div>
      ) : null}

      {tab === "jobs" ? (
        <DetailEmpty>
          <Boxes className="size-5 text-muted-foreground" />
          <p>No jobs have run for this item yet.</p>
          <Button size="sm" variant="secondary" onClick={() => notify.created("Job")}>
            Run a job
          </Button>
        </DetailEmpty>
      ) : null}
    </DetailShell>
  );
}
