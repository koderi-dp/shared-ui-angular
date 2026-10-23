import {
  assertInInjectionContext,
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  isSignal,
  signal,
  type Signal,
} from "@angular/core";

/** Something the palette can run besides opening a page: "New item", "Sign out". */
export type Command = {
  id: string;
  label: string;
  /** The group heading it is listed under. */
  group: string;
  /** The SVG string of the icon, such as `lucidePlus` from `@ng-icons/lucide`. */
  icon?: string;
  description?: string;
  keywords?: readonly string[];
  run: () => void;
};

/** The commands the app shell's palette lists, by the owner that registered them. */
@Injectable({ providedIn: "root" })
export class KoCommandRegistry {
  private readonly owners = signal<ReadonlyMap<string, Command[]>>(new Map());

  /** Every registered command, in the order the owners first registered. */
  readonly commands: Signal<Command[]> = computed(() => [...this.owners().values()].flat());

  /** Sets the commands of `owner`, replacing what it registered before. */
  register(owner: string, commands: Command[]): void {
    this.owners.update((all) => new Map(all).set(owner, commands));
  }

  unregister(owner: string): void {
    this.owners.update((all) => {
      if (!all.has(owner)) return all;
      const next = new Map(all);
      next.delete(owner);
      return next;
    });
  }
}

let nextOwner = 0;

/**
 * Adds commands to the palette while the calling component (or service) lives. A signal is
 * followed: its current commands replace the previous ones. Call it in an injection context.
 */
export function injectCommands(commands: Command[] | Signal<Command[]>): void {
  assertInInjectionContext(injectCommands);
  const registry = inject(KoCommandRegistry);
  const owner = `ko-commands-${nextOwner++}`;
  if (isSignal(commands)) {
    effect(() => registry.register(owner, commands()));
  } else {
    registry.register(owner, commands);
  }
  inject(DestroyRef).onDestroy(() => registry.unregister(owner));
}
