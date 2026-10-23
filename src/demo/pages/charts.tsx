import { Activity, Timer, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Sparkline, StateTimeline, TimeChart } from "@/ui/charts";
import { RANGES, seriesColor, type RangeId } from "@/ui/chart-format";
import { PageHeader } from "@/ui/page-header";
import { PageShell } from "@/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/primitives/card";
import { Tabs, TabsList, TabsTrigger } from "@/ui/primitives/tabs";
import { chartRows, TIMELINE_STEP_MS, timelineRows } from "../data";

const TIMELINE_ROWS = timelineRows();

/** The chart set: one range control, one line chart, one trend line, one timeline. */
export function ChartsPage() {
  const [now] = useState(() => Date.now());
  const [range, setRange] = useState<RangeId>("15m");
  const seconds = RANGES.find((item) => item.id === range)?.seconds ?? 900;
  const from = now - seconds * 1000;
  const rows = chartRows(from, now);

  return (
    <PageShell gap="loose">
      <PageHeader
        kicker="Metrics"
        title="Charts"
        description="Time series, trend lines and state strips, with the range passed in as a prop."
        actions={
          <Tabs value={range} onValueChange={(value) => setRange(value as RangeId)}>
            <TabsList>
              {RANGES.map((item) => (
                <TabsTrigger key={item.id} value={item.id}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <TimeChart
          title="Throughput"
          icon={<TrendingUp />}
          description={`Per second, last ${seconds / 60} minutes`}
          rows={rows}
          series={[{ id: "throughput", name: "Throughput", color: seriesColor(0) }]}
          from={from}
          to={now}
          format={(value) => `${value} MB/s`}
          formatAxis={(value) => `${value}`}
          reference={[{ value: 240, label: "Target" }]}
        />
        <TimeChart
          title="Latency"
          icon={<Timer />}
          description="Round trip per region"
          rows={rows}
          series={[
            { id: "latency", name: "US", color: seriesColor(1) },
            { id: "latencyEu", name: "EU", color: seriesColor(2) },
          ]}
          from={from}
          to={now}
          format={(value) => `${value} ms`}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TimeChart
          title="No samples yet"
          icon={<Activity />}
          description="What a panel shows before the first report arrives"
          rows={[]}
          series={[{ id: "throughput", name: "Throughput", color: seriesColor(0) }]}
          from={from}
          to={now}
          format={(value) => `${value} MB/s`}
          emptyLabel="Waiting for the first report from the worker."
        />
        <Card>
          <CardHeader>
            <CardTitle>Trend lines</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {[
              { label: "Steady", values: [12, 13, 12, 14, 13, 15, 14, 16] },
              { label: "Rising", values: [4, 8, 12, 18, 24, 32, 41, 52] },
              { label: "With a gap, then stopped", values: [30, 28, 26, 24, null, null, 6, 2] },
              { label: "Not enough to draw", values: [7, null] },
            ].map((example) => (
              <div key={example.label} className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">{example.label}</span>
                <Sparkline values={example.values} label={`${example.label} trend`} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <StateTimeline
        title="State, last hour"
        rows={TIMELINE_ROWS}
        from={now - TIMELINE_ROWS[0].states.length * TIMELINE_STEP_MS}
        to={now}
        stepMs={TIMELINE_STEP_MS}
      />
    </PageShell>
  );
}
