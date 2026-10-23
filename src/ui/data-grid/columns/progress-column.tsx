import { cn } from "@/ui/utils";
import { metricBarLabelClass, usageBarFillClass, type ProgressVariant } from "./progress-level";

export function ProgressCell({
  percent,
  label,
  variant = "cpu",
}: {
  percent: number;
  label: string;
  variant?: ProgressVariant;
}) {
  const width = Math.min(100, Math.max(0, percent));

  return (
    <div className="relative h-6 w-full overflow-hidden rounded-sm bg-secondary/90">
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-[width] duration-300",
          usageBarFillClass(percent, variant),
        )}
        style={{ width: `${width}%` }}
      />
      <div
        className={cn(
          "relative z-10 flex h-full items-center justify-center px-2 text-[10px] tabular-nums",
          "truncate",
          metricBarLabelClass(percent, width),
        )}
        title={label}
      >
        {label}
      </div>
    </div>
  );
}
