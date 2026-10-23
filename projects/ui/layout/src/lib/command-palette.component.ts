import { DOCUMENT } from "@angular/common";
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal,
  untracked,
} from "@angular/core";
import { Router } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { lucideCornerDownLeft, lucideSearch } from "@ng-icons/lucide";
import { paletteGroups, type PaletteOption } from "./command-palette";
import type { Command } from "./command-registry";
import type { NavConfig } from "./nav";
import { KoDialog, KoDialogContent, KoDialogDescription, KoDialogTitle, cn } from "@koderi-dp/ui";

let nextId = 0;

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm text-foreground outline-none aria-selected:bg-secondary";
const groupClass = "px-1 py-1 text-xs text-muted-foreground";

/**
 * Search pages and actions, and run one. Focus stays in the search input (a combobox); the
 * arrow keys move the active option (`aria-activedescendant`), Enter runs it, and Escape, a
 * backdrop click or running an option closes the palette. `[(open)]` works both ways.
 */
@Component({
  selector: "ko-command-palette",
  imports: [NgIcon, KoDialog, KoDialogContent, KoDialogTitle, KoDialogDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  templateUrl: "./command-palette.component.html",
})
export class KoCommandPalette {
  readonly open = model(false);
  readonly nav = input.required<NavConfig>();
  readonly commands = input<Command[]>([]);
  readonly placeholder = input("Search…");

  protected readonly searchIcon = lucideSearch;
  protected readonly enterIcon = lucideCornerDownLeft;
  protected readonly itemClass = itemClass;
  protected readonly id = `ko-command-palette-${nextId++}`;
  protected readonly listId = `${this.id}-list`;

  protected readonly query = signal("");
  protected readonly groups = computed(() =>
    paletteGroups(this.query(), this.nav(), this.commands()),
  );
  protected readonly options = computed(() => this.groups().flatMap((group) => group.options));
  /** The first option is active whenever the list changes, as in cmdk. */
  protected readonly active = linkedSignal({ source: this.options, computation: () => 0 });
  protected readonly activeId = computed(() =>
    this.options().length ? this.optionId(this.active()) : null,
  );

  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      if (!this.open()) untracked(() => this.query.set(""));
    });
    afterRenderEffect(() => {
      const id = this.activeId();
      if (id) this.document.getElementById(id)?.scrollIntoView?.({ block: "nearest" });
    });
  }

  protected optionId(index: number): string {
    return `${this.id}-option-${index}`;
  }

  protected headingId(index: number): string {
    return `${this.id}-group-${index}`;
  }

  protected groupClasses(index: number): string {
    return cn(groupClass, index > 0 && "mt-1 border-t border-border pt-2");
  }

  protected onInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const count = this.options().length;
    if (event.isComposing) return;
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault();
        if (!count) return;
        const step = event.key === "ArrowDown" ? 1 : -1;
        this.active.update((index) => (index + step + count) % count);
        return;
      }
      case "Home":
      case "End":
        if (!count) return;
        event.preventDefault();
        this.active.set(event.key === "Home" ? 0 : count - 1);
        return;
      case "Enter": {
        const option = this.options()[this.active()];
        if (!option) return;
        event.preventDefault();
        this.choose(option);
        return;
      }
    }
  }

  protected choose(option: PaletteOption): void {
    this.open.set(false);
    if (option.command) option.command.run();
    else if (option.to) void this.router.navigateByUrl(option.to);
  }
}
