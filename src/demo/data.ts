import type { ChartRow, TimelineState } from "@/ui/charts";

/** Everything on the showcase pages is made up here; nothing in this file ships in the registry. */

export type DemoItem = {
  id: string;
  name: string;
  owner: string;
  state: string;
  bytes: number;
  uptimeMs: number;
  history: number[];
};

export const demoItems: DemoItem[] = [
  {
    id: "itm-01",
    name: "Nightly ingest",
    owner: "Platform",
    state: "running",
    bytes: 4_812_000_000,
    uptimeMs: 9_240_000,
    history: [12, 18, 24, 21, 30, 34, 29, 38, 42, 39, 44, 48],
  },
  {
    id: "itm-02",
    name: "Partner feed",
    owner: "Data",
    state: "reconnecting",
    bytes: 912_000_000,
    uptimeMs: 1_380_000,
    history: [40, 38, 35, 30, 12, 0, 0, 4, 18, 26, 31, 36],
  },
  {
    id: "itm-03",
    name: "Archive sweep",
    owner: "Platform",
    state: "degraded",
    bytes: 27_400_000,
    uptimeMs: 640_000,
    history: [8, 9, 7, 10, 6, 5, 4, 6, 3, 5, 4, 4],
  },
  {
    id: "itm-04",
    name: "Edge mirror",
    owner: "Infra",
    state: "failed",
    bytes: 0,
    uptimeMs: 0,
    history: [22, 24, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: "itm-05",
    name: "Weekly report",
    owner: "Finance",
    state: "stopped",
    bytes: 1_240_000,
    uptimeMs: 0,
    history: [4, 4, 5, 5, 6, 6, 3, 2, 2, 2, 1, 1],
  },
  {
    id: "itm-06",
    name: "Photo sync",
    owner: "Marketing",
    state: "starting",
    bytes: 64_000_000,
    uptimeMs: 12_000,
    history: [0, 2, 6, 12, 20, 28, 33, 41, 47, 52, 58, 61],
  },
];

/** Two series over the range, with a gap in one of them — what a null value is for. */
export function chartRows(from: number, to: number, count = 48): ChartRow[] {
  const step = (to - from) / (count - 1);
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index / 5) * 0.5 + 0.5;
    const throughput =
      index % 17 === 8 ? null : Math.round(180 + wave * 120 + (index % 5) * 6 + (index % 3) * 2);
    const latency = Math.round(40 + Math.cos(index / 7) * 18 + (index % 3) * 4);
    const latencyEu = Math.round(56 + Math.cos(index / 7 + 1) * 22 + (index % 4) * 3);
    return { t: Math.round(from + index * step), throughput, latency, latencyEu };
  });
}

const TIMELINE_STEPS: (string | null)[] = [
  ...Array(9).fill("running"),
  ...Array(4).fill("reconnecting"),
  ...Array(2).fill("failed"),
  ...Array(7).fill("running"),
  ...Array(3).fill(null),
  ...Array(5).fill("running"),
];

export const demoStates: Record<string, TimelineState> = {
  running: { className: "bg-online", label: "Up" },
  reconnecting: { className: "bg-warn", label: "Retrying" },
  failed: { className: "bg-danger", label: "Failed" },
};

export function timelineRows(): { id: string; name: string; states: (string | null)[] }[] {
  return [
    { id: "itm-01", name: "Nightly ingest", states: TIMELINE_STEPS },
    { id: "itm-02", name: "Partner feed", states: [...TIMELINE_STEPS].reverse() },
    {
      id: "itm-03",
      name: "Archive sweep",
      states: TIMELINE_STEPS.map((s, i) => (i % 7 === 0 ? null : s)),
    },
  ];
}

export const TIMELINE_STEP_MS = 60_000;
