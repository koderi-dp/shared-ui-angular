import { createElement, type ReactNode } from "react";
import type { Breakpoint, DataGridColumn } from "@/ui/data-grid/types";
import { ProgressCell } from "./progress-column";
import type { ProgressVariant } from "./progress-level";
import { StatusBadge, StatusDotLabel } from "./status-column";
import { ChipList, type ChipColor } from "./tags-column";
import type { StatusTone } from "./tones";

// The column factories live here rather than beside their cells so each .tsx exports
// only components; the cells are built with createElement for the same reason.

export type ProgressValue = { percent: number; label: string };

export function progressColumn<T>(opts: {
  id: string;
  header: ReactNode;
  size: number;
  minSize?: number;
  /** `null` renders the empty 0% bar. */
  value: (row: T) => ProgressValue | null;
  variant: ProgressVariant;
  /** When set, the bar is wrapped in a `<div title>`. */
  title?: (row: T) => string | undefined;
  sortValue?: (row: T) => number | null;
  className?: string;
  headerClassName?: string;
  hideBelow?: Breakpoint;
}): DataGridColumn<T> {
  const { value, variant, title } = opts;
  const bar = (row: T) => {
    const v = value(row);
    return createElement(ProgressCell, {
      percent: v ? v.percent : 0,
      label: v ? v.label : "0%",
      variant,
    });
  };
  return {
    id: opts.id,
    header: opts.header,
    size: opts.size,
    minSize: opts.minSize,
    sortValue: opts.sortValue,
    className: opts.className,
    headerClassName: opts.headerClassName,
    hideBelow: opts.hideBelow,
    cell: title ? (row) => createElement("div", { title: title(row) }, bar(row)) : bar,
  };
}

export function statusColumn<T>(opts: {
  id: string;
  header: ReactNode;
  size: number;
  minSize?: number;
  status: (row: T) => string;
  tone: (status: string) => StatusTone;
  style: "badge" | "dot";
  /** Defaults to the raw status string. */
  label?: (status: string) => ReactNode;
  /** Sort by the raw status string. Default false. */
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  hideBelow?: Breakpoint;
}): DataGridColumn<T> {
  const { status, tone, style, label } = opts;
  const Cell = style === "badge" ? StatusBadge : StatusDotLabel;
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
      return createElement(Cell, { tone: tone(s), children: label ? label(s) : s });
    },
  };
}

export function tagsColumn<T>(opts: {
  id: string;
  header: ReactNode;
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
    cell: (row) => createElement(ChipList, { tags: tags(row), color, onSelect }),
  };
}
