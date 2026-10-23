import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@koderi-dp/ui";
import { metricBarLabelClass, usageBarFillClass, type ProgressVariant } from "./progress-level";

/** A usage bar with its label centred on it. `title` lands on the host (the bar's wrapper). */
@Component({
  selector: "ko-progress-cell",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "relative block h-6 w-full overflow-hidden rounded-sm bg-secondary/90",
    "[attr.title]": "title() ?? null",
  },
  template: `
    <div [class]="fillClass()" [style.width.%]="width()"></div>
    <div [class]="labelClass()" [attr.title]="label()">{{ label() }}</div>
  `,
})
export class KoProgressCell {
  readonly percent = input.required<number>();
  readonly label = input.required<string>();
  readonly variant = input<ProgressVariant>("cpu");
  readonly title = input<string>();

  protected readonly width = computed(() => Math.min(100, Math.max(0, this.percent())));
  protected readonly fillClass = computed(() =>
    cn(
      "absolute inset-y-0 left-0 transition-[width] duration-300",
      usageBarFillClass(this.percent(), this.variant()),
    ),
  );
  protected readonly labelClass = computed(() =>
    cn(
      "relative z-10 flex h-full items-center justify-center px-2 text-[10px] tabular-nums",
      "truncate",
      metricBarLabelClass(this.percent(), this.width()),
    ),
  );
}
