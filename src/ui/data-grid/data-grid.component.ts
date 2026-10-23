import { isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
} from "@angular/core";
import { outputFromObservable } from "@angular/core/rxjs-interop";
import { NgIcon } from "@ng-icons/core";
import { lucideArrowDown, lucideArrowUp, lucideLoaderCircle } from "@ng-icons/lucide";
import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  FlexRender,
  injectTable,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
  type RowData,
} from "@tanstack/angular-table";
import { Observable, Subject } from "rxjs";
import { columnWidthsState } from "@/ui/data-grid/column-widths-state";
import {
  BREAKPOINT_PX,
  compareSortValues,
  headerSelectionState,
  isInteractiveTarget,
  pinnedOffsets,
  selectRange,
  toggleAll,
  toggleSelection,
  visibleColumnIds,
} from "@/ui/data-grid/grid-layout";
import { KoResizeHandle } from "@/ui/data-grid/resize-handle.component";
import type { CellContent, DataGridClassNames, DataGridColumn } from "@/ui/data-grid/types";
import { KoCheckbox, type KoCheckedState } from "@/ui/primitives/checkbox.component";
import { cn } from "@/ui/utils";

const DEFAULT_MIN = 48;
const DEFAULT_MAX = 800;

/** Id of the synthetic checkbox column added by the `selection` input. */
const SELECT_COLUMN_ID = "__select";
const SELECT_COLUMN_SIZE = 40;

const PINNED_SHADOW = "shadow-[4px_0_6px_-4px_rgb(0_0_0/0.6)]";

const features = tableFeatures({
  columnSizingFeature,
  columnResizingFeature,
  columnPinningFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

type Features = typeof features;
type SortKey = string | number | undefined;

const BREAKPOINT_QUERIES = (["xl", "lg", "md", "sm"] as const).map((bp) => ({
  width: BREAKPOINT_PX[bp],
  query: `(min-width: ${BREAKPOINT_PX[bp]}px)`,
}));

/** On the server, or without `matchMedia`: assume the desktop table with every column. */
const SSR_VIEWPORT_WIDTH = BREAKPOINT_PX.xl;

function viewportSnapshot(): number {
  for (const b of BREAKPOINT_QUERIES) if (window.matchMedia(b.query).matches) return b.width;
  return 0;
}

type RowContext<T> = { $implicit: T };

/** `<ng-template koGridMobileCard let-row>`: below `md`, one card per row replaces the table. */
@Directive({ selector: "ng-template[koGridMobileCard]" })
export class KoGridMobileCard<T> {
  /** Optional: bind the grid's rows (`[koGridMobileCard]="rows"`) to type `let-row`. */
  readonly koGridMobileCard = input<readonly T[] | "">("");
  readonly template = inject<TemplateRef<RowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: KoGridMobileCard<T>,
    _ctx: unknown,
  ): _ctx is RowContext<T> {
    return true;
  }
}

/** `<ng-template koGridRowDetail let-row>`: a full-width row after each record's row. */
@Directive({ selector: "ng-template[koGridRowDetail]" })
export class KoGridRowDetail<T> {
  /** Optional: bind the grid's rows (`[koGridRowDetail]="rows"`) to type `let-row`. */
  readonly koGridRowDetail = input<readonly T[] | "">("");
  readonly template = inject<TemplateRef<RowContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(_dir: KoGridRowDetail<T>, _ctx: unknown): _ctx is RowContext<T> {
    return true;
  }
}

/** `<ng-template koGridEmpty>`: what an empty grid shows. */
@Directive({ selector: "ng-template[koGridEmpty]" })
export class KoGridEmpty {
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}

type HeaderView<T> = {
  id: string;
  column: DataGridColumn<T>;
  select: boolean;
  className: string;
  left: number | null;
  size: number;
  text: string | null;
  template: TemplateRef<unknown> | null;
  sortable: boolean;
  sorted: false | "asc" | "desc";
  ariaSort: "ascending" | "descending" | "none" | null;
  toggleSort: ((event: unknown) => void) | undefined;
  showHandle: boolean;
  minSize: number;
  maxSize: number;
  label: string;
};

type CellView<T> = {
  id: string;
  select: boolean;
  className: string;
  left: number | null;
  title: string | null;
  cell: (row: T) => CellContent<T>;
};

type RowView<T> = {
  id: string;
  original: T;
  selected: boolean;
  className: string;
  cells: CellView<T>[];
  detail: boolean;
};

/**
 * One table component for every record list: column widths remembered per `storageKey`, pinned
 * and sortable columns, breakpoint-hidden columns, opt-in selection, detail rows and mobile
 * cards. Built on `@tanstack/angular-table`; cells render through `FlexRender`. The full
 * contract (inputs, outputs and templates) is documented on `DataGridProps` in `types.ts`.
 */
@Component({
  selector: "ko-data-grid",
  imports: [NgTemplateOutlet, NgIcon, FlexRender, KoCheckbox, KoResizeHandle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "'contents'" },
  templateUrl: "./data-grid.component.html",
})
export class KoDataGrid<T extends RowData> {
  readonly storageKey = input.required<string>();
  readonly rows = input.required<readonly T[]>();
  readonly getRowId = input.required<(row: T) => string>();
  readonly columns = input.required<DataGridColumn<T>[]>();
  readonly layout = input<"auto" | "fixed">("auto");
  readonly resizable = input(false, { transform: booleanAttribute });
  readonly stickyHeader = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly emptyRow = input(false, { transform: booleanAttribute });
  readonly classNames = input<DataGridClassNames<T>>();
  readonly class = input<string>("");
  /** Selected `getRowId` values. Selection is on whenever this is bound to a set. */
  readonly selection = input<ReadonlySet<string>>();
  readonly selectionLabel = input<(row: T) => string>();
  readonly hasRowDetail = input<(row: T) => boolean>();

  private readonly rowClicks = new Subject<T>();
  /** Listeners on `rowClick`; rows are styled clickable only when someone listens. */
  private rowClickListeners = 0;
  readonly rowClick = outputFromObservable<T>(
    new Observable<T>((subscriber) => {
      this.rowClickListeners++;
      const subscription = this.rowClicks.subscribe(subscriber);
      return () => {
        subscription.unsubscribe();
        this.rowClickListeners--;
      };
    }),
  );
  readonly rowDoubleClick = output<T>();
  readonly rowContextMenu = output<{ row: T; event: MouseEvent }>();
  readonly selectionChange = output<Set<string>>();

  protected readonly mobileCard = contentChild<KoGridMobileCard<T>>(KoGridMobileCard);
  protected readonly rowDetail = contentChild<KoGridRowDetail<T>>(KoGridRowDetail);
  protected readonly empty = contentChild(KoGridEmpty);

  protected readonly spinner = lucideLoaderCircle;
  protected readonly arrowUp = lucideArrowUp;
  protected readonly arrowDown = lucideArrowDown;

  /** Viewport width bucketed to Tailwind's breakpoints (0/640/768/1024/1280). */
  private readonly viewportWidth = signal(SSR_VIEWPORT_WIDTH);
  /** Last row toggled by a row checkbox; Shift+click selects from here. */
  private anchor: string | null = null;

  protected readonly fixed = computed(() => this.layout() === "fixed");
  private readonly canResize = computed(() => this.fixed() && this.resizable());
  protected readonly hasSelection = computed(() => this.selection() !== undefined);
  protected readonly isDesktop = computed(() => this.viewportWidth() >= BREAKPOINT_PX.md);

  /** Without `selection` this is the caller's array as-is. */
  private readonly allColumns = computed<DataGridColumn<T>[]>(() => {
    const callerColumns = this.columns();
    if (!this.hasSelection()) return callerColumns;
    const anyPinned = callerColumns.some((c) => c.pinned === "left");
    const selectColumn: DataGridColumn<T> = {
      id: SELECT_COLUMN_ID,
      header: "",
      cell: () => null,
      size: SELECT_COLUMN_SIZE,
      minSize: SELECT_COLUMN_SIZE,
      maxSize: SELECT_COLUMN_SIZE,
      resizable: false,
      ...(anyPinned ? { pinned: "left" as const } : {}),
      className: "w-10 px-3",
      headerClassName: "w-10 px-3",
    };
    return [selectColumn, ...callerColumns];
  });

  private readonly limits = computed(() =>
    this.allColumns().map((c) => ({
      id: c.id,
      minSize: c.minSize ?? DEFAULT_MIN,
      maxSize: c.maxSize ?? DEFAULT_MAX,
    })),
  );
  private readonly widths = columnWidthsState(this.storageKey, this.limits);

  private readonly byId = computed(() => new Map(this.allColumns().map((c) => [c.id, c])));

  private readonly columnDefs = computed<ColumnDef<Features, T, unknown>[]>(() =>
    this.allColumns().map((c) => {
      const sortValue = c.sortValue;
      const base = {
        id: c.id,
        size: c.size,
        minSize: c.minSize ?? DEFAULT_MIN,
        maxSize: c.maxSize ?? DEFAULT_MAX,
        enableResizing: c.resizable !== false,
        enablePinning: c.pinned === "left",
        enableSorting: !!sortValue,
      };
      if (!sortValue) return base;
      return {
        ...base,
        // Nulls map to undefined so `sortUndefined: "last"` keeps them at the
        // end in both directions (it is applied before the desc flip).
        accessorFn: (row: T) => sortValue(row) ?? undefined,
        sortUndefined: "last" as const,
        sortDescFirst: false,
        sortFn: (
          a: { getValue<V>(id: string): V },
          b: { getValue<V>(id: string): V },
          id: string,
        ) =>
          compareSortValues(
            a.getValue<SortKey>(id) ?? null,
            b.getValue<SortKey>(id) ?? null,
            false,
          ),
      } as ColumnDef<Features, T, unknown>;
    }),
  );

  private readonly columnVisibility = computed(() => {
    const columns = this.allColumns();
    const visible = new Set(visibleColumnIds(columns, this.viewportWidth()));
    const out: Record<string, boolean> = {};
    for (const c of columns) out[c.id] = visible.has(c.id);
    return out;
  });

  private readonly columnPinning = computed(() => ({
    start: this.allColumns()
      .filter((c) => c.pinned === "left")
      .map((c) => c.id),
    end: [],
  }));

  private readonly table = injectTable<Features, T>(() => ({
    features,
    data: this.rows(),
    columns: this.columnDefs(),
    getRowId: (row: T) => this.getRowId()(row),
    enableColumnResizing: this.canResize(),
    enableMultiSort: false,
    state: {
      columnSizing: this.canResize() ? this.widths.widths() : {},
      columnVisibility: this.columnVisibility(),
      columnPinning: this.columnPinning(),
    },
  }));

  protected readonly sortedRows = computed(() => this.table.getRowModel().rows);

  protected readonly emptyInTable = computed(
    () => this.emptyRow() && (this.isDesktop() || !this.mobileCard()),
  );
  protected readonly emptyAlone = computed(
    () => this.rows().length === 0 && !!this.empty() && !this.emptyInTable(),
  );
  protected readonly emptyInBody = computed(
    () => this.rows().length === 0 && !!this.empty() && this.emptyInTable(),
  );
  protected readonly showCards = computed(() => !this.isDesktop() && !!this.mobileCard());

  // Header order already puts pinned columns first.
  private readonly tableHeaders = computed(() => this.table.getHeaderGroups()[0]?.headers ?? []);
  protected readonly sizes = computed(() => {
    const out: Record<string, number> = {};
    for (const h of this.tableHeaders()) out[h.column.id] = h.column.getSize();
    return out;
  });
  private readonly offsets = computed(() =>
    pinnedOffsets(
      this.tableHeaders().map((h) => ({
        id: h.column.id,
        pinned: this.byId().get(h.column.id)?.pinned,
      })),
      this.sizes(),
    ),
  );
  private readonly lastPinned = computed(() => Object.keys(this.offsets()).at(-1));
  protected readonly totalWidth = computed(() =>
    this.tableHeaders().reduce((sum, h) => sum + this.sizes()[h.column.id]!, 0),
  );
  protected readonly needsWrapper = computed(
    () => !!this.class() || this.fixed() || Object.keys(this.offsets()).length > 0,
  );
  protected readonly wrapperClass = computed(() => cn("overflow-x-auto", this.class()));

  protected readonly headers = computed<HeaderView<T>[]>(() => {
    const offsets = this.offsets();
    const sizes = this.sizes();
    const sticky = this.stickyHeader();
    const headerCell = this.classNames()?.headerCell;
    const out: HeaderView<T>[] = [];
    for (const h of this.tableHeaders()) {
      const col = this.byId().get(h.column.id);
      if (!col) continue;
      const id = col.id;
      const pinned = id in offsets;
      const select = id === SELECT_COLUMN_ID && this.hasSelection();
      const sortable = !select && h.column.getCanSort();
      const sorted = sortable ? h.column.getIsSorted() : false;
      const showHandle = !select && this.canResize() && h.column.getCanResize();
      out.push({
        id: h.id,
        column: col,
        select,
        className: cn(
          "relative",
          !select && col.align === "right" && "text-right",
          showHandle && "group/header",
          (sticky || pinned) && "bg-background",
          sticky && "sticky top-0 z-20",
          pinned && "sticky z-30",
          id === this.lastPinned() && PINNED_SHADOW,
          headerCell,
          col.headerClassName,
        ),
        left: pinned ? offsets[id]! : null,
        size: sizes[id]!,
        text: typeof col.header === "string" ? col.header : null,
        template: typeof col.header === "string" ? null : col.header,
        sortable,
        sorted,
        ariaSort: sortable
          ? sorted === "asc"
            ? "ascending"
            : sorted === "desc"
              ? "descending"
              : "none"
          : null,
        toggleSort: sortable ? h.column.getToggleSortingHandler() : undefined,
        showHandle,
        minSize: col.minSize ?? DEFAULT_MIN,
        maxSize: col.maxSize ?? DEFAULT_MAX,
        label: typeof col.header === "string" ? col.header : id,
      });
    }
    return out;
  });

  protected readonly bodyRows = computed<RowView<T>[]>(() => {
    const offsets = this.offsets();
    const selected = this.selection();
    const classNames = this.classNames();
    const clickable = this.rowClickListeners > 0;
    const detail = this.rowDetail();
    const hasRowDetail = this.hasRowDetail();
    const columns = this.headers().map((h) => h.column);
    return this.sortedRows().map((row) => {
      const original = row.original;
      const rowClass =
        typeof classNames?.row === "function" ? classNames.row(original) : classNames?.row;
      return {
        id: row.id,
        original,
        selected: selected?.has(row.id) ?? false,
        className: cn(rowClass, clickable && "group cursor-pointer hover:bg-secondary/40"),
        detail: !!detail && (hasRowDetail ? hasRowDetail(original) : true),
        cells: columns.map((col) => {
          const pinned = col.id in offsets;
          const extra = col.cellProps?.(original);
          return {
            id: `${row.id}_${col.id}`,
            select: col.id === SELECT_COLUMN_ID && !!selected,
            left: pinned ? offsets[col.id]! : null,
            title: extra?.title ?? null,
            cell: col.cell,
            className: cn(
              col.align === "right" && "text-right",
              pinned
                ? cn(
                    "sticky z-10 bg-background",
                    clickable && "group-hover:bg-grid-pinned-hover",
                    col.id === this.lastPinned() && PINNED_SHADOW,
                  )
                : "isolate",
              classNames?.cell,
              col.className,
              extra?.className,
            ),
          };
        }),
      };
    });
  });

  private readonly allIds = computed(() => {
    const getRowId = this.getRowId();
    return this.hasSelection() ? this.rows().map(getRowId) : [];
  });
  protected readonly headerChecked = computed<KoCheckedState>(() => {
    const state = headerSelectionState(this.selection() ?? new Set(), this.allIds());
    return state === "all" ? true : state === "some" ? "indeterminate" : false;
  });

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && typeof window.matchMedia === "function") {
      const read = () => this.viewportWidth.set(viewportSnapshot());
      read();
      const lists = BREAKPOINT_QUERIES.map((b) => window.matchMedia(b.query));
      for (const mq of lists) mq.addEventListener?.("change", read);
      inject(DestroyRef).onDestroy(() => {
        for (const mq of lists) mq.removeEventListener?.("change", read);
      });
    }
  }

  protected rowLabel(row: RowView<T>): string {
    return this.selectionLabel()?.(row.original) ?? `Select ${row.id}`;
  }

  protected setWidth(id: string, width: number): void {
    this.widths.setWidth(id, width);
  }

  protected resetWidth(id: string): void {
    this.widths.resetWidth(id);
  }

  protected onRowClick(row: T, event: MouseEvent): void {
    if (this.rowClickListeners === 0) return;
    if (isInteractiveTarget(event.target as Element, event.currentTarget as Element)) return;
    this.rowClicks.next(row);
  }

  protected onRowDoubleClick(row: T, event: MouseEvent): void {
    if (isInteractiveTarget(event.target as Element, event.currentTarget as Element)) return;
    this.rowDoubleClick.emit(row);
  }

  protected onRowContextMenu(row: T, event: MouseEvent): void {
    if (!(event.currentTarget as Element).contains(event.target as Node)) return;
    this.rowContextMenu.emit({ row, event });
  }

  protected onToggleAll(box: KoCheckbox): void {
    // The checkbox toggled itself; it shows `selection` until the caller applies the change.
    box.checked.set(this.headerChecked());
    const selected = this.selection();
    if (!selected) return;
    this.selectionChange.emit(toggleAll(selected, this.allIds()));
  }

  /**
   * The whole cell is a click target so a near-miss on the 16px box doesn't open the row.
   * A click on the checkbox bubbles here too, after the checkbox toggled itself.
   */
  protected onSelectCellClick(row: RowView<T>, box: KoCheckbox, event: MouseEvent): void {
    box.checked.set(row.selected);
    this.toggleRow(row.id, event.shiftKey);
  }

  /** Space on the checkbox toggles it without a click event. */
  protected onSelectCellKeydown(row: RowView<T>, box: KoCheckbox, event: KeyboardEvent): void {
    if (event.key !== " ") return;
    if (!(event.target as Element).closest('button[role="checkbox"]')) return;
    box.checked.set(row.selected);
    this.toggleRow(row.id, event.shiftKey);
  }

  /** Shift+mousedown would otherwise extend the page's text selection. */
  protected preventShiftSelect(event: MouseEvent): void {
    if (event.shiftKey) event.preventDefault();
  }

  private toggleRow(id: string, shiftKey: boolean): void {
    const selected = this.selection();
    if (!selected) return;
    const next =
      shiftKey && this.anchor != null
        ? selectRange(
            selected,
            this.sortedRows().map((r) => r.id),
            this.anchor,
            id,
          )
        : toggleSelection(selected, id);
    this.anchor = id;
    this.selectionChange.emit(next);
  }
}
