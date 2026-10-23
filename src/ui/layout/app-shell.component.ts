import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  inject,
  Injector,
  input,
  type OnInit,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
  TemplateRef,
  type WritableSignal,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { lucideMenu, lucidePanelLeft, lucidePanelLeftClose, lucideSearch } from "@ng-icons/lucide";
import { filter, map } from "rxjs";
import { isMacPlatform, isPaletteShortcut, shortcutLabel, urlPath } from "@/ui/layout/app-shell";
import { KoCommandPalette } from "@/ui/layout/command-palette.component";
import { KoCommandRegistry } from "@/ui/layout/command-registry";
import { isNavActive, type NavConfig } from "@/ui/layout/nav";
import {
  persisted,
  KoIconButton,
  KoSheet,
  KoSheetContent,
  KoSheetDescription,
  KoSheetTitle,
  KoTooltip,
  cn,
} from "@koderi-dp/ui";

export type Brand = {
  name: string;
  /** A second line under the name, such as the product area. */
  tagline?: string;
  /** The SVG string of the icon, such as `lucideBoxes` from `@ng-icons/lucide`. */
  icon: string;
};

/** The context of `koSidebarFooter`: `let-collapsed` is whether the sidebar is collapsed. */
export type KoSidebarFooterContext = { $implicit: boolean };

/** The foot of the sidebar: `<ng-template koSidebarFooter let-collapsed>`. */
@Directive({ selector: "ng-template[koSidebarFooter]" })
export class KoSidebarFooter {
  readonly template = inject<TemplateRef<KoSidebarFooterContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _directive: KoSidebarFooter,
    _context: unknown,
  ): _context is KoSidebarFooterContext {
    return true;
  }
}

const linkClass =
  "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-secondary hover:text-foreground";

/**
 * The frame of every page: the sidebar (collapsible on desktop, a sheet on mobile), the header
 * with the command palette (Ctrl+K, or ⌘K on macOS), and the page, projected into `<main>`,
 * which is the scroll container. `[koHeaderEnd]` content goes at the right of the header.
 */
@Component({
  selector: "ko-app-shell",
  imports: [
    NgTemplateOutlet,
    NgIcon,
    RouterLink,
    KoIconButton,
    KoTooltip,
    KoSheet,
    KoSheetContent,
    KoSheetTitle,
    KoSheetDescription,
    KoCommandPalette,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "flex h-dvh overflow-hidden bg-background text-foreground" },
  templateUrl: "./app-shell.component.html",
})
export class KoAppShell implements OnInit {
  readonly nav = input.required<NavConfig>();
  readonly brand = input.required<Brand>();
  /** Pages that scroll their own panes get a fixed-height `<main>` instead of a scrolling one. */
  readonly fullHeight = input<(path: string) => boolean>();
  /** The localStorage key prefix; the collapsed state is kept at `{storageKey}:collapsed`. Read once. */
  readonly storageKey = input("app-shell");

  protected readonly menuIcon = lucideMenu;
  protected readonly expandIcon = lucidePanelLeft;
  protected readonly collapseIcon = lucidePanelLeftClose;
  protected readonly searchIcon = lucideSearch;

  protected readonly footer = contentChild(KoSidebarFooter);
  protected readonly menu = signal(false);
  protected readonly palette = signal(false);
  /** Replaced in `ngOnInit`, once `storageKey` is known. */
  protected collapsed: WritableSignal<boolean> = signal(false);
  protected readonly commands = inject(KoCommandRegistry).commands;

  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mac = this.browser && isMacPlatform(navigator);

  protected readonly shortcut = shortcutLabel(this.mac);
  protected readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => urlPath(this.router.url)),
    ),
    { initialValue: urlPath(this.router.url) },
  );
  protected readonly asideClasses = computed(() =>
    cn(
      "hidden shrink-0 border-r border-border transition-[width] duration-200 ease-[var(--ease-smooth-out)] lg:flex",
      this.collapsed() ? "w-16" : "w-52",
    ),
  );
  protected readonly mainClasses = computed(() =>
    cn(
      "min-h-0 min-w-0 flex-1",
      this.fullHeight()?.(this.path()) ? "flex flex-col overflow-hidden" : "overflow-y-auto",
    ),
  );

  constructor() {
    if (!this.browser) return;
    const document = inject(DOCUMENT);
    const onKey = (event: KeyboardEvent) => {
      if (!isPaletteShortcut(event, this.mac)) return;
      event.preventDefault();
      this.palette.update((open) => !open);
    };
    document.addEventListener("keydown", onKey);
    inject(DestroyRef).onDestroy(() => document.removeEventListener("keydown", onKey));
  }

  ngOnInit(): void {
    const key = `${this.storageKey()}:collapsed`;
    this.collapsed = runInInjectionContext(this.injector, () => persisted(key, false));
  }

  protected isActive(to: string): boolean {
    return isNavActive(this.path(), to);
  }

  protected linkClasses(active: boolean, collapsed: boolean): string {
    return cn(
      linkClass,
      active && "bg-secondary text-foreground",
      collapsed && "justify-center px-0",
    );
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  /** Closes the mobile sheet after a link in it is followed. */
  protected navigated(mobile: boolean): void {
    if (mobile) this.menu.set(false);
  }
}
