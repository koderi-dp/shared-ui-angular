import type { LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Extra words the command palette matches, such as "preferences" for Settings. */
  keywords?: readonly string[];
};

/** The sidebar: a main list, and a second list under a divider (settings, help). */
export type NavConfig = {
  primary: readonly NavItem[];
  secondary?: readonly NavItem[];
};

export function navItems(nav: NavConfig): NavItem[] {
  return [...nav.primary, ...(nav.secondary ?? [])];
}

/** `/` is active only on itself; any other item is active on itself and below it. */
export function isNavActive(pathname: string, to: string): boolean {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** A chip in the header: an icon, a coloured dot and a short word. */
export const headerChipClass =
  "flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
