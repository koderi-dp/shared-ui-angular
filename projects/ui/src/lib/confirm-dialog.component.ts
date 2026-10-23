import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from "@angular/core";
import { lucideCheck, lucideTriangleAlert } from "@ng-icons/lucide";
import { KoButton } from "./primitives/button.component";
import {
  KoDialog,
  KoDialogContent,
  KoDialogDescription,
  KoDialogHeader,
  KoDialogTitle,
} from "./primitives/dialog.component";

/**
 * A confirm step. `[(open)]` closes it on Cancel, Escape and a backdrop click (the last two are ignored while `pending`); `(confirm)` leaves
 * closing to the caller, so the dialog can stay up with `pending` while the work runs. Extra body
 * content goes between the description and the buttons.
 */
@Component({
  selector: "ko-confirm-dialog",
  imports: [
    KoDialog,
    KoDialogContent,
    KoDialogHeader,
    KoDialogTitle,
    KoDialogDescription,
    KoButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", class: "contents" },
  template: `
    <ko-dialog [open]="open()" [disableClose]="pending()" (openChange)="open.set($event)">
      <ng-template koDialogContent>
        <ko-dialog-header>
          <ko-dialog-title>{{ title() }}</ko-dialog-title>
          <ko-dialog-description>{{ description() }}</ko-dialog-description>
        </ko-dialog-header>
        <ng-content />
        <div class="flex justify-end gap-2">
          <button
            koButton
            type="button"
            variant="ghost"
            [disabled]="pending()"
            (click)="open.set(false)"
          >
            {{ cancelLabel() }}
          </button>
          <button
            koButton
            type="button"
            [icon]="destructive() ? alert : check"
            [loading]="pending()"
            [variant]="destructive() ? 'destructive' : 'default'"
            [disabled]="pending()"
            (click)="confirm.emit()"
          >
            {{ confirmLabel() }}
          </button>
        </div>
      </ng-template>
    </ko-dialog>
  `,
})
export class KoConfirmDialog {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly confirmLabel = input("Confirm");
  readonly cancelLabel = input("Cancel");
  readonly destructive = input(false, { transform: booleanAttribute });
  readonly pending = input(false, { transform: booleanAttribute });
  readonly confirm = output<void>();

  protected readonly alert = lucideTriangleAlert;
  protected readonly check = lucideCheck;
}
