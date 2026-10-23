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
    role: "checkbox",
    "[class]": "classes()",
    "[attr.tabindex]": "inactive() ? -1 : 0",
    "[attr.aria-checked]": "ariaChecked()",
    "[attr.aria-label]": "ariaLabel() ?? null",
    "[attr.aria-disabled]": "inactive() ? 'true' : null",
    "[attr.data-state]": "state()",
    "[attr.data-disabled]": "inactive() ? '' : null",
    "(click)": "toggle()",
    "(keydown)": "onKeydown($event)",
    "(blur)": "onTouched()",
  },
  template: `
    @if (checked() !== false) {
      <ng-icon
        aria-hidden="true"
        size="0.75rem"
        strokeWidth="3"
        [svg]="checked() === 'indeterminate' ? minus : check"
      />
    }
  `,
})
export class KoCheckbox implements ControlValueAccessor {
  readonly checked = model<KoCheckedState>(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
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
    if (event.key !== " ") return;
    event.preventDefault();
    this.toggle();
  }
}
