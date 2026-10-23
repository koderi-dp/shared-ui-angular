import { ChangeDetectionStrategy, Component, computed, signal } from "@angular/core";
import { lucideDownload, lucidePlus, lucideTrash2 } from "@ng-icons/lucide";
import { KoConfirmDialog } from "@/ui/confirm-dialog.component";
import { KoListFilterBar, KoSelectionToolbar } from "@/ui/list-filter-bar.component";
import { notify } from "@/ui/notify";
import { KoPageHeader } from "@/ui/page-header.component";
import { KoPageShell } from "@/ui/page-shell.component";
import { KoButton } from "@/ui/primitives/button.component";
import { KoCheckbox, type KoCheckedState } from "@/ui/primitives/checkbox.component";
import {
  KoTable,
  KoTableBody,
  KoTableCell,
  KoTableHead,
  KoTableHeader,
  KoTableRow,
} from "@/ui/primitives/table.directive";
import { KoStatusBadge } from "@/ui/status.component";
import { formatBytes } from "@/ui/utils";
import { demoItems } from "@/demo/items";

/** The furniture around a list page: header, filter bar, selection toolbar, confirm step. */
@Component({
  selector: "ko-blocks-page",
  imports: [
    KoPageShell,
    KoPageHeader,
    KoListFilterBar,
    KoSelectionToolbar,
    KoConfirmDialog,
    KoStatusBadge,
    KoButton,
    KoCheckbox,
    KoTable,
    KoTableHeader,
    KoTableBody,
    KoTableRow,
    KoTableHead,
    KoTableCell,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Furniture"
        title="Page blocks"
        description="The furniture around a list: a filter bar, a selection toolbar and a confirm step, so a new list page starts from the same shape."
      >
        <button koActions koButton [icon]="plus" (click)="created()">New item</button>
      </ko-page-header>

      <div class="grid gap-3">
        <ko-list-filter-bar placeholder="Filter items…" [(value)]="filter" />
        <ko-selection-toolbar [count]="selected().length" (clear)="selected.set([])">
          <button
            koButton
            size="sm"
            variant="secondary"
            class="h-7 px-2 text-xs"
            [icon]="download"
            [disabled]="selected().length === 0"
            (click)="exported()"
          >
            Export
          </button>
          <button
            koButton
            size="sm"
            variant="ghost"
            class="h-7 px-2 text-xs text-danger-fg"
            [icon]="trash"
            [disabled]="selected().length === 0"
            (click)="confirmOpen.set(true)"
          >
            Delete
          </button>
        </ko-selection-toolbar>

        <div class="overflow-hidden rounded-xl bg-card shadow-[var(--shadow-border)]">
          <table koTable>
            <thead koTableHeader>
              <tr koTableRow>
                <th koTableHead class="w-10">
                  <ko-checkbox
                    ariaLabel="Select all"
                    [checked]="allState()"
                    [disabled]="rows().length === 0"
                    (checkedChange)="toggleAll($event === true)"
                  />
                </th>
                <th koTableHead>Name</th>
                <th koTableHead>State</th>
                <th koTableHead class="text-right">Stored</th>
              </tr>
            </thead>
            <tbody koTableBody>
              @for (item of rows(); track item.id) {
                <tr koTableRow>
                  <td koTableCell>
                    <ko-checkbox
                      [ariaLabel]="'Select ' + item.name"
                      [checked]="selected().includes(item.id)"
                      (checkedChange)="toggle(item.id)"
                    />
                  </td>
                  <td koTableCell class="font-medium">{{ item.name }}</td>
                  <td koTableCell><ko-status-badge [state]="item.state" /></td>
                  <td koTableCell class="text-right tabular-nums">{{ stored(item.bytes) }}</td>
                </tr>
              }
            </tbody>
          </table>
          @if (rows().length === 0) {
            <div class="grid place-items-center gap-2 px-4 py-12 text-center">
              @if (items().length === 0) {
                <p class="text-sm text-muted-foreground">No items left.</p>
                <button koButton size="sm" variant="secondary" (click)="items.set(all)">
                  Bring them back
                </button>
              } @else {
                <p class="text-sm text-muted-foreground">Nothing matches “{{ filter() }}”.</p>
                <button koButton size="sm" variant="secondary" (click)="filter.set('')">
                  Clear the filter
                </button>
              }
            </div>
          }
        </div>
      </div>

      <ko-confirm-dialog
        confirmLabel="Delete"
        description="They and their history are removed. This cannot be undone."
        destructive
        [title]="'Delete ' + count() + '?'"
        [(open)]="confirmOpen"
        (confirm)="remove()"
      >
        <p
          class="rounded-lg bg-inset px-3 py-2 text-xs text-muted-foreground shadow-[var(--shadow-border)]"
        >
          A dialog can carry extra content between the description and the buttons.
        </p>
      </ko-confirm-dialog>
    </ko-page-shell>
  `,
})
export class KoBlocksPage {
  protected readonly all = demoItems;
  protected readonly plus = lucidePlus;
  protected readonly download = lucideDownload;
  protected readonly trash = lucideTrash2;

  protected readonly filter = signal("");
  protected readonly items = signal(demoItems);
  protected readonly selected = signal<string[]>(demoItems.slice(0, 2).map((item) => item.id));
  protected readonly confirmOpen = signal(false);

  protected readonly rows = computed(() => {
    const query = this.filter().trim().toLowerCase();
    return query
      ? this.items().filter((item) => item.name.toLowerCase().includes(query))
      : this.items();
  });
  protected readonly allState = computed<KoCheckedState>(() => {
    const rows = this.rows();
    const shown = rows.filter((item) => this.selected().includes(item.id)).length;
    return shown === 0 ? false : shown === rows.length ? true : "indeterminate";
  });
  protected readonly count = computed(() => {
    const n = this.selected().length;
    return `${n} item${n === 1 ? "" : "s"}`;
  });

  protected stored(bytes: number): string {
    return formatBytes(bytes);
  }

  protected toggle(id: string): void {
    this.selected.update((ids) =>
      ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
    );
  }

  // Select-all works on the rows in view, and leaves a selection the filter hides alone.
  protected toggleAll(checked: boolean): void {
    const ids = this.rows().map((item) => item.id);
    this.selected.update((current) =>
      checked ? [...new Set([...current, ...ids])] : current.filter((id) => !ids.includes(id)),
    );
  }

  protected remove(): void {
    const selected = this.selected();
    this.items.update((current) => current.filter((item) => !selected.includes(item.id)));
    notify.deleted(this.count());
    this.selected.set([]);
    this.confirmOpen.set(false);
  }

  protected created(): void {
    notify.created("Item");
  }

  protected exported(): void {
    notify.success(`${this.selected().length} exported`);
  }
}
