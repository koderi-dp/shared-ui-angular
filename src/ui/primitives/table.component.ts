// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { ChangeDetectionStrategy, Component, computed, Directive, input } from "@angular/core";
import { cn } from "@/ui/utils";

/** A dense table inside an `overflow-x-auto` wrapper, so a wide table scrolls instead of clipping. */
@Component({
  selector: "ko-table",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `<div class="w-full overflow-x-auto">
    <table [class]="classes()">
      <ng-content />
    </table>
  </div>`,
})
export class KoTable {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("w-full text-left text-sm", this.class()));
}

@Directive({ selector: "thead[koTableHeader]", host: { "[class]": "classes()" } })
export class KoTableHeader {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("text-xs text-muted-foreground", this.class()));
}

@Directive({ selector: "tbody[koTableBody]", host: { "[class]": "classes()" } })
export class KoTableBody {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn(this.class()));
}

@Directive({ selector: "tr[koTableRow]", host: { "[class]": "classes()" } })
export class KoTableRow {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "group transition-colors [tbody_&]:border-t [tbody_&]:border-border [tbody_&]:hover:bg-secondary/30",
      this.class(),
    ),
  );
}

@Directive({ selector: "th[koTableHead]", host: { "[class]": "classes()" } })
export class KoTableHead {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("px-4 py-3 font-normal", this.class()));
}

@Directive({ selector: "td[koTableCell]", host: { "[class]": "classes()" } })
export class KoTableCell {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("h-12 px-4 py-2", this.class()));
}
