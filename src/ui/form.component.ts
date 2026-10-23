import {
  afterRenderEffect,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  model,
  signal,
} from "@angular/core";
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { NgIcon } from "@ng-icons/core";
import { lucideChevronRight } from "@ng-icons/lucide";
import { KoInput } from "@/ui/primitives/input.directive";
import { KoSwitch } from "@/ui/primitives/switch.component";
import { cn } from "@/ui/utils";

let nextId = 0;

/**
 * Label above the control, unit in the label, hint or error below. The first control inside is
 * marked invalid and pointed at the message, so the error is more than red text.
 */
@Component({
  selector: "ko-field",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", class: "contents" },
  template: `
    <!-- The label wraps whatever control is projected, so it is associated with it. -->
    <!-- eslint-disable-next-line @angular-eslint/template/label-has-associated-control -->
    <label [class]="classes()">
      <span class="text-xs font-medium text-muted-foreground">{{ label() }}</span>
      <ng-content />
      @if (error()) {
        <span [id]="messageId" role="alert" class="text-xs text-danger-fg">{{ error() }}</span>
      } @else if (hint()) {
        <span [id]="messageId" class="text-xs text-muted-foreground">{{ hint() }}</span>
      }
    </label>
  `,
})
export class KoField {
  readonly label = input.required<string>();
  readonly hint = input<string>();
  readonly error = input<string>();
  readonly class = input<string>("");

  protected readonly messageId = `ko-field-message-${nextId++}`;
  protected readonly classes = computed(() => cn("grid content-start gap-1.5", this.class()));

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private original: { invalid: string | null; describedBy: string | null } | undefined;

  constructor() {
    afterRenderEffect(() => {
      const error = this.error();
      const message = error || this.hint();
      const control = this.host.querySelector<HTMLElement>("input, textarea, select, button");
      if (!control) return;
      this.original ??= {
        invalid: control.getAttribute("aria-invalid"),
        describedBy: control.getAttribute("aria-describedby"),
      };
      const invalid = error ? "true" : this.original.invalid;
      const describedBy = message ? this.messageId : this.original.describedBy;
      if (invalid === null) control.removeAttribute("aria-invalid");
      else control.setAttribute("aria-invalid", invalid);
      if (describedBy === null) control.removeAttribute("aria-describedby");
      else control.setAttribute("aria-describedby", describedBy);
    });
  }
}

/**
 * Whole-number input. Keeps the typed text while it is being edited so the field can be emptied
 * and retyped, and reports a number only when the text is one. Works with `formControl`/`ngModel`.
 */
@Component({
  selector: "ko-number-input",
  imports: [KoInput],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => KoNumberInput), multi: true },
  ],
  host: { class: "contents" },
  template: `
    <input
      koInput
      inputmode="numeric"
      [class]="inputClasses()"
      [value]="text()"
      [disabled]="inactive()"
      [attr.aria-label]="ariaLabel() ?? null"
      (input)="onInput($event)"
      (blur)="onBlur()"
    />
  `,
})
export class KoNumberInput implements ControlValueAccessor {
  readonly min = input<number>();
  readonly max = input<number>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string>();
  readonly class = input<string>("");

  private readonly value = signal(0);
  protected readonly text = signal("0");
  private readonly formDisabled = signal(false);
  protected readonly inactive = computed(() => this.disabled() || this.formDisabled());
  protected readonly inputClasses = computed(() => cn("tabular-nums", this.class()));

  private onChange: (value: number) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: number | null): void {
    const next = value ?? 0;
    this.value.set(next);
    const current = this.text();
    this.text.set(Number(current) === next && current !== "" ? current : String(next));
  }
  registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  private clamp(value: number): number {
    return Math.min(this.max() ?? Infinity, Math.max(this.min() ?? 0, value));
  }

  private commit(next: number): void {
    if (next === this.value()) return;
    this.value.set(next);
    this.onChange(next);
  }

  protected onInput(event: Event): void {
    const field = event.target as HTMLInputElement;
    let text = field.value.replace(/[^\d]/g, "");
    const max = this.max();
    if (text !== "" && max != null && Number(text) > max) text = String(max);
    // The input keeps what the browser put in it unless told otherwise, so write the text back.
    if (field.value !== text) field.value = text;
    this.text.set(text);
    if (text !== "") this.commit(Number(text));
  }

  protected onBlur(): void {
    const text = this.text();
    const parsed = this.clamp(text === "" ? (this.min() ?? 0) : Number(text));
    this.text.set(String(parsed));
    this.commit(parsed);
    this.onTouched();
  }
}

/** A switch with its label and description beside it. */
@Component({
  selector: "ko-switch-field",
  imports: [KoSwitch],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", class: "flex items-start gap-3" },
  template: `
    <ko-switch
      class="mt-0.5"
      [id]="id"
      [ariaLabel]="label()"
      [disabled]="disabled()"
      [(checked)]="checked"
    />
    <label [for]="id" class="grid cursor-pointer gap-0.5">
      <span class="text-sm">{{ label() }}</span>
      @if (description()) {
        <span class="text-xs text-muted-foreground">{{ description() }}</span>
      }
    </label>
  `,
})
export class KoSwitchField {
  readonly checked = model(false);
  readonly label = input.required<string>();
  readonly description = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });

  protected readonly id = `ko-switch-field-${nextId++}`;
}

/** Advanced fields sit behind this, closed by default. */
@Component({
  selector: "ko-disclosure",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", class: "block rounded-lg shadow-[var(--shadow-border)]" },
  template: `
    <button
      type="button"
      class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
      [attr.aria-expanded]="open()"
      (click)="chosen.set(!open())"
    >
      <ng-icon
        aria-hidden="true"
        size="0.875rem"
        class="transition-transform"
        [class.rotate-90]="open()"
        [svg]="chevron"
      />
      {{ title() }}
    </button>
    @if (open()) {
      <div class="grid gap-4 border-t border-border px-3 py-4">
        <ng-content />
      </div>
    }
  `,
})
export class KoDisclosure {
  readonly title = input.required<string>();
  readonly defaultOpen = input(false, { transform: booleanAttribute });
  /** Keeps it open while a field inside has an error to show. */
  readonly forceOpen = input(false, { transform: booleanAttribute });

  protected readonly chevron = lucideChevronRight;
  protected readonly chosen = linkedSignal(() => this.defaultOpen());
  protected readonly open = computed(() => this.chosen() || this.forceOpen());
}

export type ChoiceCardOption<T extends string = string> = {
  id: T;
  label: string;
  description: string;
  /** An `@ng-icons/lucide` SVG string. */
  icon: string;
};

/** A choice between a few options drawn as cards, for the first step of the create flow. */
@Component({
  selector: "ko-choice-cards",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: "radiogroup", class: "grid gap-2 sm:grid-cols-2" },
  template: `
    @for (option of options(); track option.id) {
      <button
        type="button"
        role="radio"
        [attr.aria-checked]="option.id === value()"
        [class]="cardClasses(option.id === value())"
        (click)="value.set(option.id)"
      >
        <span
          class="grid size-8 shrink-0 place-items-center rounded-md bg-inset text-muted-foreground shadow-[var(--shadow-border)]"
        >
          <ng-icon aria-hidden="true" size="1rem" [svg]="option.icon" />
        </span>
        <span class="grid gap-0.5">
          <span class="text-sm font-medium">{{ option.label }}</span>
          <span class="text-xs text-muted-foreground">{{ option.description }}</span>
        </span>
      </button>
    }
  `,
})
export class KoChoiceCards<T extends string = string> {
  readonly value = model.required<T>();
  readonly options = input.required<readonly ChoiceCardOption<T>[]>();

  protected cardClasses(active: boolean): string {
    return cn(
      "flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-[background-color,box-shadow]",
      active
        ? "bg-secondary shadow-[var(--shadow-border-hover)]"
        : "shadow-[var(--shadow-border)] hover:bg-secondary/50",
    );
  }
}
