// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { ChangeDetectionStrategy, Component, computed, input } from "@angular/core";
import { cn } from "@/ui/utils";

@Component({
  selector: "ko-separator",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "separator",
    "[attr.aria-orientation]": "orientation()",
    "[class]": "classes()",
  },
  template: "",
})
export class KoSeparator {
  readonly orientation = input<"horizontal" | "vertical">("horizontal");
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "block shrink-0 bg-border",
      this.orientation() === "horizontal" ? "h-px w-full" : "h-full w-px",
      this.class(),
    ),
  );
}
