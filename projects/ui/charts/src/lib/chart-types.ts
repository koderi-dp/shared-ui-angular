export type ChartSeries = { id: string; name: string; color: string };
export type ChartRow = { t: number } & Record<string, number | null>;
export type TimelineState = { className: string; label: string };

/** The states a timeline knows by default. Pass `states` for an app's own words. */
export const DEFAULT_TIMELINE_STATES: Record<string, TimelineState> = {
  running: { className: "bg-online", label: "Up" },
  starting: { className: "bg-warn/60", label: "Starting" },
  reconnecting: { className: "bg-warn", label: "Retrying" },
  failed: { className: "bg-danger", label: "Failed" },
};
