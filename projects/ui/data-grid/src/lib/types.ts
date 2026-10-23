import type { TemplateRef } from "@angular/core";
import type { flexRenderComponent } from "@tanstack/angular-table";
import type { Breakpoint } from "./grid-layout";

export type { Breakpoint };

/**
 * What a column's `cell` returns: text, a number, nothing, an `ng-template` that gets the row as
 * `$implicit`, or a component from `flexRenderComponent(Component, { inputs })`.
 */
export type CellContent<T> =
  string | number | null | TemplateRef<{ $implicit: T }> | ReturnType<typeof flexRenderComponent>;

export type DataGridColumn<T> = {
  /** Stable; used as the persistence key. */
  id: string;
  /** Text, or an `ng-template` (rendered without context). */
  header: string | TemplateRef<unknown>;
  cell: (row: T) => CellContent<T>;
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
   * Mobile view: when set, the cards from the `koGridMobileCard` template are
   * wrapped in a `<div class="{mobileList}">` inside the `class` container (e.g. a
   * padded flex column), so that container can stay the scroll area.
   */
  mobileList?: string;
  /** Applied to the <tr> of a `koGridRowDetail` row. */
  detailRow?: string;
  /** Applied to the single full-width <td> of a `koGridRowDetail` row. */
  detailCell?: string;
  /** With `emptyRow`: the <tr> that holds the empty message. */
  emptyRow?: string;
  /** With `emptyRow`: the single full-width <td> that holds the empty message. */
  emptyCell?: string;
};

/**
 * The `ko-data-grid` contract (React's `DataGridProps`, as Angular inputs, outputs and templates).
 *
 * Inputs:
 * - `storageKey`, `rows`, `getRowId`, `columns`: required.
 * - `layout`: default "auto", columns size by content, like plain tables.
 * - `resizable`: default false; requires layout "fixed".
 * - `stickyHeader`: default false.
 * - `loading`: shows a spinner and "Loading…" instead of the table.
 * - `emptyRow`: table view only, opt-in. When `rows` is empty, keep the table and its
 *   header and render the `koGridEmpty` template inside `<tbody>` as
 *   `<tr class="{classNames.emptyRow}"><td colspan="{visible columns}" class="{classNames.emptyCell}">`,
 *   instead of replacing the table with it. Default false. Mobile cards still show the
 *   empty template on its own.
 * - `class`: table view: classes for the table's scroll container, a `div.overflow-x-auto`
 *   wrapper that is rendered only when `class` is set, `layout` is "fixed", or a column is
 *   pinned (otherwise the <table> renders bare). That wrapper scrolls on both axes, so with
 *   `stickyHeader` the header sticks to this div, not the page: give it a height and
 *   `overflow-auto` (e.g. "max-h-[70vh] overflow-auto"). Loading, empty and mobile-card
 *   output render inside a plain `<div class="{class}">`.
 * - `classNames`: see {@link DataGridClassNames}.
 * - `selection`: table view only, opt-in; selection is on whenever this is bound to a set
 *   (the selected `getRowId` values). Adds a leading ~40px checkbox column (not resizable,
 *   not sortable; pinned first when any column is pinned). The header checkbox selects or
 *   clears every row in `rows`; Shift+click on a row checkbox selects the range from the
 *   last toggled row in display order. Clicks in that column never reach `rowClick` /
 *   `rowDoubleClick`. Selected rows get `data-selected="true"` on their <tr>; the grid adds
 *   no colour (style it via `classNames.row`). Mobile cards get no checkboxes. Changes are
 *   emitted through `selectionChange`; the grid never keeps its own copy.
 * - `selectionLabel`: accessible label for a row checkbox. Default "Select <row id>".
 * - `hasRowDetail`: with a `koGridRowDetail` template, which records get a detail row
 *   (default: every record).
 *
 * Outputs:
 * - `rowClick`: a click on a record row, ignored when it lands on an interactive element
 *   inside the row (button, link, input, …). Listening adds `cursor-pointer` and a hover
 *   colour to the rows.
 * - `rowDoubleClick`: table view only: double-click on a record row. Ignored when the
 *   double-click lands on an interactive element inside the row, like `rowClick`. Adds no
 *   classes; detail rows and mobile cards don't get it.
 * - `rowContextMenu`: table view only: right-click (contextmenu) on a record row. Not
 *   guarded: the handler gets `{ row, event }` and decides (e.g. `preventDefault()` and open
 *   a menu at `clientX`/`clientY`). Adds no classes; detail rows and mobile cards don't get it.
 * - `selectionChange`: the next selected set.
 *
 * Templates:
 * - `<ng-template koGridMobileCard let-row>`: below `md`, one card per row replaces the table.
 * - `<ng-template koGridRowDetail let-row>`: table view only: for every record where
 *   `hasRowDetail` is true, a full-width row
 *   `<tr class="{classNames.detailRow}"><td colspan="{visible columns}" class="{classNames.detailCell}">`
 *   holding the template is rendered right after that record's row (e.g. an expandable
 *   editor). Detail rows follow their record when sorting, are never clickable via
 *   `rowClick`, and do not appear in mobile cards.
 * - `<ng-template koGridEmpty>`: shown instead of the table when `rows` is empty (or inside
 *   it, with `emptyRow`). Without it an empty grid renders an empty table.
 */
export type DataGridProps<T> = {
  storageKey: string;
  rows: readonly T[];
  getRowId: (row: T) => string;
  columns: DataGridColumn<T>[];
  layout?: "auto" | "fixed";
  resizable?: boolean;
  stickyHeader?: boolean;
  loading?: boolean;
  emptyRow?: boolean;
  classNames?: DataGridClassNames<T>;
  class?: string;
  selection?: ReadonlySet<string>;
  selectionLabel?: (row: T) => string;
  hasRowDetail?: (row: T) => boolean;
};
