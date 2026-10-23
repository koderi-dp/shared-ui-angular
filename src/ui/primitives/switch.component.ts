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
import { cn } from "@/ui/utils";

/** An on/off switch that works with `formControl`/`ngModel` or `[(checked)]`. Space toggles it. */
@Component({
  selector: "ko-switch",
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KoSwitch), multi: true }],
  host: {
    role: "switch",
    "[class]": "classes()",
    "[attr.tabindex]": "inactive() ? -1 : 0",
    "[attr.aria-checked]": "checked()",
    "[attr.aria-label]": "ariaLabel() ?? null",
    "[attr.aria-disabled]": "inactive() ? 'true' : null",
    "[attr.data-state]": "checked() ? 'checked' : 'unchecked'",
    "[attr.data-disabled]": "inactive() ? '' : null",
    "(click)": "toggle()",
    "(keydown)": "onKeydown($event)",
    "(blur)": "onTouched()",
  },
  template: `<span [class]="thumbClasses()"></span>`,
})
export class KoSwitch implements ControlValueAccessor {
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly class = input<string>("");

  private readonly formDisabled = signal(false);
  protected readonly inactive = computed(() => this.disabled() || this.formDisabled());
  protected readonly classes = computed(() =>
    cn(
      "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full shadow-[var(--shadow-border)] transition-[background-color] duration-150 focus-visible:shadow-[var(--shadow-border-hover)] focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary",
      this.class(),
    ),
  );
  protected readonly thumbClasses = computed(() =>
    cn(
      "pointer-events-none block size-5 rounded-full bg-foreground transition-transform duration-150",
      this.checked() ? "translate-x-4 bg-primary-foreground" : "translate-x-0.5",
    ),
  );

  private onChange: (value: boolean) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(value: boolean | null): void {
    this.checked.set(!!value);
  }
  registerOnChange(fn: (value: boolean) => void): void {
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
    const next = !this.checked();
    this.checked.set(next);
    this.onChange(next);
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    this.toggle();
  }
}
