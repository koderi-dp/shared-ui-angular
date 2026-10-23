export type StatusTone = "live" | "success" | "warning" | "danger" | "muted" | "neutral";

export const BADGE_VARIANT = {
  live: "live",
  success: "live",
  warning: "warn",
  danger: "danger",
  muted: "outline",
  neutral: "default",
} as const satisfies Record<StatusTone, "live" | "warn" | "danger" | "outline" | "default">;

/** Dot fill per tone (matches the Docker panel's container state dot). */
export const DOT_CLASS: Record<StatusTone, string> = {
  success: "bg-emerald-500",
  live: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/50",
  neutral: "bg-muted-foreground",
};

/** Label colour per tone (matches the Docker panel's container state text). */
export const TEXT_CLASS: Record<StatusTone, string> = {
  success: "text-emerald-600 dark:text-emerald-400",
  live: "text-emerald-600 dark:text-emerald-400",
  warning: "text-amber-600 dark:text-amber-400",
  danger: "text-destructive",
  muted: "text-muted-foreground",
  neutral: "text-foreground",
};
