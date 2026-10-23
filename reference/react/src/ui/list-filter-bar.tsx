import { X as ButtonXIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import { useCallback, useRef, type ReactNode } from "react";
import { Button } from "@/ui/primitives/button";
import { Input } from "@/ui/primitives/input";
import { embeddedFieldClass, embeddedFieldFocusClass } from "@/ui/primitives/field-control";
import { cn } from "@/ui/utils";

export function ListFilterBar({
  value,
  onChange,
  placeholder = "Filter…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]",
        className,
      )}
    >
      <Search className="size-3.5 shrink-0 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            clear();
          }
        }}
        placeholder={placeholder}
        className={cn("h-8 flex-1", embeddedFieldClass, embeddedFieldFocusClass)}
      />
      {value ? (
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          className="size-7 shrink-0"
          onClick={clear}
          title="Clear filter (Esc)"
          aria-label="Clear filter"
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export function SelectionToolbar({
  count,
  onClear,
  children,
  alwaysVisible = false,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
  /** Keep layout height when count is 0 (e.g. fixed footer). */
  alwaysVisible?: boolean;
}) {
  if (!alwaysVisible && count === 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2",
        alwaysVisible && count === 0 && "opacity-60",
      )}
    >
      <span className="text-xs text-muted-foreground">{count} selected</span>
      {children}
      <Button
        icon={ButtonXIcon}
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs"
        disabled={count === 0}
        onClick={onClear}
      >
        Clear
      </Button>
    </div>
  );
}
