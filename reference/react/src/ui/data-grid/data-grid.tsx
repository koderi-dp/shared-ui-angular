import {
  Fragment,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
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
import { ResizeHandle } from "@/ui/data-grid/resize-handle";
import type { DataGridColumn, DataGridProps } from "@/ui/data-grid/types";
import { useColumnWidths } from "@/ui/data-grid/use-column-widths";
import { Checkbox } from "@/ui/primitives/checkbox";
import { cn } from "@/ui/utils";

const DEFAULT_MIN = 48;
const DEFAULT_MAX = 800;

/** Id of the synthetic checkbox column added by the `selection` prop. */
const SELECT_COLUMN_ID = "__select";
const SELECT_COLUMN_SIZE = 40;

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

/** Before hydration: assume the desktop table with every column (the common case). */
const SSR_VIEWPORT_WIDTH = BREAKPOINT_PX.xl;

function subscribeViewport(onChange: () => void) {
  const lists = BREAKPOINT_QUERIES.map((b) => window.matchMedia(b.query));
  for (const mq of lists) mq.addEventListener("change", onChange);
  return () => {
    for (const mq of lists) mq.removeEventListener("change", onChange);
  };
}

function viewportSnapshot(): number {
  for (const b of BREAKPOINT_QUERIES) if (window.matchMedia(b.query).matches) return b.width;
  return 0;
}

const viewportServerSnapshot = () => SSR_VIEWPORT_WIDTH;

/**
 * Viewport width bucketed to Tailwind's breakpoints (0/640/768/1024/1280), which
 * is all `visibleColumnIds` and the md card switch compare against. Hydration-safe:
 * the server render and the hydrating client render both use SSR_VIEWPORT_WIDTH
 * (desktop table, all columns), then React re-renders with the real bucket.
 * Client-only mounts read the real bucket immediately, so no card/table flash.
 */
function useBreakpointWidth(): number {
  return useSyncExternalStore(subscribeViewport, viewportSnapshot, viewportServerSnapshot);
}

function renderHeader<T>(column: DataGridColumn<T>) {
  return typeof column.header === "function" ? column.header() : column.header;
}

export function DataGrid<T extends RowData>({
  storageKey,
  rows,
  getRowId,
  columns: callerColumns,
  onRowClick,
  onRowDoubleClick,
  onRowContextMenu,
  renderMobileCard,
  renderRowDetail,
  empty,
  emptyRow = false,
  loading,
  className,
  layout = "auto",
  resizable = false,
  stickyHeader = false,
  classNames,
  selection,
  selectionLabel,
}: DataGridProps<T>) {
  const fixed = layout === "fixed";
  const canResize = fixed && resizable;
  const hasSelection = !!selection;
  // Last row toggled by a row checkbox; Shift+click selects from here.
  const anchorRef = useRef<string | null>(null);

  // Without `selection` this is the caller's array as-is, so nothing else changes.
  const columns = useMemo<DataGridColumn<T>[]>(() => {
    if (!hasSelection) return callerColumns;
    const anyPinned = callerColumns.some((c) => c.pinned === "left");
    const selectColumn: DataGridColumn<T> = {
      id: SELECT_COLUMN_ID,
      header: null,
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
  }, [callerColumns, hasSelection]);

  const limits = useMemo(
    () =>
      columns.map((c) => ({
        id: c.id,
        minSize: c.minSize ?? DEFAULT_MIN,
        maxSize: c.maxSize ?? DEFAULT_MAX,
      })),
    [columns],
  );
  const { widths, setWidth, commit, reset } = useColumnWidths(storageKey, limits);

  const viewportWidth = useBreakpointWidth();
  const isDesktop = viewportWidth >= BREAKPOINT_PX.md;

  const byId = useMemo(() => new Map(columns.map((c) => [c.id, c])), [columns]);

  const columnDefs = useMemo<ColumnDef<Features, T, unknown>[]>(
    () =>
      columns.map((c) => {
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
          sortFn: (a, b, id) =>
            compareSortValues(
              a.getValue<SortKey>(id) ?? null,
              b.getValue<SortKey>(id) ?? null,
              false,
            ),
        };
      }),
    [columns],
  );

  const columnVisibility = useMemo(() => {
    const visible = new Set(visibleColumnIds(columns, viewportWidth));
    const out: Record<string, boolean> = {};
    for (const c of columns) out[c.id] = visible.has(c.id);
    return out;
  }, [columns, viewportWidth]);

  const columnPinning = useMemo(
    () => ({ start: columns.filter((c) => c.pinned === "left").map((c) => c.id), end: [] }),
    [columns],
  );

  const table = useTable<Features, T>({
    features,
    data: rows,
    columns: columnDefs,
    getRowId: (row: T) => getRowId(row),
    enableColumnResizing: canResize,
    enableMultiSort: false,
    state: {
      columnSizing: canResize ? widths : {},
      columnVisibility,
      columnPinning,
    },
  });

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  const emptyInTable = emptyRow && (isDesktop || !renderMobileCard);
  if (rows.length === 0 && empty !== undefined && !emptyInTable) {
    return <div className={className}>{empty}</div>;
  }

  const sortedRows = table.getRowModel().rows;

  if (!isDesktop && renderMobileCard) {
    const cards = sortedRows.map((row) => (
      <Fragment key={row.id}>{renderMobileCard(row.original)}</Fragment>
    ));
    return (
      <div className={className}>
        {classNames?.mobileList ? <div className={classNames.mobileList}>{cards}</div> : cards}
      </div>
    );
  }

  // Header order already puts pinned columns first.
  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const sizes: Record<string, number> = {};
  for (const h of headers) sizes[h.column.id] = h.column.getSize();
  const offsets = pinnedOffsets(
    headers.map((h) => ({ id: h.column.id, pinned: byId.get(h.column.id)?.pinned })),
    sizes,
  );
  const pinnedIds = Object.keys(offsets);
  const lastPinned = pinnedIds[pinnedIds.length - 1];
  const totalWidth = headers.reduce((sum, h) => sum + sizes[h.column.id], 0);

  const pinnedStyle = (id: string): CSSProperties | undefined =>
    id in offsets ? { left: offsets[id] } : undefined;

  const onRowClickCapture = (row: T) => (event: MouseEvent<HTMLTableRowElement>) => {
    if (!onRowClick) return;
    if (isInteractiveTarget(event.target as Element, event.currentTarget)) return;
    onRowClick(row);
  };

  const onRowDoubleClickCapture = (row: T) => (event: MouseEvent<HTMLTableRowElement>) => {
    if (!onRowDoubleClick) return;
    if (isInteractiveTarget(event.target as Element, event.currentTarget)) return;
    onRowDoubleClick(row);
  };

  const visibleIds = selection ? rows.map(getRowId) : [];
  const headerState = selection ? headerSelectionState(selection.selected, visibleIds) : "none";

  const toggleRow = (id: string, shiftKey: boolean) => {
    if (!selection) return;
    const next =
      shiftKey && anchorRef.current != null
        ? selectRange(
            selection.selected,
            sortedRows.map((r) => r.id),
            anchorRef.current,
            id,
          )
        : toggleSelection(selection.selected, id);
    anchorRef.current = id;
    selection.onChange(next);
  };

  // The whole cell is a click target so a near-miss on the 16px box doesn't open
  // the row. Clicks on the checkbox itself are handled by its own onClick (Radix
  // may stop propagation when the grid sits inside a <form>).
  const onSelectCellClick = (id: string) => (event: MouseEvent<HTMLTableCellElement>) => {
    if ((event.target as Element).closest("button")) return;
    toggleRow(id, event.shiftKey);
  };

  // Shift+mousedown would otherwise extend the page's text selection.
  const preventShiftSelect = (event: MouseEvent) => {
    if (event.shiftKey) event.preventDefault();
  };

  const tableEl = (
    <table
      className={classNames?.table}
      style={fixed ? { width: totalWidth, tableLayout: "fixed" } : undefined}
    >
      {fixed ? (
        <colgroup>
          {headers.map((h) => (
            <col key={h.id} style={{ width: sizes[h.column.id] }} />
          ))}
        </colgroup>
      ) : null}
      <thead className={classNames?.thead}>
        <tr className={classNames?.headerRow}>
          {headers.map((h) => {
            const col = byId.get(h.column.id);
            if (!col) return null;
            const id = col.id;
            const pinned = id in offsets;
            const sortable = h.column.getCanSort();
            const sorted = h.column.getIsSorted();
            const showHandle = canResize && h.column.getCanResize();
            if (id === SELECT_COLUMN_ID && selection) {
              return (
                <th
                  key={h.id}
                  style={pinnedStyle(id)}
                  className={cn(
                    "relative",
                    (stickyHeader || pinned) && "bg-background",
                    stickyHeader && "sticky top-0 z-20",
                    pinned && "sticky z-30",
                    id === lastPinned && "shadow-[4px_0_6px_-4px_rgb(0_0_0/0.6)]",
                    classNames?.headerCell,
                    col.headerClassName,
                  )}
                >
                  <Checkbox
                    aria-label="Select all rows"
                    disabled={visibleIds.length === 0}
                    checked={
                      headerState === "all"
                        ? true
                        : headerState === "some"
                          ? "indeterminate"
                          : false
                    }
                    onCheckedChange={() =>
                      selection.onChange(toggleAll(selection.selected, visibleIds))
                    }
                    className="align-middle"
                  />
                </th>
              );
            }
            return (
              <th
                key={h.id}
                style={pinnedStyle(id)}
                aria-sort={
                  sortable
                    ? sorted === "asc"
                      ? "ascending"
                      : sorted === "desc"
                        ? "descending"
                        : "none"
                    : undefined
                }
                className={cn(
                  "relative",
                  col.align === "right" && "text-right",
                  showHandle && "group/header",
                  (stickyHeader || pinned) && "bg-background",
                  stickyHeader && "sticky top-0 z-20",
                  pinned && "sticky z-30",
                  id === lastPinned && "shadow-[4px_0_6px_-4px_rgb(0_0_0/0.6)]",
                  classNames?.headerCell,
                  col.headerClassName,
                )}
              >
                {sortable ? (
                  <button
                    type="button"
                    onClick={h.column.getToggleSortingHandler()}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1 hover:text-foreground",
                      col.align === "right" && "flex-row-reverse",
                    )}
                  >
                    {renderHeader(col)}
                    {sorted === "asc" ? (
                      <ArrowUp className="size-3" aria-hidden />
                    ) : sorted === "desc" ? (
                      <ArrowDown className="size-3" aria-hidden />
                    ) : null}
                  </button>
                ) : (
                  renderHeader(col)
                )}
                {showHandle ? (
                  <ResizeHandle
                    width={sizes[id]}
                    minSize={col.minSize ?? DEFAULT_MIN}
                    maxSize={col.maxSize ?? DEFAULT_MAX}
                    label={typeof col.header === "string" ? col.header : id}
                    onResize={(w) => setWidth(id, w)}
                    onCommit={commit}
                    onReset={() => reset(id)}
                  />
                ) : null}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedRows.map((row) => {
          const rowClass =
            typeof classNames?.row === "function" ? classNames.row(row.original) : classNames?.row;
          const detail = renderRowDetail ? renderRowDetail(row.original) : null;
          const isSelected = selection?.selected.has(row.id) ?? false;
          // Keyed pair: the record <tr> keeps its slot whether or not the detail exists,
          // so toggling the detail never remounts the record row.
          return (
            <Fragment key={row.id}>
              <tr
                className={cn(rowClass, onRowClick && "group cursor-pointer hover:bg-secondary/40")}
                data-selected={isSelected ? "true" : undefined}
                onClick={onRowClick ? onRowClickCapture(row.original) : undefined}
                onDoubleClick={onRowDoubleClick ? onRowDoubleClickCapture(row.original) : undefined}
                onContextMenu={
                  onRowContextMenu
                    ? (event) => {
                        // Portalled menus bubble through React; ignore events from outside the row.
                        if (!event.currentTarget.contains(event.target as Node)) return;
                        onRowContextMenu(row.original, event);
                      }
                    : undefined
                }
              >
                {row.getVisibleCells().map((cell) => {
                  const col = byId.get(cell.column.id);
                  if (!col) return null;
                  const pinned = col.id in offsets;
                  const isSelectCell = col.id === SELECT_COLUMN_ID && !!selection;
                  const extra = col.cellProps?.(row.original);
                  return (
                    <td
                      key={cell.id}
                      style={pinnedStyle(col.id)}
                      title={extra?.title}
                      className={cn(
                        col.align === "right" && "text-right",
                        pinned
                          ? cn(
                              "sticky z-10 bg-background",
                              onRowClick && "group-hover:bg-grid-pinned-hover",
                              col.id === lastPinned && "shadow-[4px_0_6px_-4px_rgb(0_0_0/0.6)]",
                            )
                          : "isolate",
                        classNames?.cell,
                        col.className,
                        extra?.className,
                      )}
                      {...(isSelectCell
                        ? {
                            "data-grid-select": "",
                            onClick: onSelectCellClick(row.id),
                            onMouseDown: preventShiftSelect,
                          }
                        : {})}
                    >
                      {isSelectCell ? (
                        <Checkbox
                          aria-label={selectionLabel?.(row.original) ?? `Select ${row.id}`}
                          checked={isSelected}
                          onClick={(event) => toggleRow(row.id, event.shiftKey)}
                          className="align-middle"
                        />
                      ) : (
                        col.cell(row.original)
                      )}
                    </td>
                  );
                })}
              </tr>
              {detail != null ? (
                <tr className={classNames?.detailRow}>
                  <td colSpan={headers.length} className={classNames?.detailCell}>
                    {detail}
                  </td>
                </tr>
              ) : null}
            </Fragment>
          );
        })}
        {rows.length === 0 && empty !== undefined && emptyInTable ? (
          <tr className={classNames?.emptyRow}>
            <td colSpan={headers.length} className={classNames?.emptyCell}>
              {empty}
            </td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );

  // Only add a scroll container when something needs one; a plain auto-layout
  // table with no className renders bare, exactly like today's tables.
  const needsWrapper = !!className || fixed || pinnedIds.length > 0;
  return needsWrapper ? <div className={cn("overflow-x-auto", className)}>{tableEl}</div> : tableEl;
}
