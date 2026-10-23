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
import { NgIcon } from "@ng-icons/core";
import { lucideCheck, lucideMinus } from "@ng-icons/lucide";
import { cn } from "@/ui/utils";

export type KoCheckedState = boolean | "indeterminate";

/**
 * A checkbox that works with `formControl`/`ngModel` or `[(checked)]`. `"indeterminate"` renders
 * `aria-checked="mixed"` and a minus; the next toggle checks it.
 */
@Component({
  selector: "ko-checkbox",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KoCheckbox), multi: true },
  ],
  host: {
    class: "contents",
    "[attr.id]": "null",
    "[attr.aria-label]": "null",
    "[attr.aria-invalid]": "null",
    "[attr.aria-describedby]": "null",
  },
  template: `
    <button
      type="button"
      role="checkbox"
      [id]="id() ?? null"
      [class]="classes()"
      [disabled]="inactive()"
      [attr.aria-checked]="ariaChecked()"
      [attr.aria-label]="ariaLabel() ?? null"
      [attr.aria-invalid]="ariaInvalid() ?? null"
      [attr.aria-describedby]="ariaDescribedby() ?? null"
      [attr.data-state]="state()"
      [attr.data-disabled]="inactive() ? '' : null"
      (click)="toggle()"
      (keydown)="onKeydown($event)"
      (keyup)="onKeyup($event)"
      (blur)="onTouched()"
    >
      @if (checked() !== false) {
        <ng-icon
          aria-hidden="true"
          size="0.75rem"
          strokeWidth="3"
          [svg]="checked() === 'indeterminate' ? minus : check"
        />
      }
    </button>
  `,
})
export class KoCheckbox implements ControlValueAccessor {
  readonly checked = model<KoCheckedState>(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | undefined>(undefined, { alias: "aria-label" });
  /** Lands on the inner button, so a `<label for>` reaches it; the host never keeps the `id`. */
  readonly id = input<string>();
  readonly ariaInvalid = input<boolean | "true" | "false" | undefined>(undefined, {
    alias: "aria-invalid",
  });
  readonly ariaDescribedby = input<string | undefined>(undefined, { alias: "aria-describedby" });
  readonly class = input<string>("");

  protected readonly check = lucideCheck;
  protected readonly minus = lucideMinus;
  private readonly formDisabled = signal(false);
  protected readonly inactive = computed(() => this.disabled() || this.formDisabled());
  protected readonly state = computed(() => {
    const checked = this.checked();
    return checked === "indeterminate" ? "indeterminate" : checked ? "checked" : "unchecked";
  });
  protected readonly ariaChecked = computed(() => {
    const checked = this.checked();
    return checked === "indeterminate" ? "mixed" : String(checked);
  });
  protected readonly classes = computed(() =>
    cn(
      "peer inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] bg-inset text-primary-foreground shadow-[var(--shadow-border)] transition-[background-color] duration-150 focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary",
      this.class(),
    ),
  );

  private onChange: (value: KoCheckedState) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: KoCheckedState | null): void {
    this.checked.set(value ?? false);
  }
  registerOnChange(fn: (value: KoCheckedState) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  protected toggle(): void {
    if (this.inactive()) return;
    const next = this.checked() !== true;
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter") event.preventDefault();
    if (event.key !== " ") return;
    event.preventDefault();
    this.toggle();
  }

  /** The keydown already toggled; stop the native keyup click from toggling twice. */
  protected onKeyup(event: KeyboardEvent): void {
    if (event.key === " ") event.preventDefault();
  }
}
