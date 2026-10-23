import { ChangeDetectionStrategy, Component, signal } from "@angular/core";
import { lucidePlus, lucideRefreshCw, lucideSave } from "@ng-icons/lucide";
import { KoBadge } from "@/ui/primitives/badge.component";
import { KoButton, KoIconButton } from "@/ui/primitives/button.component";
import {
  KoCard,
  KoCardContent,
  KoCardDescription,
  KoCardHeader,
  KoCardTitle,
} from "@/ui/primitives/card.component";
import { KoCheckbox } from "@/ui/primitives/checkbox.component";
import {
  KoDialog,
  KoDialogClose,
  KoDialogContent,
  KoDialogDescription,
  KoDialogFooter,
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
import { KoPopover, KoPopoverContent, KoPopoverTrigger } from "@/ui/primitives/popover.component";
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

/** Every primitive in the registry, on one page, so a change can be seen in the browser. */
@Component({
  selector: "ko-primitives-page",
  imports: [
    KoBadge,
    KoButton,
    KoIconButton,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardDescription,
    KoCardContent,
    KoInput,
    KoTextarea,
    KoCheckbox,
    KoSwitch,
    KoSelect,
    KoLabel,
    KoSeparator,
    KoDialog,
    KoDialogContent,
    KoDialogHeader,
    KoDialogTitle,
    KoDialogDescription,
    KoDialogFooter,
    KoDialogClose,
    KoDialogTrigger,
    KoSheet,
    KoSheetContent,
    KoSheetTitle,
    KoSheetDescription,
    KoSheetTrigger,
    KoPopover,
    KoPopoverTrigger,
    KoPopoverContent,
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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-4 p-6 xl:grid-cols-2">
      <ko-card>
        <ko-card-header>
          <ko-card-title>Buttons</ko-card-title>
          <ko-card-description
            >An icon, a spinner, or both, with the label unchanged.</ko-card-description
          >
        </ko-card-header>
        <ko-card-content class="grid gap-3">
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
            <button koButton size="icon" aria-label="Add" [icon]="plus"></button>
            <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
            <button koIconButton [icon]="refresh" label="Refresh"></button>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button koButton [icon]="plus">With icon</button>
            <button koButton [loading]="true">Saving…</button>
            <button koButton [icon]="save" [loading]="true">Saving</button>
            <button koButton [disabled]="true">Disabled</button>
            <a koButton variant="secondary" href="#primitives">A link</a>
          </div>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Badges</ko-card-title>
          <ko-card-description
            >Status is text plus a colour, never colour alone.</ko-card-description
          >
        </ko-card-header>
        <ko-card-content class="grid gap-3">
          <div class="flex flex-wrap items-center gap-2">
            @for (variant of badgeVariants; track variant) {
              <ko-badge [variant]="variant">{{ variant }}</ko-badge>
            }
          </div>
          <ko-separator />
          <div class="flex h-5 items-center gap-3 text-xs text-muted-foreground">
            Left <ko-separator orientation="vertical" /> Right
          </div>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Fields</ko-card-title>
          <ko-card-description>Inset controls with one shared focus treatment.</ko-card-description>
        </ko-card-header>
        <ko-card-content class="grid gap-4">
          <div class="grid gap-1.5">
            <label koLabel for="name">Name</label>
            <input koInput id="name" placeholder="Nightly ingest" />
          </div>
          <div class="grid gap-1.5">
            <label koLabel for="owner">Owner</label>
            <input koInput id="owner" aria-invalid="true" placeholder="Platform" />
          </div>
          <div class="grid gap-1.5">
            <label koLabel for="notes">Notes</label>
            <textarea
              koTextarea
              id="notes"
              placeholder="Anything the next person should know"
            ></textarea>
          </div>
          <div class="grid gap-1.5">
            <label koLabel for="region">Region</label>
            <ko-select id="region" placeholder="Pick a region" [options]="regions" />
          </div>
          <div class="flex items-center gap-2 text-sm">
            <ko-checkbox ariaLabel="Select row" />
            <ko-checkbox ariaLabel="Select all" checked="indeterminate" />
            <ko-checkbox ariaLabel="Disabled" [checked]="true" [disabled]="true" />
            <ko-switch ariaLabel="Enabled" [checked]="true" />
            <ko-switch ariaLabel="Disabled switch" [disabled]="true" />
          </div>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Table and placeholders</ko-card-title>
          <ko-card-description>Dense rows, and what shows while data loads.</ko-card-description>
        </ko-card-header>
        <ko-card-content>
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
          <div class="my-4 grid gap-2">
            <ko-skeleton class="h-4 w-2/3" />
            <ko-skeleton class="h-4 w-1/2" />
            <ko-skeleton class="h-4 w-3/4" />
          </div>
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
          <ko-card-title>Dialog and sheet</ko-card-title>
          <ko-card-description>Focus is trapped, Escape closes, focus returns.</ko-card-description>
        </ko-card-header>
        <ko-card-content class="flex flex-wrap items-center gap-2">
          <button koButton variant="outline" [koDialogTrigger]="dialog">Open dialog</button>
          <ko-dialog #dialog [(open)]="dialogOpen">
            <ng-template koDialogContent>
              <ko-dialog-header>
                <ko-dialog-title>Delete connection</ko-dialog-title>
                <ko-dialog-description>This cannot be undone.</ko-dialog-description>
              </ko-dialog-header>
              <ko-dialog-footer>
                <button koButton variant="ghost" koDialogClose>Cancel</button>
                <button koButton variant="destructive" koDialogClose>Delete</button>
              </ko-dialog-footer>
            </ng-template>
          </ko-dialog>
          <button koButton variant="outline" [koSheetTrigger]="sheet">Open sheet</button>
          <ko-sheet #sheet [(open)]="sheetOpen" side="right">
            <ng-template koSheetContent>
              <div class="grid gap-1 p-4 pr-12">
                <ko-sheet-title>Filters</ko-sheet-title>
                <ko-sheet-description>Narrow the list.</ko-sheet-description>
              </div>
            </ng-template>
          </ko-sheet>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Popover, tooltip and menu</ko-card-title>
          <ko-card-description>Anchored overlays; Escape closes and refocuses.</ko-card-description>
        </ko-card-header>
        <ko-card-content class="flex flex-wrap items-center gap-2">
          <button koButton variant="outline" [koPopoverTrigger]="popover">Popover</button>
          <ko-popover #popover [(open)]="popoverOpen">
            <ng-template koPopoverContent>
              <p class="p-2 text-sm">Three more tags: api, edge, beta.</p>
            </ng-template>
          </ko-popover>
          <button koButton variant="outline" koTooltip="Shown after 300ms" koTooltipSide="bottom">
            Tooltip
          </button>
          <button koButton variant="outline" [koDropdownTrigger]="menu">Menu</button>
          <ng-template #menu>
            <ko-dropdown-menu>
              <ko-dropdown-label>Connection</ko-dropdown-label>
              <button koDropdownItem (triggered)="lastAction.set('Edit')">Edit</button>
              <button koDropdownItem (triggered)="lastAction.set('Duplicate')">Duplicate</button>
              <ko-dropdown-separator />
              <button koDropdownItem variant="destructive" (triggered)="lastAction.set('Delete')">
                Delete
              </button>
            </ko-dropdown-menu>
          </ng-template>
          <span class="text-xs text-muted-foreground">Last action: {{ lastAction() }}</span>
        </ko-card-content>
      </ko-card>

      <ko-card>
        <ko-card-header>
          <ko-card-title>Tabs</ko-card-title>
          <ko-card-description>Arrow keys move between tabs and activate them.</ko-card-description>
        </ko-card-header>
        <ko-card-content>
          <ko-tabs [(value)]="tab">
            <ko-tabs-list>
              <button koTabsTrigger value="overview">Overview</button>
              <button koTabsTrigger value="activity">Activity</button>
              <button koTabsTrigger value="settings">Settings</button>
            </ko-tabs-list>
            <ko-tabs-content value="overview">Overview panel.</ko-tabs-content>
            <ko-tabs-content value="activity">Activity panel.</ko-tabs-content>
            <ko-tabs-content value="settings">Settings panel.</ko-tabs-content>
          </ko-tabs>
        </ko-card-content>
      </ko-card>
    </div>
  `,
})
export class KoPrimitivesPage {
  protected readonly popoverOpen = signal(false);
  protected readonly lastAction = signal("none");
  protected readonly tab = signal("overview");
  protected readonly dialogOpen = signal(false);
  protected readonly sheetOpen = signal(false);
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
    { value: "eu", label: "Europe" },
    { value: "us", label: "United States" },
  ];
  protected readonly lines = [
    "Login",
    "Item created",
    "Worker started",
    "Destination connected",
    "Item stopped",
  ];
  protected readonly plus = lucidePlus;
  protected readonly refresh = lucideRefreshCw;
  protected readonly save = lucideSave;
}
