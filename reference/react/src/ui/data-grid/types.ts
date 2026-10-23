import type { MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { Breakpoint } from "@/ui/data-grid/grid-layout";

export type { Breakpoint };

export type DataGridColumn<T> = {
  /** Stable; used as the persistence key. */
  id: string;
  header: ReactNode | (() => ReactNode);
  cell: (row: T) => ReactNode;
  /** Default width, px. */
  size: number;
  /** Default 48. */
  minSize?: number;
  /** Default 800. */
  maxSize?: number;
  /** Default "left". */
  align?: "left" | "right";
  pinned?: "left";
  hideBelow?: Breakpoint;
  /** Default true (only matters when the grid is `resizable`). */
  resizable?: boolean;
  /** Presence makes the column sortable. Nulls sort last in both directions. */
  sortValue?: (row: T) => string | number | null;
  /** Extra classes for this column's body cells. */
  className?: string;
  /**
   * Per-row attributes for this column's body cell: `title` is set on the <td>;
   * `className` is merged after the column's static `className`. Pinned/sticky
   * cell classes are unaffected.
   */
  cellProps?: (row: T) => { title?: string; className?: string };
  /** Extra classes for this column's header cell. */
  headerClassName?: string;
};

export type DataGridClassNames<T> = {
  table?: string;
  thead?: string;
  headerRow?: string;
  /** Applied to every <th>. */
  headerCell?: string;
  row?: string | ((row: T) => string);
  /** Applied to every <td>. */
  cell?: string;
  /**
   * Mobile view: when set, the cards from `renderMobileCard` are wrapped in a
   * `<div className={mobileList}>` inside the `className` container (e.g. a
   * padded flex column), so that container can stay the scroll area.
   */
  mobileList?: string;
  /** Applied to the <tr> of a `renderRowDetail` row. */
  detailRow?: string;
  /** Applied to the single full-width <td> of a `renderRowDetail` row. */
  detailCell?: string;
  /** With `emptyRow`: the <tr> that holds the empty message. */
  emptyRow?: string;
  /** With `emptyRow`: the single full-width <td> that holds the empty message. */
  emptyCell?: string;
};

export type DataGridSelection = {
  /** Selected `getRowId` values. */
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
};

export type DataGridProps<T> = {
  storageKey: string;
  rows: T[];
  getRowId: (row: T) => string;
  columns: DataGridColumn<T>[];
  onRowClick?: (row: T) => void;
  /**
   * Table view only: double-click on a record row. Ignored when the double-click
   * lands on an interactive element inside the row (button, link, input, …), like
   * `onRowClick`. Adds no classes; detail rows and mobile cards don't get it.
   */
  onRowDoubleClick?: (row: T) => void;
  /**
   * Table view only: right-click (contextmenu) on a record row. Not guarded: the
   * handler gets the event and decides (e.g. `preventDefault()` and open a menu at
   * `clientX`/`clientY`). Adds no classes; detail rows and mobile cards don't get it.
   */
  onRowContextMenu?: (row: T, event: ReactMouseEvent<HTMLTableRowElement>) => void;
  renderMobileCard?: (row: T) => ReactNode;
  /**
   * Table view only: when this returns non-null for a record, a full-width row
   * `<tr className={classNames.detailRow}><td colSpan={visible columns}
   * className={classNames.detailCell}>` holding the result is rendered right
   * after that record's row (e.g. an expandable editor). Detail rows follow
   * their record when sorting, are never clickable via `onRowClick`, and do not
   * appear in mobile cards.
   */
  renderRowDetail?: (row: T) => ReactNode | null;
  empty?: ReactNode;
  /**
   * Table view only, opt-in: when `rows` is empty, keep the table and its header
   * and render `empty` inside `<tbody>` as
   * `<tr className={classNames.emptyRow}><td colSpan={visible columns}
   * className={classNames.emptyCell}>`, instead of replacing the table with
   * `empty`. Default false. Mobile cards still show `empty` on its own.
   */
  emptyRow?: boolean;
  loading?: boolean;
  /**
   * Table view: classes for the table's scroll container, a
   * `div.overflow-x-auto` wrapper that is rendered only when `className` is
   * set, `layout` is "fixed", or a column is pinned (otherwise the <table>
   * renders bare). That wrapper scrolls on both axes, so with `stickyHeader`
   * the header sticks to this div, not the page: give it a height and
   * `overflow-auto` (e.g. "max-h-[70vh] overflow-auto").
   * Loading, empty and mobile-card output render inside a plain
   * `<div className={className}>`.
   */
  className?: string;
  /** Default "auto": columns size by content, like plain tables. */
  layout?: "auto" | "fixed";
  /** Default false; requires layout "fixed". */
  resizable?: boolean;
  /** Default false. */
  stickyHeader?: boolean;
  classNames?: DataGridClassNames<T>;
  /**
   * Table view only, opt-in: adds a leading ~40px checkbox column (not resizable,
   * not sortable; pinned first when any column is pinned). The header checkbox
   * selects or clears every row in `rows`; Shift+click on a row checkbox selects
   * the range from the last toggled row in display order. Clicks in that column
   * never reach `onRowClick` / `onRowDoubleClick`. Selected rows get
   * `data-selected="true"` on their <tr>; the grid adds no colour (style it via
   * `classNames.row`). Mobile cards get no checkboxes.
   */
  selection?: DataGridSelection;
  /** Accessible label for a row checkbox. Default "Select <row id>". */
  selectionLabel?: (row: T) => string;
};
