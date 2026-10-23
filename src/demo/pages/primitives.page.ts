import { ChangeDetectionStrategy, Component } from "@angular/core";
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
import { KoInput } from "@/ui/primitives/input.directive";
import { KoLabel } from "@/ui/primitives/label.directive";
import { KoScrollArea } from "@/ui/primitives/scroll-area.directive";
import { KoSeparator } from "@/ui/primitives/separator.component";
import { KoSkeleton } from "@/ui/primitives/skeleton.component";
import { KoTable, KoTableBody, KoTableCell, KoTableRow } from "@/ui/primitives/table.directive";
import { KoTextarea } from "@/ui/primitives/textarea.directive";

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
    KoLabel,
    KoSeparator,
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
    </div>
  `,
})
export class KoPrimitivesPage {
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
