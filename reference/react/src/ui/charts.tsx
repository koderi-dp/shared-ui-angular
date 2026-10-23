import type { ReactNode } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { clockTime, timeTicks } from "@/ui/chart-format";
import { cn } from "@/ui/utils";

const AXIS = "#8b909c";
const GRID = "rgb(236 238 242 / 8%)";

export type ChartSeries = { id: string; name: string; color: string };
export type ChartRow = { t: number } & Record<string, number | null>;

type TooltipEntry = { dataKey?: string | number; value?: number | string | null; color?: string };

/** Crosshair tooltip: the time, then one row per series with its swatch, name and value. */
function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: number;
  series: ChartSeries[];
  format: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0 || label == null) return null;
  const rows = series
    .map((item) => ({ item, entry: payload.find((entry) => entry.dataKey === item.id) }))
    .filter((row) => row.entry && row.entry.value != null);
  if (rows.length === 0) return null;
  return (
    <div className="rounded-md bg-popover px-2.5 py-2 text-xs shadow-[var(--shadow-elevated)]">
      <div className="mb-1 font-mono text-[11px] text-muted-foreground">{clockTime(label)}</div>
      <div className="grid gap-1">
        {rows.map(({ item, entry }) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className="size-2 shrink-0 rounded-sm"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{item.name}</span>
            <span className="font-mono tabular-nums">{format(Number(entry?.value))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A line chart over time with one line per series, in the frame Pylon's metric panels
 * use. The legend is always shown for two or more series and carries each one's latest
 * value, so nothing has to be read off the tooltip.
 */
export function TimeChart({
  title,
  icon,
  description,
  rows,
  series,
  from,
  to,
  format,
  formatAxis = format,
  reference,
  emptyLabel = "No samples in this range yet.",
  fill = false,
  className,
}: {
  title: string;
  icon: ReactNode;
  description?: string;
  rows: ChartRow[];
  series: ChartSeries[];
  from: number;
  to: number;
  format: (value: number) => string;
  formatAxis?: (value: number) => string;
  /** Dashed horizontal lines for what a value is meant to be, such as the encoder target. */
  reference?: { value: number; label: string }[];
  emptyLabel?: string;
  /** The plot grows to the height its grid row gives the panel, and is never shorter than the fixed size. */
  fill?: boolean;
  className?: string;
}) {
  const latest = (id: string) => {
    for (let index = rows.length - 1; index >= 0; index--) {
      const value = rows[index][id];
      if (value != null) return value;
    }
    return null;
  };
  const hasData = rows.some((row) => series.some((item) => row[item.id] != null));
  const axis = timeTicks(from, to);

  return (
    <section
      className={cn(
        "min-w-0 rounded-xl bg-card p-4 shadow-[var(--shadow-border)]",
        fill && "flex flex-col",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium">{title}</h3>
          {description ? (
            <p className="truncate text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {series.length === 1 ? (
          <span className="shrink-0 text-sm tabular-nums">
            {latest(series[0].id) == null ? "—" : format(latest(series[0].id) as number)}
          </span>
        ) : null}
      </div>
      {series.length > 1 ? (
        <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {series.map((item) => {
            const value = latest(item.id);
            return (
              <li key={item.id} className="flex min-w-0 items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="truncate text-muted-foreground">{item.name}</span>
                <span className="font-mono tabular-nums">
                  {value == null ? "—" : format(value)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
      {/* The content is positioned so it takes the plot's height without adding to it. */}
      <div
        className={cn("relative", fill ? "min-h-44 flex-1" : "h-44")}
        role="img"
        aria-label={`${title} over time`}
      >
        {!hasData ? (
          <div className="absolute inset-0 grid place-items-center rounded-lg bg-inset text-xs text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <ResponsiveContainer className="absolute inset-0" width="100%" height="100%">
            {/* The right margin leaves room for half a time label at the last tick. */}
            <LineChart data={rows} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={[from, to]}
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: GRID }}
                ticks={axis.ticks}
                tickFormatter={(value: number) => clockTime(value, axis.withSeconds)}
                minTickGap={24}
              />
              <YAxis
                domain={[0, "auto"]}
                tick={{ fill: AXIS, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxis}
                width={52}
                allowDecimals
              />
              <Tooltip
                cursor={{ stroke: "rgb(236 238 242 / 25%)" }}
                isAnimationActive={false}
                content={<ChartTooltip series={series} format={format} />}
              />
              {(reference ?? []).map((line) => (
                <ReferenceLine
                  key={`${line.label}:${line.value}`}
                  y={line.value}
                  stroke={AXIS}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                  label={{
                    value: line.label,
                    position: "insideTopRight",
                    fill: AXIS,
                    fontSize: 10,
                  }}
                />
              ))}
              {series.map((item) => (
                <Line
                  key={item.id}
                  type="linear"
                  dataKey={item.id}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: item.color, stroke: "#12141a", strokeWidth: 2 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}

/**
 * A tiny trend line for a table cell, drawn as plain SVG. A null value breaks the
 * line: the thing was not running then. The cell's number beside it is the value;
 * this only shows whether it has been steady.
 */
export function Sparkline({
  values,
  label,
  className,
}: {
  values: (number | null)[];
  label: string;
  className?: string;
}) {
  const width = 72;
  const height = 20;
  const present = values.filter((value): value is number => value != null);
  if (present.length < 2) {
    return <span className={cn("inline-block h-5 w-[72px]", className)} aria-hidden />;
  }
  const max = Math.max(...present, 1);
  const step = width / Math.max(1, values.length - 1);
  let path = "";
  let drawing = false;
  values.forEach((value, index) => {
    if (value == null) {
      drawing = false;
      return;
    }
    const x = (index * step).toFixed(1);
    const y = (height - 2 - (value / max) * (height - 4)).toFixed(1);
    path += `${drawing ? "L" : "M"}${x} ${y}`;
    drawing = true;
  });
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={label}
      className={cn("inline-block shrink-0 text-signal", className)}
    >
      <title>{label}</title>
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type TimelineState = { className: string; label: string };

/** The states a timeline knows by default. Pass `states` for an app's own words. */
const DEFAULT_STATES: Record<string, TimelineState> = {
  running: { className: "bg-online", label: "Up" },
  starting: { className: "bg-warn/60", label: "Starting" },
  reconnecting: { className: "bg-warn", label: "Retrying" },
  failed: { className: "bg-danger", label: "Failed" },
};

/**
 * One strip per item: up, retrying or failed over the range. Steps with
 * the same state are merged into one block, and hovering a block gives its times.
 */
export function StateTimeline({
  title = "State",
  rows,
  from,
  to,
  stepMs,
  states = DEFAULT_STATES,
  idleLabel = "Not running",
}: {
  title?: string;
  /** One state per step of `stepMs` from `from`; null where there was nothing. */
  rows: { id: string; name: string; states: (string | null)[] }[];
  from: number;
  to: number;
  stepMs: number;
  /** Colour and legend word per state. A state not listed is drawn grey under its own name. */
  states?: Record<string, TimelineState>;
  idleLabel?: string;
}) {
  const span = Math.max(1, to - from);
  return (
    <section className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {Object.entries(states).map(([state, tone]) => (
            <li key={state} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-sm", tone.className)} aria-hidden />
              {tone.label}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-sm bg-inset shadow-[var(--shadow-border)]"
              aria-hidden
            />
            {idleLabel}
          </li>
        </ul>
      </div>
      <div className="grid gap-2">
        {rows.map((row) => {
          const blocks: { state: string; start: number; end: number }[] = [];
          row.states.forEach((state, index) => {
            if (!state) return;
            const start = from + index * stepMs;
            const last = blocks[blocks.length - 1];
            if (last && last.state === state && last.end === start) {
              last.end = start + stepMs;
            } else {
              blocks.push({ state, start, end: start + stepMs });
            }
          });
          return (
            <div
              key={row.id}
              className="grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] items-center gap-3"
            >
              <span className="truncate text-xs text-muted-foreground">{row.name}</span>
              <div className="relative h-3 overflow-hidden rounded-sm bg-inset shadow-[var(--shadow-border)]">
                {blocks.map((block) => {
                  const tone = states[block.state] ?? {
                    className: "bg-offline",
                    label: block.state,
                  };
                  return (
                    <span
                      key={block.start}
                      title={`${tone.label} · ${clockTime(block.start)} to ${clockTime(Math.min(block.end, to))}`}
                      className={cn("absolute inset-y-0", tone.className)}
                      style={{
                        left: `${((block.start - from) / span) * 100}%`,
                        width: `${Math.max(0.3, ((block.end - block.start) / span) * 100)}%`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)] gap-3 font-mono text-[10px] text-muted-foreground">
        <span />
        <span className="flex justify-between">
          <span>{clockTime(from, false)}</span>
          <span>{clockTime(to, false)}</span>
        </span>
      </div>
    </section>
  );
}
