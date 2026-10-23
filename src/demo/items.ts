/** Sample rows for the showcase pages; nothing in this file ships in the registry. */

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
