import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

/** Kicker, title and description, with the page's actions (`[koActions]`) at the end. */
@Component({
  selector: "ko-page-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The `title` attribute would otherwise show as a native tooltip on the whole header.
  host: { "[attr.title]": "null", "[class]": "classes()" },
  template: `
    <div class="min-w-0">
      @if (kicker()) {
        <div class="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {{ kicker() }}
        </div>
      }
      <h1 class="text-2xl font-medium tracking-tight">{{ title() }}</h1>
      @if (description()) {
        <p class="mt-1 max-w-2xl text-sm text-muted-foreground">{{ description() }}</p>
      }
    </div>
    <div class="flex flex-wrap items-center gap-2 empty:hidden">
      <ng-content select="[koActions]" />
    </div>
  `,
})
export class KoPageHeader {
  readonly kicker = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly class = input<string>("");

  protected readonly classes = computed(() =>
    cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", this.class()),
  );
}
