import { useNavigate } from "@tanstack/react-router";
import { Command as Cmdk } from "cmdk";
import { CornerDownLeft, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/primitives/dialog";
import { cn } from "@/ui/utils";
import type { Command } from "./command-palette-state";
import { matchesTokens, searchTokens } from "./command-search";
import { navItems, type NavConfig } from "./nav";

const itemClass =
  "flex h-10 cursor-pointer items-center gap-3 rounded-md px-2.5 text-sm text-foreground outline-none aria-selected:bg-secondary";
const groupClass = "px-1 py-1 text-xs text-muted-foreground";

export function CommandPalette({
  open,
  onOpenChange,
  nav,
  commands,
  placeholder = "Search pages and actions…",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: NavConfig;
  commands: Command[];
  placeholder?: string;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const tokens = useMemo(() => searchTokens(query), [query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const pages = navItems(nav).filter((item) =>
    matchesTokens(tokens, { name: item.label, keywords: (item.keywords ?? []).join(" ") }),
  );
  const groups = useMemo(() => {
    const byGroup = new Map<string, Command[]>();
    for (const command of commands) {
      const fields = {
        name: command.label,
        description: command.description ?? "",
        keywords: (command.keywords ?? []).join(" "),
      };
      if (!matchesTokens(tokens, fields)) continue;
      byGroup.set(command.group, [...(byGroup.get(command.group) ?? []), command]);
    }
    return [...byGroup];
  }, [commands, tokens]);

  function close() {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>Search pages and actions.</DialogDescription>
        </DialogHeader>
        <Cmdk
          className="flex min-w-0 flex-col overflow-hidden bg-transparent [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:font-medium"
          loop
          shouldFilter={false}
        >
          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border pl-4 pr-14">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Cmdk.Input
              value={query}
              onValueChange={setQuery}
              placeholder={placeholder}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Cmdk.List className="max-h-[min(28rem,70dvh)] min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain p-2">
            <Cmdk.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches.
            </Cmdk.Empty>
            {groups.map(([group, items], index) => (
              <Cmdk.Group
                key={group}
                heading={group}
                className={cn(groupClass, index > 0 && "mt-1 border-t border-border pt-2")}
              >
                {items.map((command) => {
                  const Icon = command.icon ?? CornerDownLeft;
                  return (
                    <Cmdk.Item
                      key={command.id}
                      value={`command-${command.id}`}
                      onSelect={() => {
                        close();
                        command.run();
                      }}
                      className={itemClass}
                    >
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{command.label}</span>
                      {command.description ? (
                        <span className="ml-auto truncate text-xs text-muted-foreground">
                          {command.description}
                        </span>
                      ) : null}
                    </Cmdk.Item>
                  );
                })}
              </Cmdk.Group>
            ))}
            {pages.length ? (
              <Cmdk.Group
                heading={tokens.length ? "Navigate" : "Pages"}
                className={cn(groupClass, groups.length > 0 && "mt-1 border-t border-border pt-2")}
              >
                {pages.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Cmdk.Item
                      key={item.to}
                      value={`page-${item.to}`}
                      onSelect={() => {
                        close();
                        void navigate({ to: item.to });
                      }}
                      className={itemClass}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      {item.label}
                    </Cmdk.Item>
                  );
                })}
              </Cmdk.Group>
            ) : null}
          </Cmdk.List>
        </Cmdk>
      </DialogContent>
    </Dialog>
  );
}
