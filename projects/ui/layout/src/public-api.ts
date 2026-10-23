/*
 * @koderi-dp/ui/layout: the app shell, the command palette and the nav model.
 */

export { KoAppShell, KoSidebarFooter, type Brand } from "./lib/app-shell.component";
export { KoCommandPalette } from "./lib/command-palette.component";
export { injectCommands, KoCommandRegistry, type Command } from "./lib/command-registry";
export { matchesTokens, searchTokens } from "./lib/command-search";
export { headerChipClass, isNavActive, navItems, type NavConfig, type NavItem } from "./lib/nav";
