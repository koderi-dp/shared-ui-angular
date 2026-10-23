// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-secondary text-muted-foreground",
        outline: "shadow-[var(--shadow-border)] text-muted-foreground",
        live: "bg-signal/15 text-signal-fg",
        warn: "bg-warn/15 text-warn-fg",
        danger: "bg-danger/15 text-danger-fg",
        solid: "bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

@Component({
  selector: "ko-badge",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoBadge {
  readonly variant = input<VariantProps<typeof badgeVariants>["variant"]>("default");
  readonly class = input<string>("");

  protected readonly classes = computed(() =>
    cn(badgeVariants({ variant: this.variant() }), this.class()),
  );
}
