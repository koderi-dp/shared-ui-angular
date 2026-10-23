// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  model,
  signal,
} from "@angular/core";
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { fieldControlClass, fieldFocusClass } from "@/ui/primitives/field-control";
import { cn } from "@/ui/utils";

const CHEVRON =
  "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238b909c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export interface KoSelectOption {
  value: string;
  label: string;
}

/**
 * A styled native `<select>` (as in the React original), so the platform picker, keyboard and
 * mobile behaviour come for free. Works with `formControl`/`ngModel` or `[(value)]`.
 */
@Component({
  selector: "ko-select",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KoSelect), multi: true }],
  host: { class: "contents" },
  template: `
    <select
      [class]="classes()"
      [style.background-image]="chevron"
      [style.background-repeat]="'no-repeat'"
      [style.background-position]="position()"
      [style.background-size]="fieldSize() === 'sm' ? '0.875rem' : '1rem'"
      [disabled]="inactive()"
      [attr.aria-label]="ariaLabel() ?? null"
      (change)="onSelect($event)"
      (blur)="onTouched()"
    >
      @if (placeholder(); as text) {
        <option value="" disabled hidden [selected]="!value()">{{ text }}</option>
      }
      @for (option of options(); track option.value) {
        <option [value]="option.value" [selected]="option.value === value()">
          {{ option.label }}
        </option>
      }
    </select>
  `,
})
export class KoSelect implements ControlValueAccessor {
  readonly value = model<string>();
  readonly options = input.required<KoSelectOption[]>();
  readonly placeholder = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fieldSize = input<"default" | "sm">("default");
  readonly ariaLabel = input<string>();
  readonly class = input<string>("");

  protected readonly chevron = CHEVRON;
  private readonly formDisabled = signal(false);
  protected readonly inactive = computed(() => this.disabled() || this.formDisabled());
  protected readonly position = computed(() =>
    this.fieldSize() === "sm" ? "right 0.5rem center" : "right 0.75rem center",
  );
  protected readonly classes = computed(() =>
    cn(
      "flex w-full appearance-none disabled:cursor-not-allowed disabled:opacity-50",
      fieldControlClass,
      fieldFocusClass,
      this.fieldSize() === "sm" ? "h-8 py-1 pl-2 pr-8 text-xs" : "h-10 py-2 pl-3 pr-10 text-sm",
      this.class(),
    ),
  );

  private onChange: (value: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value.set(value ?? undefined);
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected onSelect(event: Event): void {
    const next = (event.target as HTMLSelectElement).value;
    this.value.set(next);
    this.onChange(next);
    this.onTouched();
  }
}
