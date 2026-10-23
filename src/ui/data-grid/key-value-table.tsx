import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/ui/utils";

export type KeyValueColumn = {
  id: string;
  header: ReactNode;
  /** Class on the `<col>` element (e.g. "w-[23%]"); no class renders a plain `<col />`. */
  colClassName?: string;
  /** Extra classes for this column's `<th>`. */
  headerClassName?: string;
  /** "right" adds `text-right` to the `<th>`. */
  align?: "left" | "right";
};

export type KeyValueTableProps = {
  caption: string;
  columns: KeyValueColumn[];
  classNames?: {
    wrapper?: string;
    table?: string;
    thead?: string;
    headerRow?: string;
    headerCell?: string;
    tbody?: string;
  };
  /** The rows: compose them from `KeyValueTable.Row`, `.Key` and `.Cell`. */
  children: ReactNode;
};

function Row(props: ComponentProps<"tr">) {
  return <tr {...props} />;
}

function Key(props: ComponentProps<"th">) {
  return <th scope="row" {...props} />;
}

function Cell(props: ComponentProps<"td">) {
  return <td {...props} />;
}

/**
 * A plain table for form and key/value layouts that do not fit a row-per-record
 * DataGrid. No sorting, resizing or selection; the caller owns every class.
 */
export function KeyValueTable({ caption, columns, classNames, children }: KeyValueTableProps) {
  const table = (
    <table className={classNames?.table}>
      <caption className="sr-only">{caption}</caption>
      <colgroup>
        {columns.map((column) => (
          <col key={column.id} className={column.colClassName} />
        ))}
      </colgroup>
      <thead className={classNames?.thead}>
        <tr className={classNames?.headerRow}>
          {columns.map((column) => (
            <th
              key={column.id}
              scope="col"
              className={cn(
                classNames?.headerCell,
                column.align === "right" && "text-right",
                column.headerClassName,
              )}
            >
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={classNames?.tbody}>{children}</tbody>
    </table>
  );
  return classNames?.wrapper ? <div className={classNames.wrapper}>{table}</div> : table;
}

KeyValueTable.Row = Row;
KeyValueTable.Key = Key;
KeyValueTable.Cell = Cell;
