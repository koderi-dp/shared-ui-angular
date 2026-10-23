import { flexRenderComponent } from "@tanstack/angular-table";
import type { Breakpoint, DataGridColumn } from "@/ui/data-grid/types";
import { type ChipColor, KoChipList } from "./chip-list.component";
import { KoProgressCell } from "./progress-cell.component";
import type { ProgressVariant } from "./progress-level";
import { KoStatusCell } from "./status-cell.component";
import type { StatusTone } from "./tones";

export type ProgressValue = { percent: number; label: string };

export function progressColumn<T>(opts: {
  id: string;
  header: string;
  size: number;
  minSize?: number;
  /** `null` renders the empty 0% bar. */
  value: (row: T) => ProgressValue | null;
  variant: ProgressVariant;
  /** When set, the bar gets this `title`. */
  title?: (row: T) => string | undefined;
  sortValue?: (row: T) => number | null;
  className?: string;
  headerClassName?: string;
  hideBelow?: Breakpoint;
}): DataGridColumn<T> {
  const { value, variant, title } = opts;
  return {
    id: opts.id,
    header: opts.header,
    size: opts.size,
    minSize: opts.minSize,
    sortValue: opts.sortValue,
    className: opts.className,
    headerClassName: opts.headerClassName,
    hideBelow: opts.hideBelow,
    cell: (row) => {
      const v = value(row);
      return flexRenderComponent(KoProgressCell, {
        inputs: {
          percent: v ? v.percent : 0,
          label: v ? v.label : "0%",
          variant,
          title: title?.(row),
        },
      });
    },
  };
}

export function statusColumn<T>(opts: {
  id: string;
  header: string;
  size: number;
  minSize?: number;
  status: (row: T) => string;
  tone: (status: string) => StatusTone;
  style: "badge" | "dot";
  /** Defaults to the raw status string. */
  label?: (status: string) => string;
  /** Sort by the raw status string. Default false. */
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hideBelow?: Breakpoint;
}): DataGridColumn<T> {
  const { status, tone, style, label } = opts;
  return {
    id: opts.id,
    header: opts.header,
    size: opts.size,
    minSize: opts.minSize,
    sortValue: opts.sortable ? status : undefined,
    className: opts.className,
    headerClassName: opts.headerClassName,
    hideBelow: opts.hideBelow,
    cell: (row) => {
      const s = status(row);
      return flexRenderComponent(KoStatusCell, {
        inputs: { tone: tone(s), label: label ? label(s) : s, style },
      });
    },
  };
}

export function tagsColumn<T>(opts: {
  id: string;
  header: string;
  size: number;
  minSize?: number;
  tags: (row: T) => string[];
  color?: (tag: string) => ChipColor;
  onSelect?: (tag: string) => void;
  className?: string;
  headerClassName?: string;
  hideBelow?: Breakpoint;
}): DataGridColumn<T> {
  const { tags, color, onSelect } = opts;
  return {
    id: opts.id,
    header: opts.header,
    size: opts.size,
    minSize: opts.minSize,
    className: opts.className,
    headerClassName: opts.headerClassName,
    hideBelow: opts.hideBelow,
    cell: (row) =>
      flexRenderComponent(KoChipList, { inputs: { tags: tags(row), color, onSelect } }),
  };
}
