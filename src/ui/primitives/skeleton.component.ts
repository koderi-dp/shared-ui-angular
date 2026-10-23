// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

@Component({
  selector: "ko-skeleton",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "aria-hidden": "true", "[class]": "classes()" },
  template: "",
})
export class KoSkeleton {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("block animate-pulse rounded-md bg-secondary", this.class()),
  );
}
