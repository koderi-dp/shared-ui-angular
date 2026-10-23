import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { lucideBell, lucideDatabase, lucideSlidersHorizontal } from "@ng-icons/lucide";
import {
  KoDisclosure,
  KoField,
  KoNumberInput,
  KoSwitchField,
  notify,
  KoPageHeader,
  KoPageShell,
  KoInput,
  KoSettingsSaveFooter,
  KoSettingsSectionLayout,
  type SettingsSectionDefinition,
} from "@koderi-dp/ui";

type SectionId = "general" | "notifications" | "storage";

const SECTIONS: readonly SettingsSectionDefinition<SectionId>[] = [
  {
    id: "general",
    label: "General",
    description: "Name, workers and defaults",
    icon: lucideSlidersHorizontal,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "What raises a toast",
    icon: lucideBell,
  },
  { id: "storage", label: "Storage", description: "Where data is kept", icon: lucideDatabase },
];

type Form = {
  name: string;
  workers: number;
  notifyOnChange: boolean;
  retentionDays: number;
  path: string;
};

const INITIAL: Form = {
  name: "Showcase",
  workers: 4,
  notifyOnChange: true,
  retentionDays: 30,
  path: "/var/lib/showcase",
};

/** The settings frame: a section list, one form per section, and a footer that knows if it is dirty. */
@Component({
  selector: "ko-settings-page",
  imports: [
    KoPageShell,
    KoPageHeader,
    KoSettingsSectionLayout,
    KoSettingsSaveFooter,
    KoField,
    KoNumberInput,
    KoSwitchField,
    KoDisclosure,
    KoInput,
    FormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Configuration"
        title="Settings"
        description="Sections on the left, one form at a time, and a footer that says whether there is anything to save."
      />
      <form
        ngNoForm
        class="flex min-h-[30rem] flex-col overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]"
        (submit)="onSubmit($event)"
      >
        <ko-settings-section-layout
          label="Settings sections"
          [sections]="sections"
          [(activeSection)]="section"
        >
          @switch (section()) {
            @case ("general") {
              <div class="grid gap-4">
                <ko-field label="Name" hint="What the app calls itself.">
                  <input
                    koInput
                    aria-label="Name"
                    [value]="form().name"
                    (input)="set('name', text($event))"
                  />
                </ko-field>
                <ko-field label="Workers">
                  <ko-number-input
                    aria-label="Workers"
                    [min]="1"
                    [max]="16"
                    [ngModel]="form().workers"
                    (ngModelChange)="set('workers', $event)"
                  />
                </ko-field>
                <ko-disclosure title="Advanced" [forceOpen]="form().workers > 8">
                  <ko-field label="Retention" hint="Days of history to keep.">
                    <ko-number-input
                      aria-label="Retention"
                      [min]="1"
                      [max]="365"
                      [ngModel]="form().retentionDays"
                      (ngModelChange)="set('retentionDays', $event)"
                    />
                  </ko-field>
                </ko-disclosure>
              </div>
            }
            @case ("notifications") {
              <div class="grid gap-4">
                <ko-switch-field
                  label="Toast on every state change"
                  description="Off means only failures are announced."
                  [checked]="form().notifyOnChange"
                  (checkedChange)="set('notifyOnChange', $event)"
                />
              </div>
            }
            @case ("storage") {
              <div class="grid gap-4">
                <ko-field label="Data directory" hint="Must be writable by the service.">
                  <input
                    koInput
                    aria-label="Data directory"
                    [value]="form().path"
                    (input)="set('path', text($event))"
                  />
                </ko-field>
              </div>
            }
          }
        </ko-settings-section-layout>
        <ko-settings-save-footer
          submitLabel="Save settings"
          note="Saving restarts the workers."
          discardable
          [dirty]="dirty()"
          [isSaving]="isSaving()"
          (cancel)="form.set(saved())"
        />
      </form>
    </ko-page-shell>
  `,
})
export class KoSettingsPage {
  protected readonly sections = SECTIONS;
  protected readonly section = signal<SectionId>("general");
  protected readonly form = signal<Form>(INITIAL);
  protected readonly saved = signal<Form>(INITIAL);
  protected readonly isSaving = signal(false);
  protected readonly dirty = computed(
    () => JSON.stringify(this.form()) !== JSON.stringify(this.saved()),
  );

  protected set<K extends keyof Form>(key: K, value: Form[K]): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected text(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.dirty()) return;
    this.isSaving.set(true);
    // A real app would await the API here.
    setTimeout(() => {
      this.isSaving.set(false);
      this.saved.set(this.form());
      notify.saved("Settings");
    }, 600);
  }
}
