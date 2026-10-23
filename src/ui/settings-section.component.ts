import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { lucideSave } from "@ng-icons/lucide";
import { KoButton } from "@/ui/primitives/button.component";
import { cn } from "@/ui/utils";

export type SettingsSectionDefinition<Id extends string = string> = {
  id: Id;
  label: string;
  description: string;
  /** An `@ng-icons/lucide` SVG string. */
  icon: string;
};

/** Pylon's settings layout: a section list with descriptions beside the form. */
@Component({
  selector: "ko-settings-section-layout",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "flex min-h-0 flex-1 flex-col md:flex-row" },
  template: `
    @if (section(); as current) {
      <nav
        class="shrink-0 border-b border-border md:w-52 md:border-r md:border-b-0"
        [attr.aria-label]="label()"
      >
        <div class="flex gap-1 overflow-x-auto p-2 md:grid md:overflow-visible md:p-3">
          @for (item of sections(); track item.id) {
            <button
              type="button"
              [class]="itemClasses(item.id === current.id)"
              [attr.aria-current]="item.id === current.id ? 'page' : null"
              (click)="activeSection.set(item.id)"
            >
              <ng-icon aria-hidden="true" size="1rem" class="shrink-0" [svg]="item.icon" />
              <span class="grid gap-0.5">
                <span class="text-sm font-medium">{{ item.label }}</span>
                <span class="hidden text-[11px] leading-tight text-muted-foreground md:block">
                  {{ item.description }}
                </span>
              </span>
            </button>
          }
        </div>
      </nav>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="grid w-full max-w-2xl content-start gap-4 px-4 py-4 md:px-6 md:py-5">
          <div class="border-b border-border pb-3">
            <h3 class="text-base font-semibold">{{ current.label }}</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">{{ current.description }}</p>
          </div>
          <ng-content />
        </div>
      </div>
    }
  `,
})
export class KoSettingsSectionLayout<Id extends string = string> {
  readonly label = input.required<string>();
  readonly sections = input.required<readonly SettingsSectionDefinition<Id>[]>();
  readonly activeSection = model.required<Id>();

  protected readonly section = computed(
    () => this.sections().find((item) => item.id === this.activeSection()) ?? this.sections()[0],
  );

  protected itemClasses(active: boolean): string {
    return cn(
      "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-left transition-colors md:w-full",
      active
        ? "bg-secondary text-foreground shadow-[var(--shadow-border)]"
        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
    );
  }
}

/** Sticky footer of a settings form. Says whether there is anything to save. */
@Component({
  selector: "ko-settings-save-footer",
  imports: [KoButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "block shrink-0 border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
  },
  template: `
    <div class="flex items-center justify-between gap-3">
      <span class="min-w-0 text-xs text-muted-foreground" aria-live="polite">{{ message() }}</span>
      <div class="flex shrink-0 items-center gap-2">
        @if (dirty()) {
          <button
            koButton
            size="sm"
            type="button"
            variant="ghost"
            [disabled]="isSaving()"
            (click)="cancel.emit()"
          >
            Discard
          </button>
        }
        <button
          koButton
          size="sm"
          type="submit"
          [icon]="save"
          [loading]="isSaving()"
          [disabled]="!dirty()"
        >
          {{ submitLabel() }}
        </button>
      </div>
    </div>
  `,
})
export class KoSettingsSaveFooter {
  readonly dirty = input.required({ transform: booleanAttribute });
  readonly isSaving = input(false, { transform: booleanAttribute });
  readonly submitLabel = input("Save");
  /** What saving will do beyond storing the change, such as restarting a service. */
  readonly note = input<string>();
  // eslint-disable-next-line @angular-eslint/no-output-native -- the name is the component contract
  readonly cancel = output<void>();

  protected readonly save = lucideSave;
  protected readonly message = computed(() =>
    this.isSaving()
      ? "Saving changes…"
      : this.dirty()
        ? (this.note() ?? "Unsaved changes")
        : "All changes saved",
  );
}
