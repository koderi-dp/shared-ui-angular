// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { computed, Directive, input } from "@angular/core";
import { fieldControlClass, fieldFocusClass } from "@/ui/primitives/field-control";
import { cn } from "@/ui/utils";

/** Classes only: the element stays a native `<textarea>`, so `ngModel` and `formControl` just work. */
@Directive({ selector: "textarea[koTextarea]", host: { "[class]": "classes()" } })
export class KoTextarea {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn(
      "flex min-h-24 w-full px-3 py-2 text-sm placeholder:text-muted-foreground/70",
      fieldControlClass,
      fieldFocusClass,
      this.class(),
    ),
  );
}
