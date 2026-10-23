import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/ui/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/ui/primitives/popover";
import { fitChipCount, moreTagsLabel } from "./chip-fit";

export type ChipColor = { bg: string; fg: string };

export const CHIP = "max-w-40 truncate rounded px-1.5 py-0.5 text-[10px] font-medium";

/** Used when no `color` is given. */
const NEUTRAL_CHIP = "bg-secondary text-secondary-foreground";

const GAP = 4; // matches gap-1

const FOCUS_RING =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function Chip({
  tag,
  color,
  onSelect,
  className,
}: {
  tag: string;
  color?: ChipColor;
  onSelect?: (tag: string) => void;
  className?: string;
}) {
  const style = color ? { backgroundColor: color.bg, color: color.fg } : undefined;
  const base = color ? CHIP : cn(CHIP, NEUTRAL_CHIP);
  return onSelect ? (
    <button
      type="button"
      className={cn(base, className, FOCUS_RING)}
      style={style}
      title={tag}
      onKeyDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(tag);
      }}
    >
      {tag}
    </button>
  ) : (
    <span className={cn(base, className)} style={style} title={tag}>
      {tag}
    </span>
  );
}

/**
 * The "+N" chip: a button that opens a popover with the hidden tags. Its click
 * and keydown (and clicks inside the portalled popover, which still bubble
 * through React) stop propagation so a row's onRowClick never fires.
 */
function MoreChip({
  hidden,
  color,
  onSelect,
}: {
  hidden: string[];
  color?: (tag: string) => ChipColor;
  onSelect?: (tag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={moreTagsLabel(hidden.length)}
          className={cn(CHIP, "shrink-0 bg-muted text-muted-foreground", FOCUS_RING)}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          +{hidden.length}
        </button>
      </PopoverTrigger>
      <PopoverContent className="max-w-80 p-1.5" onClick={(e) => e.stopPropagation()}>
        <div className="flex flex-wrap gap-1">
          {hidden.map((tag) => (
            <Chip
              key={tag}
              tag={tag}
              color={color?.(tag)}
              onSelect={
                onSelect
                  ? (t) => {
                      setOpen(false);
                      onSelect(t);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One non-wrapping line: as many chips as fit, plus a "+N" button listing the rest. */
export function ChipList({
  tags,
  color,
  onSelect,
  className,
}: {
  tags: string[];
  color?: (tag: string) => ChipColor;
  onSelect?: (tag: string) => void;
  className?: string;
}) {
  const list = tags ?? [];
  const wrapRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  // null = not measured yet (SSR / first paint): render all chips, clipped.
  const [count, setCount] = useState<number | null>(null);
  const key = JSON.stringify(list);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure || typeof ResizeObserver === "undefined") return;
    const run = () => {
      const kids = Array.from(measure.children) as HTMLElement[];
      const plus = kids.pop();
      const widths = kids.map((k) => k.offsetWidth);
      setCount(fitChipCount(widths, wrap.clientWidth, plus?.offsetWidth ?? 0, GAP));
    };
    // Fires once on observe, which also covers the initial measure and re-measure on tags change.
    const ro = new ResizeObserver(run);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [key]);

  if (list.length === 0) return null;
  const n = count === null ? list.length : Math.min(count, list.length);
  const shown = list.slice(0, n);
  const hidden = list.slice(n);
  return (
    <span ref={wrapRef} className={cn("relative flex min-w-0 overflow-hidden", className)}>
      <span className="flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden">
        {shown.map((tag) => (
          <Chip key={tag} tag={tag} color={color?.(tag)} onSelect={onSelect} className="shrink-0" />
        ))}
        {hidden.length > 0 ? <MoreChip hidden={hidden} color={color} onSelect={onSelect} /> : null}
      </span>
      <span
        ref={measureRef}
        aria-hidden="true"
        className="pointer-events-none invisible absolute left-0 top-0 flex flex-nowrap gap-1 whitespace-nowrap"
      >
        {list.map((tag) => (
          <span key={tag} className={CHIP} title={tag} tabIndex={-1}>
            {tag}
          </span>
        ))}
        <span className={CHIP}>+{list.length}</span>
      </span>
    </span>
  );
}
