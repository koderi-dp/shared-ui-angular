export type ProgressVariant = "cpu" | "memory" | "disk";

export function usageLevel(percent: number): "ok" | "warn" | "critical" {
  if (percent >= 90) return "critical";
  if (percent >= 75) return "warn";
  return "ok";
}

export function usageBarFillClass(percent: number, kind: ProgressVariant): string {
  const level = usageLevel(percent);
  if (level === "critical") return "bg-destructive";
  if (level === "warn") return "bg-amber-500";
  if (kind === "cpu") return "bg-foreground/65";
  return "bg-emerald-500";
}

export function metricBarLabelClass(percent: number, fillWidth: number): string {
  if (fillWidth <= 0) return "text-muted-foreground";
  const level = usageLevel(percent);
  if (level !== "ok" && fillWidth >= 28) {
    return "font-medium text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]";
  }
  return "text-foreground";
}
