import { Badge } from "@/ui/primitives/badge";
import { statusLabel, statusTone } from "@/ui/status-text";
import { cn } from "@/ui/utils";

export function StatusDot({ state, className }: { state: string; className?: string }) {
  const tone = statusTone(state);
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 shrink-0 rounded-full",
        tone === "live" && "bg-online",
        tone === "warn" && "bg-degraded",
        tone === "danger" && "bg-danger status-pulse",
        tone === "outline" && "bg-offline",
        className,
      )}
    />
  );
}

/** Status is always text plus colour: the dot is decoration and the word is the name. */
export function StatusBadge({ state }: { state: string }) {
  return (
    <Badge variant={statusTone(state)} className="gap-1.5 whitespace-nowrap">
      <StatusDot state={state} />
      {statusLabel(state)}
    </Badge>
  );
}
