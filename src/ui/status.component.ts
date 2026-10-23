import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { KoBadge } from "@/ui/primitives/badge.component";
import { statusLabel, statusTone } from "@/ui/status-text";
import { cn } from "@/ui/utils";

/** A small coloured dot for a state word. Decoration only: the word next to it is the name. */
@Component({
  selector: "ko-status-dot",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "aria-hidden": "true", "[class]": "classes()" },
  template: "",
})
export class KoStatusDot {
  readonly state = input.required<string>();
  readonly class = input<string>("");

  protected readonly classes = computed(() => {
    const tone = statusTone(this.state());
    return cn(
      "inline-block size-1.5 shrink-0 rounded-full",
      tone === "live" && "bg-online",
      tone === "warn" && "bg-degraded",
      tone === "danger" && "bg-danger status-pulse",
      tone === "outline" && "bg-offline",
      this.class(),
    );
  });
}

/** Status is always text plus colour: the dot is decoration and the word is the name. */
@Component({
  selector: "ko-status-badge",
  imports: [KoBadge, KoStatusDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <ko-badge [variant]="tone()" class="gap-1.5 whitespace-nowrap">
      <ko-status-dot [state]="state()" />
      {{ label() }}
    </ko-badge>
  `,
})
export class KoStatusBadge {
  readonly state = input.required<string>();

  protected readonly tone = computed(() => statusTone(this.state()));
  protected readonly label = computed(() => statusLabel(this.state()));
}
