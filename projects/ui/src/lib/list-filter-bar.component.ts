import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  viewChild,
  type ElementRef,
} from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { lucideSearch, lucideX } from "@ng-icons/lucide";
import { KoButton, KoIconButton } from "./primitives/button.component";
import { embeddedFieldClass, embeddedFieldFocusClass } from "./primitives/field-control";
import { KoInput } from "./primitives/input.directive";
import { cn } from "./utils";

/** A filter field with a search icon. Escape, or the clear button, empties it. */
@Component({
  selector: "ko-list-filter-bar",
  imports: [NgIcon, KoInput, KoIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `
    <ng-icon
      aria-hidden="true"
      size="0.875rem"
      class="shrink-0 text-muted-foreground"
      [svg]="search"
    />
    <input
      #field
      koInput
      aria-label="Filter"
      [class]="inputClass"
      [value]="value()"
      [placeholder]="placeholder()"
      (input)="value.set(field.value)"
      (keydown)="onKeydown($event)"
    />
    @if (value()) {
      <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
      <button
        koIconButton
        class="size-7 shrink-0"
        label="Clear filter"
        [icon]="x"
        (click)="clear()"
      ></button>
    }
  `,
})
export class KoListFilterBar {
  readonly value = model("");
  readonly placeholder = input("Filter…");
  readonly class = input<string>("");

  protected readonly search = lucideSearch;
  protected readonly x = lucideX;
  protected readonly inputClass = cn("h-8 flex-1", embeddedFieldClass, embeddedFieldFocusClass);
  protected readonly classes = computed(() =>
    cn(
      "flex items-center gap-2 rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-border)]",
      this.class(),
    ),
  );
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>("field");

  protected clear(): void {
    this.value.set("");
    this.field().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape" && this.value()) {
      event.preventDefault();
      this.clear();
    }
  }
}

/** The bar that appears over a list once rows are selected. Actions go in as content. */
@Component({
  selector: "ko-selection-toolbar",
  imports: [KoButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `
    <span class="text-xs text-muted-foreground">{{ count() }} selected</span>
    <ng-content />
    <button
      koButton
      size="sm"
      variant="ghost"
      class="h-7 px-2 text-xs"
      [icon]="x"
      [disabled]="count() === 0"
      (click)="clear.emit()"
    >
      Clear
    </button>
  `,
})
export class KoSelectionToolbar {
  readonly count = input.required<number>();
  /** Keep layout height when count is 0 (e.g. fixed footer). */
  readonly alwaysVisible = input(false, { transform: booleanAttribute });
  readonly class = input<string>("");
  readonly clear = output<void>();

  protected readonly x = lucideX;
  protected readonly classes = computed(() => {
    const empty = this.count() === 0;
    return cn(
      "flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2",
      this.alwaysVisible() && empty && "opacity-60",
      !this.alwaysVisible() && empty && "hidden",
      this.class(),
    );
  });
}
