// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { computed, Directive, input } from "@angular/core";
import { fieldControlClass, fieldFocusClass } from "@/ui/primitives/field-control";
import { cn } from "@/ui/utils";

/** Classes only: the element stays a native `<input>`, so `ngModel` and `formControl` just work. */
@Directive({ selector: "input[koInput]", host: { "[class]": "classes()" } })
export class KoInput {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "flex h-10 w-full px-3 text-sm placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50",
      fieldControlClass,
      fieldFocusClass,
      this.class(),
    ),
  );
}
