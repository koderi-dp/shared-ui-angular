import type { LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useId } from "react";

/** Something the palette can run besides opening a page: "New item", "Sign out". */
export type Command = {
  id: string;
  label: string;
  /** The group heading it is listed under. */
  group: string;
  icon?: LucideIcon;
  description?: string;
  keywords?: readonly string[];
  run: () => void;
};

export type CommandRegistry = {
  register: (owner: string, commands: Command[]) => void;
  unregister: (owner: string) => void;
};

export const CommandRegistryContext = createContext<CommandRegistry | null>(null);

/**
 * Adds commands to the palette while the calling component is mounted. Pass a stable
 * array (from `useMemo`), or the commands are registered again on every render.
 */
export function useCommands(commands: Command[]) {
  const registry = useContext(CommandRegistryContext);
  const owner = useId();
  useEffect(() => {
    if (!registry) return;
    registry.register(owner, commands);
    return () => registry.unregister(owner);
  }, [registry, owner, commands]);
}
