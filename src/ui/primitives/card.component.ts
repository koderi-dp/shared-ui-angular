// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

@Component({
  selector: "ko-card",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoCard {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("block rounded-xl bg-card text-card-foreground shadow-[var(--shadow-border)]", this.class()),
  );
}

@Component({
  selector: "ko-card-header",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoCardHeader {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("flex flex-col gap-1 p-5 pb-3", this.class()));
}

@Component({
  selector: "ko-card-title",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: "heading", "aria-level": "3", "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoCardTitle {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("block text-sm font-medium tracking-tight", this.class()),
  );
}

@Component({
  selector: "ko-card-description",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoCardDescription {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("block text-sm text-muted-foreground", this.class()),
  );
}

@Component({
  selector: "ko-card-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  template: `<ng-content />`,
})
export class KoCardContent {
  readonly class = input<string>("");
  protected readonly classes = computed(() => cn("block p-5 pt-0", this.class()));
}
