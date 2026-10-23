import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";

const KEY_STEP = 16;

type Drag = { pointerId: number | undefined; startX: number; startWidth: number };

/**
 * Drag/keyboard handle on a header cell's right edge. The header cell must be `relative` and
 * carry `group/header`; the handle stays invisible until that header is hovered or the handle
 * has keyboard focus. `widthChange` emits the new width (unclamped) on every move and arrow key;
 * double-click and Enter emit `widthReset`.
 */
@Component({
  selector: "ko-resize-handle",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "separator",
    "aria-orientation": "vertical",
    tabindex: "0",
    "[attr.aria-valuenow]": "width()",
    "[attr.aria-valuemin]": "minSize()",
    "[attr.aria-valuemax]": "maxSize()",
    "[attr.aria-label]": "'Resize ' + label()",
    class:
      "group/handle absolute top-0 right-0 z-10 flex h-full w-2 cursor-col-resize touch-none justify-end opacity-0 outline-none select-none group-hover/header:opacity-100 focus-visible:opacity-100",
    "(pointerdown)": "onPointerDown($event)",
    "(pointermove)": "onPointerMove($event)",
    "(pointerup)": "endDrag($event)",
    "(pointercancel)": "endDrag($event)",
    "(dblclick)": "onDoubleClick($event)",
    "(click)": "$event.stopPropagation()",
    "(keydown)": "onKeyDown($event)",
  },
  template: `<span
    class="h-full w-0.5 bg-border group-focus-visible/handle:bg-ring"
    aria-hidden="true"
  ></span>`,
})
export class KoResizeHandle {
  readonly width = input.required<number>();
  readonly minSize = input.required<number>();
  readonly maxSize = input.required<number>();
  readonly label = input.required<string>();
  readonly widthChange = output<number>();
  readonly widthReset = output<void>();

  private drag: Drag | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.drag = { pointerId: event.pointerId, startX: event.clientX, startWidth: this.width() };
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // No capture (an inactive or synthetic pointer): the drag still follows moves over the handle.
    }
  }

  protected onPointerMove(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.pointerId !== event.pointerId) return;
    this.widthChange.emit(d.startWidth + (event.clientX - d.startX));
  }

  protected endDrag(event: PointerEvent): void {
    const d = this.drag;
    if (!d || d.pointerId !== event.pointerId) return;
    this.drag = null;
    const target = event.currentTarget as HTMLElement;
    if (target.hasPointerCapture?.(event.pointerId)) target.releasePointerCapture(event.pointerId);
  }

  protected onDoubleClick(event: MouseEvent): void {
    event.stopPropagation();
    this.widthReset.emit();
  }

  protected onKeyDown(event: KeyboardEvent): void {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      this.widthChange.emit(this.width() + (event.key === "ArrowLeft" ? -KEY_STEP : KEY_STEP));
    } else if (event.key === "Enter") {
      event.preventDefault();
      this.widthReset.emit();
    }
  }
}
