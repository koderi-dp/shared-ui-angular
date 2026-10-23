import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Menu, PanelLeft, PanelLeftClose, Search, type LucideIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/ui/primitives/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/ui/primitives/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/ui/primitives/tooltip";
import { usePersisted } from "@/ui/use-persisted";
import { cn } from "@/ui/utils";
import { CommandPalette } from "./command-palette";
import {
  CommandRegistryContext,
  type Command,
  type CommandRegistry,
} from "./command-palette-state";
import { isNavActive, type NavConfig, type NavItem } from "./nav";

export type Brand = {
  name: string;
  /** A second line under the name, such as the product area. */
  tagline?: string;
  icon: LucideIcon;
};

function NavList({
  items,
  pathname,
  collapsed,
  onNavigate,
}: {
  items: readonly NavItem[];
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isNavActive(pathname, item.to);
        const Icon = item.icon;
        const link = (
          <Link
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            // Collapsed, the label is only in the tooltip, which does not name the link.
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-[background-color,color] duration-150 hover:bg-secondary hover:text-foreground",
              active && "bg-secondary text-foreground",
              collapsed && "justify-center px-0",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </Link>
        );
        if (!collapsed) return <div key={item.to}>{link}</div>;
        return (
          <Tooltip key={item.to}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function Wordmark({ brand, compact }: { brand: Brand; compact?: boolean }) {
  const Icon = brand.icon;
  return (
    <span className={cn("flex items-center gap-2.5", compact && "justify-center")}>
      <span className="inline-flex size-8 items-center justify-center rounded-md bg-secondary text-muted-foreground shadow-[var(--shadow-border)]">
        <Icon className="size-4" />
      </span>
      {compact ? null : (
        <span className="grid leading-tight">
          <span className="text-sm font-semibold tracking-tight">{brand.name}</span>
          {brand.tagline ? (
            <span className="text-[11px] text-muted-foreground">{brand.tagline}</span>
          ) : null}
        </span>
      )}
    </span>
  );
}

function SidebarBody({
  nav,
  brand,
  footer,
  pathname,
  collapsed,
  onNavigate,
}: {
  nav: NavConfig;
  brand: Brand;
  footer?: (collapsed: boolean) => ReactNode;
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-14 shrink-0 items-center",
          collapsed ? "justify-center px-2" : "px-3",
        )}
      >
        <Link
          to="/"
          onClick={onNavigate}
          title={brand.name}
          aria-label={collapsed ? brand.name : undefined}
        >
          <Wordmark brand={brand} compact={collapsed} />
        </Link>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <NavList
          items={nav.primary}
          pathname={pathname}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
        {nav.secondary?.length ? (
          <>
            <div className="mx-2.5 my-2 h-px bg-border" />
            <NavList
              items={nav.secondary}
              pathname={pathname}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          </>
        ) : null}
      </div>
      {footer ? (
        <div
          className={cn(
            "shrink-0 border-t border-border",
            collapsed ? "px-2 py-3 text-center" : "px-3 py-3",
          )}
        >
          {footer(collapsed ?? false)}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The frame of every page: the sidebar (collapsible on desktop, a sheet on mobile), the
 * header with the command palette (Ctrl+K or ⌘K), and the page in `<main>`.
 */
export function AppShell({
  nav,
  brand,
  headerEnd,
  sidebarFooter,
  fullHeight,
  storageKey = "app.navCollapsed",
  children,
}: {
  nav: NavConfig;
  brand: Brand;
  /** Chips and buttons at the right of the header: status, the user menu. */
  headerEnd?: ReactNode;
  sidebarFooter?: (collapsed: boolean) => ReactNode;
  /** Pages that scroll their own panes get a fixed-height `<main>` instead of a scrolling one. */
  fullHeight?: (pathname: string) => boolean;
  /** The localStorage key that remembers whether the sidebar is collapsed. */
  storageKey?: string;
  /** The page. Defaults to the router's `<Outlet />`. */
  children?: ReactNode;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [menu, setMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [collapsed, setCollapsed] = usePersisted(storageKey, false);
  const [owners, setOwners] = useState<Record<string, Command[]>>({});

  const register = useCallback(
    (owner: string, commands: Command[]) => setOwners((all) => ({ ...all, [owner]: commands })),
    [],
  );
  const unregister = useCallback(
    (owner: string) =>
      setOwners((all) => {
        const next = { ...all };
        delete next[owner];
        return next;
      }),
    [],
  );
  const registry = useMemo<CommandRegistry>(
    () => ({ register, unregister }),
    [register, unregister],
  );
  const commands = useMemo(() => Object.values(owners).flat(), [owners]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setPalette((open) => !open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sidebar = { nav, brand, footer: sidebarFooter, pathname };

  return (
    <CommandRegistryContext.Provider value={registry}>
      <TooltipProvider delayDuration={300}>
        <div className="flex h-dvh overflow-hidden bg-background text-foreground">
          <aside
            className={cn(
              "hidden shrink-0 border-r border-border transition-[width] duration-200 ease-[var(--ease-smooth-out)] lg:flex",
              collapsed ? "w-16" : "w-52",
            )}
          >
            <div className="w-full">
              <SidebarBody {...sidebar} collapsed={collapsed} />
            </div>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="lg:hidden"
                aria-label="Open navigation"
                onClick={() => setMenu(true)}
              >
                <Menu />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="hidden lg:inline-flex"
                aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <PanelLeft /> : <PanelLeftClose />}
              </Button>
              <button
                type="button"
                onClick={() => setPalette(true)}
                className="mr-auto flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-inset px-3 text-sm text-muted-foreground shadow-[var(--shadow-border)] transition-shadow hover:shadow-[var(--shadow-border-hover)] focus-visible:ring-2 focus-visible:ring-ring lg:max-w-md"
              >
                <Search className="size-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">Search…</span>
                <kbd className="hidden rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground shadow-[var(--shadow-border)] sm:inline">
                  Ctrl K
                </kbd>
              </button>
              {headerEnd}
            </header>
            <main
              className={cn(
                "min-h-0 min-w-0 flex-1",
                fullHeight?.(pathname) ? "flex flex-col overflow-hidden" : "overflow-y-auto",
              )}
            >
              {children ?? <Outlet />}
            </main>
          </div>
          <Sheet open={menu} onOpenChange={setMenu}>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SheetDescription className="sr-only">Pages of {brand.name}.</SheetDescription>
              <SidebarBody {...sidebar} onNavigate={() => setMenu(false)} />
            </SheetContent>
          </Sheet>
          <CommandPalette open={palette} onOpenChange={setPalette} nav={nav} commands={commands} />
        </div>
      </TooltipProvider>
    </CommandRegistryContext.Provider>
  );
}
