import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { NgIcon } from "@ng-icons/core";
import { lucideCopy, lucideRefreshCcw } from "@ng-icons/lucide";
import { KoIconButton } from "@/ui/primitives/button.component";
import { cn } from "@/ui/utils";

export type DetailAction = {
  id: string;
  label: string;
  /** An `@ng-icons/lucide` SVG string. */
  icon: string;
  run: () => void;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
};

export type DetailTabDefinition<Id extends string> = { id: Id; label: string; count?: number };

/**
 * Pylon's asset detail frame: an icon tile and title, a tab strip, a vertical action
 * rail beside the content, and a thin footer. The tabs and actions are this app's own.
 * The content shows the active tab; switch on `activeTab` to choose what goes in.
 *
 * Slots: `[koSubtitle]`, `[koBadge]` and `[koFooter]` (put the attribute on each element).
 */
@Component({
  selector: "ko-detail-shell",
  imports: [NgIcon, KoIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", "[class]": "classes()" },
  template: `
    <div
      class="flex shrink-0 items-center gap-2.5 border-b border-border px-3 py-2.5 md:gap-3 md:px-4 md:py-3"
    >
      <div
        class="grid size-9 shrink-0 place-items-center rounded-lg bg-elevated text-muted-foreground shadow-[var(--shadow-border)] md:size-10"
      >
        <ng-icon aria-hidden="true" size="18px" [svg]="icon()" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <h2 class="truncate text-sm font-semibold">{{ title() }}</h2>
          <ng-content select="[koBadge]" />
        </div>
        <p class="truncate text-xs text-muted-foreground empty:hidden">
          <ng-content select="[koSubtitle]" />
        </p>
      </div>
      <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
      <button
        koIconButton
        class="shrink-0"
        label="Refresh"
        [icon]="refreshIcon"
        (click)="refresh.emit()"
      ></button>
    </div>

    @if (actions().length > 0) {
      <div class="flex shrink-0 gap-1.5 overflow-x-auto border-b border-border px-3 py-2 md:hidden">
        @for (action of actions(); track action.id) {
          <button
            type="button"
            [disabled]="action.disabled"
            [class]="mobileActionClasses(action)"
            (click)="action.run()"
          >
            <ng-icon
              aria-hidden="true"
              size="1rem"
              strokeWidth="1.75"
              class="shrink-0"
              [svg]="action.icon"
            />
            {{ action.label }}
          </button>
        }
      </div>
    }

    <div
      role="tablist"
      class="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [class]="tabClasses(tab.id === activeTab())"
          [attr.aria-selected]="tab.id === activeTab()"
          (click)="activeTab.set(tab.id)"
        >
          {{ tab.label }}
          @if (tab.count !== undefined) {
            <span
              class="rounded-full bg-secondary px-1.5 text-[10px] tabular-nums text-muted-foreground"
            >
              {{ tab.count }}
            </span>
          }
        </button>
      }
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden bg-card/30">
      @if (actions().length > 0) {
        <aside
          class="hidden w-16 shrink-0 flex-col gap-0.5 border-r border-border bg-inset/50 p-1.5 md:flex"
        >
          @for (action of actions(); track action.id) {
            <button
              type="button"
              [title]="action.label"
              [disabled]="action.disabled"
              [class]="railActionClasses(action)"
              (click)="action.run()"
            >
              <ng-icon
                aria-hidden="true"
                size="18px"
                strokeWidth="1.75"
                class="shrink-0"
                [svg]="action.icon"
              />
              <span class="max-w-full text-center">{{ action.label }}</span>
            </button>
          }
        </aside>
      }
      <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <ng-content />
      </div>
    </div>

    <div
      class="flex shrink-0 items-center justify-between gap-3 border-t border-border px-4 py-1.5 text-[11px] text-muted-foreground empty:hidden"
    >
      <ng-content select="[koFooter]" />
    </div>
  `,
})
export class KoDetailShell<Id extends string = string> {
  /** An `@ng-icons/lucide` SVG string. */
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly tabs = input.required<readonly DetailTabDefinition<Id>[]>();
  readonly activeTab = model.required<Id>();
  readonly actions = input<readonly DetailAction[]>([]);
  readonly class = input<string>("");
  readonly refresh = output<void>();

  protected readonly refreshIcon = lucideRefreshCcw;
  protected readonly classes = computed(() =>
    cn("flex h-full min-h-0 flex-col overflow-hidden", this.class()),
  );

  private tone(action: DetailAction): string {
    return cn(
      action.variant === "primary" && "bg-signal/15 text-signal-fg hover:bg-signal/25",
      action.variant === "danger" && "text-danger-fg hover:bg-danger/10",
      (!action.variant || action.variant === "default") &&
        "text-muted-foreground hover:bg-secondary hover:text-foreground",
    );
  }

  protected mobileActionClasses(action: DetailAction): string {
    return cn(
      "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:opacity-35",
      this.tone(action),
    );
  }

  protected railActionClasses(action: DetailAction): string {
    return cn(
      "flex flex-col items-center gap-1 rounded-md px-1 py-2 text-xs leading-tight transition-colors disabled:opacity-35",
      this.tone(action),
    );
  }

  protected tabClasses(active: boolean): string {
    return cn(
      "relative flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2.5 text-xs font-medium transition-colors md:py-2",
      active
        ? "bg-card text-foreground shadow-[var(--shadow-border)]"
        : "text-muted-foreground hover:text-foreground",
    );
  }
}

/** A label and its value. Project content to show something other than text in the value. */
@Component({
  selector: "ko-overview-row",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    "[attr.title]": "null",
    class: "flex flex-col gap-1 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4",
  },
  template: `
    <span class="shrink-0 text-sm text-muted-foreground sm:w-36">{{ label() }}</span>
    <div [class]="valueClasses()">
      <ng-content>{{ value() ?? "—" }}</ng-content>
    </div>
    @if (copy()) {
      <button
        type="button"
        class="shrink-0 rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
        title="Copy"
        [attr.aria-label]="'Copy ' + label()"
        (click)="copyValue()"
      >
        <ng-icon aria-hidden="true" size="0.875rem" [svg]="copyIcon" />
      </button>
    }
  `,
})
export class KoOverviewRow {
  readonly label = input.required<string>();
  readonly value = input<string>();
  /** The text the copy button puts on the clipboard. No button without it. */
  readonly copy = input<string>();
  readonly mono = input(false, { transform: booleanAttribute });

  protected readonly copyIcon = lucideCopy;
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly valueClasses = computed(() =>
    cn("min-w-0 flex-1 text-sm", this.mono() && "break-all font-mono text-xs"),
  );

  protected copyValue(): void {
    const text = this.copy();
    if (!text || !isPlatformBrowser(this.platformId)) return;
    void navigator.clipboard?.writeText(text);
  }
}

@Component({
  selector: "ko-overview-panel",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block divide-y divide-border" },
  template: `<ng-content />`,
})
export class KoOverviewPanel {}

/** A titled block. `[koAction]` puts something at the end of the title bar. */
@Component({
  selector: "ko-detail-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[attr.title]": "null", class: "block" },
  template: `
    <div
      class="flex min-h-9 items-center justify-between gap-3 border-b border-border bg-inset/40 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground"
    >
      {{ title() }}
      <ng-content select="[koAction]" />
    </div>
    <ng-content />
  `,
})
export class KoDetailSection {
  readonly title = input.required<string>();
}

@Component({
  selector: "ko-detail-empty",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "grid min-h-48 place-items-center px-4 py-10 text-center text-sm text-muted-foreground",
  },
  template: `
    <div class="grid justify-items-center gap-3">
      <ng-content />
    </div>
  `,
})
export class KoDetailEmpty {}
