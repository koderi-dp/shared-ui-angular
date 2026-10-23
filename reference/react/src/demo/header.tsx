import { useNavigate } from "@tanstack/react-router";
import { CircleUser, LogOut, Settings, User } from "lucide-react";
import { headerChipClass } from "@/ui/layout/nav";
import { notify } from "@/ui/notify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/primitives/dropdown-menu";
import { StatusDot } from "@/ui/status";
import { cn } from "@/ui/utils";

/** The chip the shell takes as `headerEnd`: a dot, a word, and never more than that. */
export function HeaderStatus({ state = "running", label = "All services up" }) {
  return (
    <span className={cn(headerChipClass, "cursor-default")}>
      <StatusDot state={state} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

export function UserMenu() {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account"
          className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CircleUser className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>ada@example.com</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => notify.success("Profile opened")}>
          <User className="size-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => navigate({ to: "/settings" })}>
          <Settings className="size-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => notify.success("Signed out")}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** The sidebar footer: the account, or only its menu when the sidebar is collapsed. */
export function AccountFooter({ collapsed }: { collapsed: boolean }) {
  if (collapsed) return <UserMenu />;
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        <CircleUser className="size-4" />
      </span>
      <span className="grid min-w-0 leading-tight">
        <span className="truncate text-xs font-medium">Ada Lovelace</span>
        <span className="truncate text-[11px] text-muted-foreground">ada@example.com</span>
      </span>
    </div>
  );
}
