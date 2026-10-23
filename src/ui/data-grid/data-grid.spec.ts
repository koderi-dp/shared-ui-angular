import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { type ComponentFixture, TestBed } from "@angular/core/testing";
import { flexRenderComponent } from "@tanstack/angular-table";
import { widthsStorageKey } from "@/ui/data-grid/column-widths";
import {
  KoDataGrid,
  KoGridEmpty,
  KoGridMobileCard,
  KoGridRowDetail,
} from "@/ui/data-grid/data-grid.component";
import { progressColumn, statusColumn, tagsColumn } from "@/ui/data-grid/columns/column-factories";
import { KoKeyValueTable } from "@/ui/data-grid/key-value-table.component";
import type { DataGridColumn } from "@/ui/data-grid/types";

type Row = { id: string; name: string; score: number | null };

const ROWS: Row[] = [
  { id: "a", name: "alpha", score: 3 },
  { id: "b", name: "bravo", score: null },
  { id: "c", name: "charlie", score: 1 },
  { id: "d", name: "delta", score: 2 },
];

@Component({
  selector: "ko-grid-action",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<button type="button">Open</button>`,
})
class ActionCell {}

const COLUMNS: DataGridColumn<Row>[] = [
  {
    id: "name",
    header: "Name",
    size: 180,
    maxSize: 300,
    sortValue: (r) => r.name,
    cell: (r) => r.name,
  },
  {
    id: "score",
    header: "Score",
    size: 100,
    align: "right",
    sortValue: (r) => r.score,
    cell: (r) => r.score ?? "-",
  },
  { id: "wide", header: "Wide", size: 120, hideBelow: "lg", cell: () => "wide" },
  { id: "action", header: "Action", size: 80, cell: () => flexRenderComponent(ActionCell) },
];

@Component({
  selector: "ko-grid-host",
  imports: [KoDataGrid, KoGridEmpty],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-data-grid
      [storageKey]="storageKey()"
      [rows]="rows()"
      [getRowId]="getRowId"
      [columns]="columns"
      layout="fixed"
      [resizable]="true"
      [emptyRow]="emptyRow()"
      [selection]="selection()"
      (selectionChange)="onSelection($event)"
      (rowClick)="clicked.push($event.id)"
    >
      <ng-template koGridEmpty>Nothing here</ng-template>
    </ko-data-grid>
  `,
})
class HostComponent {
  readonly storageKey = signal("spec.grid");
  readonly rows = signal<Row[]>(ROWS);
  readonly emptyRow = signal(false);
  readonly selection = signal<ReadonlySet<string> | undefined>(undefined);
  readonly columns = COLUMNS;
  readonly getRowId = (row: Row) => row.id;
  readonly clicked: string[] = [];
  selectionEvents = 0;

  onSelection(next: Set<string>): void {
    this.selectionEvents++;
    this.selection.set(next);
  }
}

/** A `matchMedia` that matches every `(min-width: Npx)` up to `width`. */
function stubViewport(width: number) {
  vi.stubGlobal("matchMedia", (query: string) => {
    const min = Number(/min-width:\s*(\d+)px/.exec(query)?.[1] ?? 0);
    return {
      matches: width >= min,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    };
  });
}

describe("KoDataGrid", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;

  const settle = () => fixture.whenStable();
  const headers = () => [...root.querySelectorAll<HTMLElement>("thead th")];
  const headerTexts = () => headers().map((th) => th.textContent!.trim());
  const bodyRows = () => [...root.querySelectorAll<HTMLTableRowElement>("tbody tr")];
  const column = (header: string) => headerTexts().indexOf(header);
  const names = () => bodyRows().map((tr) => tr.cells[column("Name")]!.textContent!.trim());
  const colWidth = (header: string) =>
    root.querySelectorAll<HTMLElement>("colgroup col")[column(header)]!.style.width;
  const rowCheckbox = (i: number) =>
    bodyRows()[i]!.querySelector<HTMLButtonElement>('ko-checkbox button[role="checkbox"]')!;
  const headerCheckbox = () =>
    root.querySelector<HTMLButtonElement>('thead ko-checkbox button[role="checkbox"]')!;

  const click = async (el: Element, init: MouseEventInit = {}) => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
    await settle();
  };
  const pointer = (el: Element, type: string, clientX: number) =>
    el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, clientX }));
  const handle = (header: string) =>
    headers()[column(header)]!.querySelector<HTMLElement>('[role="separator"]')!;
  const drag = async (header: string, dx: number) => {
    const el = handle(header);
    pointer(el, "pointerdown", 100);
    pointer(el, "pointermove", 100 + dx);
    pointer(el, "pointerup", 100 + dx);
    await settle();
  };

  const create = async () => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await settle();
  };

  beforeEach(async () => {
    localStorage.clear();
    stubViewport(1440);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    await create();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("sorts ascending, then descending, with nulls last both ways", async () => {
    expect(names()).toEqual(["alpha", "bravo", "charlie", "delta"]);
    const score = () => headers()[column("Score")]!;
    await click(score().querySelector("button")!);
    expect(names()).toEqual(["charlie", "delta", "alpha", "bravo"]);
    expect(score().getAttribute("aria-sort")).toBe("ascending");
    await click(score().querySelector("button")!);
    expect(names()).toEqual(["alpha", "delta", "charlie", "bravo"]);
    expect(score().getAttribute("aria-sort")).toBe("descending");
  });

  it("fires rowClick for a row click but not for a button inside the row", async () => {
    await click(bodyRows()[1]!.cells[column("Name")]!);
    expect(host.clicked).toEqual(["b"]);
    await click(bodyRows()[2]!.querySelector("ko-grid-action button")!);
    expect(host.clicked).toEqual(["b"]);
    expect(bodyRows()[0]!.className).toContain("cursor-pointer");
  });

  it("selects every row from the header and a Shift range from the row checkboxes", async () => {
    host.selection.set(new Set());
    await settle();
    expect(headerTexts()[0]).toBe("");

    await click(headerCheckbox());
    expect([...host.selection()!]).toEqual(["a", "b", "c", "d"]);
    expect(bodyRows().every((tr) => tr.dataset["selected"] === "true")).toBe(true);
    await click(headerCheckbox());
    expect(host.selection()!.size).toBe(0);

    await click(rowCheckbox(0));
    await click(rowCheckbox(3), { shiftKey: true });
    expect([...host.selection()!].sort()).toEqual(["a", "b", "c", "d"]);
    expect(host.clicked).toEqual([]);
  });

  it("keeps selection, the shift anchor and column widths when rows are replaced by copies", async () => {
    host.selection.set(new Set());
    await settle();
    await drag("Name", 40);
    expect(colWidth("Name")).toBe("220px");
    await click(rowCheckbox(0));
    expect([...host.selection()!]).toEqual(["a"]);
    const events = host.selectionEvents;

    host.rows.set(host.rows().map((row) => ({ ...row })));
    await settle();
    expect(host.selectionEvents).toBe(events);
    expect([...host.selection()!]).toEqual(["a"]);
    expect(rowCheckbox(0).getAttribute("aria-checked")).toBe("true");
    expect(colWidth("Name")).toBe("220px");

    await click(rowCheckbox(2), { shiftKey: true });
    expect([...host.selection()!].sort()).toEqual(["a", "b", "c"]);
  });

  it("resizes by drag within maxSize, resets on double-click and persists per storageKey", async () => {
    expect(colWidth("Name")).toBe("180px");
    await drag("Name", 40);
    expect(colWidth("Name")).toBe("220px");
    await drag("Name", 1000);
    expect(colWidth("Name")).toBe("300px");

    handle("Name").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await settle();
    expect(colWidth("Name")).toBe("180px");

    await drag("Name", 40);
    fixture.destroy();
    await create();
    expect(colWidth("Name")).toBe("220px");
    expect(JSON.parse(localStorage.getItem(widthsStorageKey("spec.grid"))!)).toEqual({ name: 220 });
  });

  it("still resizes when localStorage refuses writes (Review Focus 1)", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    await expect(drag("Name", 40)).resolves.toBeUndefined();
    expect(colWidth("Name")).toBe("220px");
    handle("Name").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    await settle();
    expect(colWidth("Name")).toBe("180px");
  });

  it("renders without throwing when localStorage reads throw", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    fixture.destroy();
    await create();
    expect(colWidth("Name")).toBe("180px");
  });

  it("renders the header plus one full-width empty row with emptyRow", async () => {
    host.rows.set([]);
    host.emptyRow.set(true);
    await settle();
    expect(headerTexts()).toEqual(["Name", "Score", "Wide", "Action"]);
    expect(bodyRows()).toHaveLength(1);
    const cells = bodyRows()[0]!.cells;
    expect(cells).toHaveLength(1);
    expect(cells[0]!.colSpan).toBe(4);
    expect(cells[0]!.textContent!.trim()).toBe("Nothing here");
  });

  it("replaces the table with the empty template without emptyRow", async () => {
    host.rows.set([]);
    await settle();
    expect(root.querySelector("table")).toBeNull();
    expect(root.textContent!.trim()).toBe("Nothing here");
  });

  it("hides a hideBelow lg column when (min-width: 1024px) does not match", async () => {
    fixture.destroy();
    stubViewport(900);
    await create();
    expect(headerTexts()).toEqual(["Name", "Score", "Action"]);
    expect(bodyRows()[0]!.cells).toHaveLength(3);
  });
});

type Guest = { id: string; status: string; cpu: number; tags: string[] };

@Component({
  selector: "ko-grid-factories-host",
  imports: [KoDataGrid, KoKeyValueTable],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-data-grid
      storageKey="spec.factories"
      [rows]="rows()"
      [getRowId]="getRowId"
      [columns]="columns"
    />
    <ko-key-value-table caption="Config" [columns]="kvColumns">
      <tr>
        <th scope="row">Cores</th>
        <td>4</td>
      </tr>
    </ko-key-value-table>
  `,
})
class FactoriesHost {
  readonly rows = signal<Guest[]>([
    { id: "g1", status: "running", cpu: 12, tags: ["prod", "web"] },
  ]);
  readonly getRowId = (row: Guest) => row.id;
  readonly kvColumns = [
    { id: "key", header: "Setting", colClassName: "w-1/3" },
    { id: "value", header: "Value", align: "right" as const },
  ];
  readonly columns: DataGridColumn<Guest>[] = [
    statusColumn<Guest>({
      id: "status",
      header: "Status",
      size: 100,
      status: (g) => g.status,
      tone: (s) => (s === "running" ? "live" : "neutral"),
      style: "dot",
    }),
    progressColumn<Guest>({
      id: "cpu",
      header: "CPU",
      size: 100,
      variant: "cpu",
      value: (g) => ({ percent: g.cpu, label: `${g.cpu}%` }),
    }),
    tagsColumn<Guest>({ id: "tags", header: "Tags", size: 200, tags: (g) => g.tags }),
  ];
}

describe("data grid column factories and KoKeyValueTable", () => {
  beforeEach(() => {
    stubViewport(1440);
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders status, progress and tags cells, and updates them when the row changes", async () => {
    const fixture = TestBed.createComponent(FactoriesHost);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector("ko-status-dot-label")!.textContent!.trim()).toBe("running");
    expect(root.querySelector("ko-progress-cell")!.textContent!.trim()).toBe("12%");
    const chips = () =>
      [...root.querySelectorAll("ko-chip-list ko-chip span")].map((el) => el.textContent!.trim());
    expect(chips()).toEqual(["prod", "web"]);

    fixture.componentInstance.rows.set([{ id: "g1", status: "stopped", cpu: 95, tags: ["dev"] }]);
    await fixture.whenStable();
    expect(root.querySelector("ko-status-dot-label")!.textContent!.trim()).toBe("stopped");
    expect(root.querySelector("ko-progress-cell")!.textContent!.trim()).toBe("95%");
    expect(chips()).toEqual(["dev"]);
  });

  it("renders the key/value table with a caption, cols and projected rows", async () => {
    const fixture = TestBed.createComponent(FactoriesHost);
    await fixture.whenStable();
    const table = (fixture.nativeElement as HTMLElement).querySelector("ko-key-value-table table")!;
    expect(table.querySelector("caption")!.textContent).toBe("Config");
    expect(table.querySelector("col")!.className).toBe("w-1/3");
    const ths = [...table.querySelectorAll("thead th")];
    expect(ths.map((th) => th.textContent!.trim())).toEqual(["Setting", "Value"]);
    expect(ths[1]!.className).toContain("text-right");
    expect(table.querySelector("tbody tr th")!.textContent).toBe("Cores");
  });
});

@Component({
  selector: "ko-grid-cards-host",
  imports: [KoDataGrid, KoGridMobileCard, KoGridRowDetail],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-data-grid
      storageKey="spec.cards"
      [rows]="rows"
      [getRowId]="getRowId"
      [columns]="columns"
      [hasRowDetail]="hasDetail"
      [classNames]="{ mobileList: 'cards', detailRow: 'detail' }"
    >
      <ng-template [koGridMobileCard]="rows" let-row>
        <article>{{ row.name }}</article>
      </ng-template>
      <ng-template [koGridRowDetail]="rows" let-row>Detail {{ row.name }}</ng-template>
    </ko-data-grid>
  `,
})
class CardsHost {
  readonly rows = ROWS;
  readonly columns = COLUMNS;
  readonly getRowId = (row: Row) => row.id;
  readonly hasDetail = (row: Row) => row.id === "b";
}

describe("KoDataGrid mobile cards and detail rows", () => {
  let width = 1440;
  const changeListeners = new Set<() => void>();

  beforeEach(() => {
    width = 1440;
    changeListeners.clear();
    vi.stubGlobal("matchMedia", (query: string) => ({
      get matches() {
        return width >= Number(/(\d+)px/.exec(query)![1]);
      },
      addEventListener: (_: string, listener: () => void) => changeListeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => changeListeners.delete(listener),
    }));
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("renders detail rows after their record, and swaps to cards below md on a media change", async () => {
    const fixture = TestBed.createComponent(CardsHost);
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    const trs = [...root.querySelectorAll("tbody tr")];
    expect(trs).toHaveLength(5);
    expect(trs[2]!.className).toBe("detail");
    expect(trs[2]!.textContent!.trim()).toBe("Detail bravo");
    expect((trs[2] as HTMLTableRowElement).cells[0]!.colSpan).toBe(4);

    width = 500;
    for (const listener of changeListeners) listener();
    await fixture.whenStable();
    expect(root.querySelector("table")).toBeNull();
    const cards = [...root.querySelectorAll(".cards article")].map((el) => el.textContent);
    expect(cards).toEqual(["alpha", "bravo", "charlie", "delta"]);

    fixture.destroy();
    expect(changeListeners.size).toBe(0);
  });
});
