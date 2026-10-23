import { Copy, RefreshCcw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconButton } from "@/ui/primitives/button";
import { cn } from "@/ui/utils";

export type DetailAction = {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
};

export type DetailTabDefinition<Id extends string> = { id: Id; label: string; count?: number };

/**
 * Pylon's asset detail frame: an icon tile and title, a tab strip, a vertical action
 * rail beside the content, and a thin footer. The tabs and actions are this app's own.
 */
export function DetailShell<Id extends string>({
  icon,
  title,
  subtitle,
  badge,
  tabs,
  activeTab,
  onActiveTabChange,
  actions,
  onRefresh,
  footer,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  tabs: readonly DetailTabDefinition<Id>[];
  activeTab: Id;
  onActiveTabChange: (tab: Id) => void;
  actions: DetailAction[];
  onRefresh?: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const tone = (action: DetailAction) =>
    cn(
      action.variant === "primary" && "bg-signal/15 text-signal-fg hover:bg-signal/25",
      action.variant === "danger" && "text-danger-fg hover:bg-danger/10",
      (!action.variant || action.variant === "default") &&
        "text-muted-foreground hover:bg-secondary hover:text-foreground",
    );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-elevated text-muted-foreground shadow-[var(--shadow-border)] md:size-10 [&_svg]:size-[18px]">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{title}</h2>
            {badge}
          </div>
          {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {onRefresh ? (
          <IconButton icon={RefreshCcw} label="Refresh" onClick={onRefresh} className="shrink-0" />
        ) : null}
      </div>

      {actions.length > 0 ? (
        <div className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
          {actions.map((action) => (
            <button
              key={action.id}
              type="button"
              disabled={action.disabled}
              onClick={action.onClick}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-35",
                tone(action),
              )}
            >
              <action.icon className="size-4 shrink-0" strokeWidth={1.75} />
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        role="tablist"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onActiveTabChange(tab.id)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2.5 text-xs font-medium transition-colors md:py-2",
                active
                  ? "bg-card text-foreground shadow-[var(--shadow-border)]"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {tab.count != null ? (
                <span className="rounded-full bg-secondary px-1.5 text-[10px] tabular-nums text-muted-foreground">
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden bg-card/30">
        {actions.length > 0 ? (
          <aside className="hidden w-16 shrink-0 flex-col gap-0.5 border-r border-border bg-inset/50 p-1.5 md:flex">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                disabled={action.disabled}
                title={action.label}
                onClick={action.onClick}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-xs leading-tight transition-colors disabled:opacity-35",
                  tone(action),
                )}
              >
                <action.icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                <span className="max-w-full text-center">{action.label}</span>
              </button>
            ))}
          </aside>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{children}</div>
      </div>

      {footer ? (
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-1.5 text-[11px] text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export function OverviewRow({
  label,
  value,
  copy,
  mono,
  children,
}: {
  label: string;
  value?: string;
  copy?: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
      <span className="shrink-0 text-sm text-muted-foreground sm:w-36">{label}</span>
      <div className={cn("min-w-0 flex-1 text-sm", mono && "break-all font-mono text-xs")}>
        {children ?? value ?? "—"}
      </div>
      {copy ? (
        <button
          type="button"
          className="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          onClick={() => void navigator.clipboard.writeText(copy)}
          title="Copy"
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export function OverviewPanel({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-border">{children}</div>;
}

export function DetailSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex min-h-9 items-center justify-between gap-3 border-b border-border bg-inset/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
        {action}
      </div>
      {children}
    </section>
  );
}

export function DetailEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-48 place-items-center px-4 py-10 text-center text-sm text-muted-foreground">
      <div className="grid justify-items-center gap-3">{children}</div>
    </div>
  );
}
