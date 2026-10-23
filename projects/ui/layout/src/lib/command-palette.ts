import type { Command } from "./command-registry";
import { matchesTokens, searchTokens } from "./command-search";
import { navItems, type NavConfig } from "./nav";

/** One row of the palette: a command to run, or a page to open. */
export type PaletteOption = {
  /** Unique within the list: `command-{id}` or `page-{to}`. */
  key: string;
  /** The position in the whole list, across groups: what the arrow keys move. */
  index: number;
  label: string;
  icon?: string;
  description?: string;
  command?: Command;
  to?: string;
};

export type PaletteGroup = { heading: string; options: PaletteOption[] };

/**
 * The palette's list for a query: the matching commands by group (in the order the groups
 * first appear), then the matching pages under "Pages", or "Navigate" while searching.
 * Commands match on label, group, description and keywords; pages on label and keywords.
 * Groups with no match are left out.
 */
export function paletteGroups(
  query: string,
  nav: NavConfig,
  commands: readonly Command[],
): PaletteGroup[] {
  const tokens = searchTokens(query);
  const byGroup = new Map<string, Command[]>();
  for (const command of commands) {
    const fields = {
      name: command.label,
      group: command.group,
      description: command.description ?? "",
      keywords: (command.keywords ?? []).join(" "),
    };
    if (!matchesTokens(tokens, fields)) continue;
    byGroup.set(command.group, [...(byGroup.get(command.group) ?? []), command]);
  }
  const pages = navItems(nav).filter((item) =>
    matchesTokens(tokens, { name: item.label, keywords: (item.keywords ?? []).join(" ") }),
  );

  let index = 0;
  const groups: PaletteGroup[] = [...byGroup].map(([heading, list]) => ({
    heading,
    options: list.map((command) => ({
      key: `command-${command.id}`,
      index: index++,
      label: command.label,
      icon: command.icon,
      description: command.description,
      command,
    })),
  }));
  if (pages.length) {
    groups.push({
      heading: tokens.length ? "Navigate" : "Pages",
      options: pages.map((item) => ({
        key: `page-${item.to}`,
        index: index++,
        label: item.label,
        icon: item.icon,
        to: item.to,
      })),
    });
  }
  return groups;
}
