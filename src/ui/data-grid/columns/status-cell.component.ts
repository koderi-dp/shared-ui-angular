import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { KoBadge } from "@/ui/primitives/badge.component";
import { cn } from "@/ui/utils";
import { BADGE_VARIANT, DOT_CLASS, TEXT_CLASS, type StatusTone } from "./tones";

/** A status as a badge in its tone's variant; the label is the projected content. */
@Component({
  selector: "ko-status-badge",
  imports: [KoBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `<ko-badge [variant]="variant()"><ng-content /></ko-badge>`,
})
export class KoStatusBadge {
  readonly tone = input.required<StatusTone>();
  protected readonly variant = computed(() => BADGE_VARIANT[this.tone()]);
}

/** A status as a coloured dot and label; the label is the projected content. */
@Component({
  selector: "ko-status-dot-label",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "flex items-center gap-2" },
  template: `
    <span [class]="dotClass()"></span>
    <span [class]="textClass()"><ng-content /></span>
  `,
})
export class KoStatusDotLabel {
  readonly tone = input.required<StatusTone>();
  protected readonly dotClass = computed(() => cn("size-2 rounded-full", DOT_CLASS[this.tone()]));
  protected readonly textClass = computed(() => cn("capitalize", TEXT_CLASS[this.tone()]));
}

/** The `statusColumn` cell: `label` as a badge or a dot label, in `tone`. */
@Component({
  selector: "ko-status-cell",
  imports: [KoStatusBadge, KoStatusDotLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    @if (style() === "badge") {
      <ko-status-badge [tone]="tone()">{{ label() }}</ko-status-badge>
    } @else {
      <ko-status-dot-label [tone]="tone()">{{ label() }}</ko-status-dot-label>
    }
  `,
})
export class KoStatusCell {
  readonly tone = input.required<StatusTone>();
  readonly label = input.required<string>();
  readonly style = input<"badge" | "dot">("badge");
}
