import type { ReactNode } from "react";
import { Badge } from "@/ui/primitives/badge";
import { cn } from "@/ui/utils";
import { BADGE_VARIANT, DOT_CLASS, TEXT_CLASS, type StatusTone } from "./tones";

export function StatusBadge({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <Badge variant={BADGE_VARIANT[tone]}>{children}</Badge>;
}

export function StatusDotLabel({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("size-2 rounded-full", DOT_CLASS[tone])} />
      <span className={cn("capitalize", TEXT_CLASS[tone])}>{children}</span>
    </div>
  );
}
