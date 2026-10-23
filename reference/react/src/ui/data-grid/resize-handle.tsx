import { useRef, type KeyboardEvent, type PointerEvent } from "react";

const KEY_STEP = 16;

type ResizeHandleProps = {
  width: number;
  minSize: number;
  maxSize: number;
  onResize(width: number): void;
  onCommit(): void;
  onReset(): void;
  label: string;
};

/**
 * Drag/keyboard handle on a header cell's right edge. The header cell must be
 * `relative` and carry `group/header`; the handle stays invisible until that
 * header is hovered or the handle has keyboard focus.
 */
export function ResizeHandle({
  width,
  minSize,
  maxSize,
  onResize,
  onCommit,
  onReset,
  label,
}: ResizeHandleProps) {
  const drag = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: width };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    onResize(d.startWidth + (event.clientX - d.startX));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCommit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      onResize(width + (event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP));
      onCommit();
    } else if (event.key === "Enter") {
      event.preventDefault();
      onReset();
    }
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={minSize}
      aria-valuemax={maxSize}
      aria-label={`Resize ${label}`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onReset();
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
      className="group/handle absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none justify-end opacity-0 outline-none select-none group-hover/header:opacity-100 focus-visible:opacity-100"
    >
      <span className="h-full w-0.5 bg-border group-focus-visible/handle:bg-ring" aria-hidden />
    </div>
  );
}
