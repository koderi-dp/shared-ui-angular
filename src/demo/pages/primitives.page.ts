import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NgIcon } from "@ng-icons/core";
import {
  lucideBell,
  lucideBoxes,
  lucideCheck,
  lucideDatabase,
  lucideFileText,
  lucideLayers,
  lucidePlus,
  lucideRefreshCw,
  lucideServer,
  lucideSettings,
  lucideSparkles,
  lucideTrash2,
} from "@ng-icons/lucide";
import {
  type ChoiceCardOption,
  KoChoiceCards,
  KoDisclosure,
  KoField,
  KoNumberInput,
  KoSwitchField,
} from "@/ui/form.component";
import { notify } from "@/ui/notify";
import { KoPageHeader } from "@/ui/page-header.component";
import { KoPageShell } from "@/ui/page-shell.component";
import { KoBadge } from "@/ui/primitives/badge.component";
import { KoButton, KoIconButton } from "@/ui/primitives/button.component";
import {
  KoCard,
  KoCardContent,
  KoCardDescription,
  KoCardHeader,
  KoCardTitle,
} from "@/ui/primitives/card.component";
import {
  KoDialog,
  KoDialogContent,
  KoDialogDescription,
  KoDialogHeader,
  KoDialogTitle,
  KoDialogTrigger,
} from "@/ui/primitives/dialog.component";
import {
  KoDropdownItem,
  KoDropdownLabel,
  KoDropdownMenu,
  KoDropdownSeparator,
  KoDropdownTrigger,
} from "@/ui/primitives/dropdown-menu.component";
import { KoInput } from "@/ui/primitives/input.directive";
import { KoLabel } from "@/ui/primitives/label.directive";
import { KoScrollArea } from "@/ui/primitives/scroll-area.directive";
import { KoSelect } from "@/ui/primitives/select.component";
import { KoSeparator } from "@/ui/primitives/separator.component";
import {
  KoSheet,
  KoSheetContent,
  KoSheetDescription,
  KoSheetTitle,
  KoSheetTrigger,
} from "@/ui/primitives/sheet.component";
import { KoSkeleton } from "@/ui/primitives/skeleton.component";
import { KoSwitch } from "@/ui/primitives/switch.component";
import { KoTable, KoTableBody, KoTableCell, KoTableRow } from "@/ui/primitives/table.directive";
import { KoTabs, KoTabsContent, KoTabsList, KoTabsTrigger } from "@/ui/primitives/tabs.component";
import { KoTextarea } from "@/ui/primitives/textarea.directive";
import { KoTooltip } from "@/ui/primitives/tooltip.directive";
import { KoStatusBadge, KoStatusDot } from "@/ui/status.component";

type Mode = "single" | "bulk";

/** Every primitive in the registry, on one page, so a change can be seen in the browser. */
@Component({
  selector: "ko-primitives-page",
  imports: [
    FormsModule,
    NgIcon,
    KoPageShell,
    KoPageHeader,
    KoBadge,
    KoButton,
    KoIconButton,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardDescription,
    KoCardContent,
    KoField,
    KoNumberInput,
    KoSwitchField,
    KoDisclosure,
    KoChoiceCards,
    KoInput,
    KoTextarea,
    KoSwitch,
    KoSelect,
    KoLabel,
    KoSeparator,
    KoDialog,
    KoDialogContent,
    KoDialogHeader,
    KoDialogTitle,
    KoDialogDescription,
    KoDialogTrigger,
    KoSheet,
    KoSheetContent,
    KoSheetTitle,
    KoSheetDescription,
    KoSheetTrigger,
    KoTooltip,
    KoDropdownTrigger,
    KoDropdownMenu,
    KoDropdownItem,
    KoDropdownLabel,
    KoDropdownSeparator,
    KoTabs,
    KoTabsList,
    KoTabsTrigger,
    KoTabsContent,
    KoSkeleton,
    KoScrollArea,
    KoTable,
    KoTableBody,
    KoTableRow,
    KoTableCell,
    KoStatusDot,
    KoStatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Primitives"
        title="Components"
        description="The shadcn/new-york set these starters share, with the app's own additions."
      />

      <div class="grid gap-4 xl:grid-cols-2">
        <ko-card>
          <ko-card-header>
            <ko-card-title>Buttons</ko-card-title>
            <ko-card-description
              >An icon, a spinner, or both, with the label unchanged.</ko-card-description
            >
          </ko-card-header>
          <ko-card-content>
            <div class="grid gap-3">
              <div class="flex flex-wrap items-center gap-2">
                @for (variant of variants; track variant) {
                  <button koButton [variant]="variant">{{ variant }}</button>
                }
                <button koButton variant="link">Link</button>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button koButton size="sm">Small</button>
                <button koButton size="default">Default</button>
                <button koButton size="lg">Large</button>
                <button koButton size="icon" aria-label="Add" [icon]="icons.plus"></button>
                <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
                <button koIconButton [icon]="icons.refresh" label="Refresh"></button>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button koButton [icon]="icons.plus" (click)="created()">With icon</button>
                <button koButton loading>Saving…</button>
                <button koButton loading [icon]="icons.check">Saving</button>
                <button koButton disabled>Disabled</button>
                <a koButton variant="secondary" href="#primitives" (click)="$event.preventDefault()"
                  >A slotted link</a
                >
              </div>
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Badges and status</ko-card-title>
            <ko-card-description
              >Status is text plus a colour, never colour alone.</ko-card-description
            >
          </ko-card-header>
          <ko-card-content>
            <div class="grid gap-3">
              <div class="flex flex-wrap items-center gap-2">
                @for (variant of badgeVariants; track variant) {
                  <ko-badge [variant]="variant">{{ variant }}</ko-badge>
                }
              </div>
              <ko-separator />
              <div class="flex flex-wrap items-center gap-2">
                @for (state of states; track state) {
                  <span class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ko-status-dot [state]="state" />
                    {{ state }}
                  </span>
                }
              </div>
              <div class="flex flex-wrap items-center gap-2">
                @for (state of states; track state) {
                  <ko-status-badge [state]="state" />
                }
              </div>
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Fields</ko-card-title>
            <ko-card-description
              >Inset controls with one shared focus treatment.</ko-card-description
            >
          </ko-card-header>
          <ko-card-content>
            <div class="grid gap-4">
              <ko-field label="Name" hint="Shown in lists and the palette.">
                <input koInput placeholder="Nightly ingest" />
              </ko-field>
              <ko-field label="Owner" error="Pick an owner before saving.">
                <input koInput placeholder="Platform" />
              </ko-field>
              <ko-field label="Region">
                <ko-select aria-label="Region" [options]="regions" [(value)]="region" />
              </ko-field>
              <ko-field label="Notes">
                <textarea
                  koTextarea
                  aria-label="Notes"
                  placeholder="Anything the next person should know"
                ></textarea>
              </ko-field>
              <div class="flex items-center gap-3">
                <ko-switch id="retain" [(checked)]="retain" />
                <label koLabel for="retain">Retain history after a stop</label>
              </div>
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Form controls</ko-card-title>
            <ko-card-description
              >The four the starters add on top of the fields.</ko-card-description
            >
          </ko-card-header>
          <ko-card-content>
            <div class="grid gap-4">
              <ko-field label="Workers">
                <ko-number-input
                  aria-label="Workers"
                  [min]="1"
                  [max]="16"
                  [ngModel]="count()"
                  (ngModelChange)="count.set($event)"
                />
              </ko-field>
              <ko-switch-field
                label="Notify on state changes"
                description="A toast whenever an item starts, stops or fails."
                [(checked)]="notifyState"
              />
              <ko-disclosure title="Advanced">
                <ko-field label="Buffer size">
                  <ko-number-input
                    aria-label="Buffer size"
                    [min]="128"
                    [max]="65536"
                    [ngModel]="advanced()"
                    (ngModelChange)="advanced.set($event)"
                  />
                </ko-field>
              </ko-disclosure>
              <ko-choice-cards [options]="modes" [(value)]="mode" />
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Overlays</ko-card-title>
            <ko-card-description>Dialog, sheet, dropdown and tooltip.</ko-card-description>
          </ko-card-header>
          <ko-card-content>
            <div class="flex flex-wrap items-center gap-2">
              <button koButton variant="secondary" [koDialogTrigger]="dialog">Open dialog</button>
              <button koButton variant="secondary" [koSheetTrigger]="sheet">Open sheet</button>
              <button
                koButton
                variant="secondary"
                [icon]="icons.settings"
                [koDropdownTrigger]="menu"
              >
                Menu
              </button>
              <ng-template #menu>
                <ko-dropdown-menu>
                  <ko-dropdown-label>Row actions</ko-dropdown-label>
                  <ko-dropdown-separator />
                  <button koDropdownItem (triggered)="success('Restarted')">
                    <ng-icon aria-hidden="true" size="1rem" [svg]="icons.refresh" />
                    Restart
                  </button>
                  <button koDropdownItem (triggered)="success('Copied')">
                    <ng-icon aria-hidden="true" size="1rem" [svg]="icons.layers" />
                    Duplicate
                  </button>
                  <ko-dropdown-separator />
                  <button koDropdownItem (triggered)="deleted()">
                    <ng-icon aria-hidden="true" size="1rem" [svg]="icons.trash" />
                    Delete
                  </button>
                </ko-dropdown-menu>
              </ng-template>
              <button
                koButton
                variant="outline"
                koTooltip="Tooltips need no provider of their own here."
                koTooltipSide="top"
              >
                Hover me
              </button>
            </div>
            <ko-dialog #dialog [(open)]="dialogOpen">
              <ng-template koDialogContent>
                <ko-dialog-header>
                  <ko-dialog-title>Rename item</ko-dialog-title>
                  <ko-dialog-description
                    >The name is used everywhere the item appears.</ko-dialog-description
                  >
                </ko-dialog-header>
                <ko-field label="Name">
                  <input koInput value="Nightly ingest" />
                </ko-field>
                <div class="flex justify-end gap-2">
                  <button koButton variant="ghost" (click)="dialogOpen.set(false)">Cancel</button>
                  <button koButton [icon]="icons.check" (click)="save()">Save</button>
                </div>
              </ng-template>
            </ko-dialog>
            <ko-sheet #sheet [(open)]="sheetOpen" side="right" width="20rem">
              <ng-template koSheetContent>
                <div class="p-5">
                  <ko-sheet-title>Filters</ko-sheet-title>
                  <ko-sheet-description class="mt-1">
                    The same panel as the mobile sidebar, on the other side.
                  </ko-sheet-description>
                  <p class="mt-4 text-sm text-muted-foreground">
                    A sheet is a dialog that slides in from an edge.
                  </p>
                </div>
              </ng-template>
            </ko-sheet>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Tabs, table and placeholders</ko-card-title>
            <ko-card-description>Dense rows, and what shows while data loads.</ko-card-description>
          </ko-card-header>
          <ko-card-content>
            <ko-tabs [(value)]="tab">
              <ko-tabs-list>
                <button koTabsTrigger value="details">Details</button>
                <button koTabsTrigger value="history">History</button>
              </ko-tabs-list>
              <ko-tabs-content value="details">
                <table koTable>
                  <tbody koTableBody>
                    <tr koTableRow>
                      <td koTableCell class="w-40 text-muted-foreground">Region</td>
                      <td koTableCell>Europe</td>
                    </tr>
                    <tr koTableRow>
                      <td koTableCell class="text-muted-foreground">Owner</td>
                      <td koTableCell>Platform</td>
                    </tr>
                  </tbody>
                </table>
              </ko-tabs-content>
              <ko-tabs-content value="history">
                <div class="grid gap-2">
                  <ko-skeleton class="h-4 w-2/3" />
                  <ko-skeleton class="h-4 w-1/2" />
                  <ko-skeleton class="h-4 w-3/4" />
                </div>
              </ko-tabs-content>
            </ko-tabs>
            <ko-separator class="my-4" />
            <div koScrollArea class="h-28 rounded-lg bg-inset shadow-[var(--shadow-border)]">
              <div class="grid gap-2 p-3 text-sm">
                @for (line of lines; track line) {
                  <span class="text-muted-foreground">{{ line }}</span>
                }
              </div>
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Toasts</ko-card-title>
            <ko-card-description>One set of words for every page, from notify.</ko-card-description>
          </ko-card-header>
          <ko-card-content>
            <div class="flex flex-wrap items-center gap-2">
              <button koButton [icon]="icons.bell" (click)="success('Something went right')">
                success
              </button>
              <button koButton variant="secondary" (click)="created()">created</button>
              <button koButton variant="secondary" (click)="saved('Settings')">saved</button>
              <button koButton variant="secondary" (click)="deleted()">deleted</button>
              <button koButton variant="secondary" (click)="copied()">copied</button>
              <button koButton variant="destructive" (click)="failed()">error</button>
            </div>
          </ko-card-content>
        </ko-card>

        <ko-card>
          <ko-card-header>
            <ko-card-title>Icons</ko-card-title>
            <ko-card-description
              >The lucide icons the pages use, at the size they use them.</ko-card-description
            >
          </ko-card-header>
          <ko-card-content>
            <div class="flex flex-wrap items-center gap-3 text-muted-foreground">
              @for (icon of gallery; track $index) {
                <ng-icon aria-hidden="true" size="1rem" [svg]="icon" />
              }
            </div>
          </ko-card-content>
        </ko-card>
      </div>
    </ko-page-shell>
  `,
})
export class KoPrimitivesPage {
  protected readonly icons = {
    bell: lucideBell,
    check: lucideCheck,
    layers: lucideLayers,
    plus: lucidePlus,
    refresh: lucideRefreshCw,
    settings: lucideSettings,
    trash: lucideTrash2,
  };
  protected readonly gallery = [
    lucideSparkles,
    lucideBoxes,
    lucideServer,
    lucideDatabase,
    lucideLayers,
    lucideFileText,
    lucideSettings,
    lucideRefreshCw,
  ];
  protected readonly states = [
    "running",
    "starting",
    "reconnecting",
    "degraded",
    "failed",
    "stopped",
  ];
  protected readonly variants = [
    "default",
    "secondary",
    "outline",
    "ghost",
    "destructive",
  ] as const;
  protected readonly badgeVariants = [
    "default",
    "outline",
    "live",
    "warn",
    "danger",
    "solid",
  ] as const;
  protected readonly regions = [
    { value: "us", label: "United States" },
    { value: "eu", label: "Europe" },
    { value: "ap", label: "Asia Pacific" },
  ];
  protected readonly modes: ChoiceCardOption<Mode>[] = [
    {
      id: "single",
      label: "One at a time",
      description: "Each item runs on its own.",
      icon: lucideFileText,
    },
    {
      id: "bulk",
      label: "Bulk",
      description: "Many items share a schedule.",
      icon: lucideLayers,
    },
  ];
  protected readonly lines = [
    "Login",
    "Item created",
    "Worker started",
    "Destination connected",
    "Item stopped",
  ];

  protected readonly dialogOpen = signal(false);
  protected readonly sheetOpen = signal(false);
  protected readonly tab = signal("details");
  protected readonly retain = signal(true);
  protected readonly region = signal("eu");
  protected readonly notifyState = signal(false);
  protected readonly count = signal(4);
  protected readonly mode = signal<Mode>("single");
  protected readonly advanced = signal(1024);

  protected success(text: string): void {
    notify.success(text);
  }

  protected created(): void {
    notify.created("Item");
  }

  protected saved(label: string): void {
    notify.saved(label);
  }

  protected deleted(): void {
    notify.deleted("Item");
  }

  protected copied(): void {
    notify.copied();
  }

  protected failed(): void {
    notify.error(new Error("The API is not reachable"));
  }

  protected save(): void {
    this.dialogOpen.set(false);
    notify.saved("Item");
  }
}
