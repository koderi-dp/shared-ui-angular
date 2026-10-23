import { computed, Directive, input } from "@angular/core";
import { cn } from "../utils";

/** Written for this registry (Zard has no label); classes from the React `label.tsx`. */
@Directive({ selector: "label[koLabel]", host: { "[class]": "classes()" } })
export class KoLabel {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("text-xs font-medium text-muted-foreground", this.class()),
  );
}
