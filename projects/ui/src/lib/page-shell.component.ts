import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "./utils";

@Component({
  selector: "ko-page-shell",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoPageShell {
  /** `loose` for dashboard-style pages with more vertical rhythm. */
  readonly gap = input<"default" | "loose">("default");
  readonly class = input<string>("");

  protected readonly classes = computed(() =>
    cn(
      "flex w-full min-w-0 flex-col px-4 py-6 lg:px-6 lg:py-8",
      this.gap() === "loose" ? "gap-8" : "gap-6",
      this.class(),
    ),
  );
}
