import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

export type KeyValueColumn = {
  id: string;
  header: string;
  /** Class on the `<col>` element (e.g. "w-[23%]"); no class renders a plain `<col />`. */
  colClassName?: string;
  /** Extra classes for this column's `<th>`. */
  headerClassName?: string;
  /** "right" adds `text-right` to the `<th>`. */
  align?: "left" | "right";
};

export type KeyValueTableClassNames = {
  wrapper?: string;
  table?: string;
  thead?: string;
  headerRow?: string;
  headerCell?: string;
  tbody?: string;
};

/**
 * A plain table for form and key/value layouts that do not fit a row-per-record grid. No
 * sorting, resizing or selection; the caller owns every class. The rows are projected into
 * `<tbody>`: plain `<tr>`s with a `<th scope="row">` key and `<td>` cells. The host is
 * `display: contents` unless `classNames.wrapper` is set, when it is that wrapper (a block).
 */
@Component({
  selector: "ko-key-value-table",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "hostClass()" },
  template: `
    <table [class]="classNames()?.table ?? ''">
      <caption class="sr-only" [textContent]="caption()"></caption>
      <colgroup>
        @for (column of columns(); track column.id) {
          <col [class]="column.colClassName ?? ''" />
        }
      </colgroup>
      <thead [class]="classNames()?.thead ?? ''">
        <tr [class]="classNames()?.headerRow ?? ''">
          @for (column of columns(); track column.id) {
            <th scope="col" [class]="headerClass(column)">{{ column.header }}</th>
          }
        </tr>
      </thead>
      <tbody [class]="classNames()?.tbody ?? ''">
        <ng-content />
      </tbody>
    </table>
  `,
})
export class KoKeyValueTable {
  readonly caption = input.required<string>();
  readonly columns = input.required<KeyValueColumn[]>();
  readonly classNames = input<KeyValueTableClassNames>();

  protected readonly hostClass = computed(() => {
    const wrapper = this.classNames()?.wrapper;
    return wrapper ? cn("block", wrapper) : "contents";
  });

  protected headerClass(column: KeyValueColumn): string {
    return cn(
      this.classNames()?.headerCell,
      column.align === "right" && "text-right",
      column.headerClassName,
    );
  }
}
