// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  input,
  model,
} from "@angular/core";
import { cn } from "@/ui/utils";

let nextId = 0;

/** Tabs root. `[(value)]` is the active tab. */
@Component({
  selector: "ko-tabs",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `<ng-content />`,
})
export class KoTabs {
  readonly value = model.required<string>();
  readonly id = `ko-tabs-${nextId++}`;
}

const triggerId = (tabs: KoTabs, value: string) => `${tabs.id}-trigger-${value}`;
const panelId = (tabs: KoTabs, value: string) => `${tabs.id}-content-${value}`;

/** A tab button. Arrow keys on the list move between tabs and activate them. */
@Directive({
  selector: "button[koTabsTrigger]",
  host: {
    type: "button",
    role: "tab",
    "[attr.id]": "triggerId()",
    "[attr.aria-selected]": "selected()",
    "[attr.aria-controls]": "panelId()",
    "[attr.data-state]": "selected() ? 'active' : 'inactive'",
    "[attr.tabindex]": "selected() ? 0 : -1",
    "[class]": "classes()",
    "(click)": "activate()",
  },
})
export class KoTabsTrigger {
  readonly value = input.required<string>();
  readonly class = input<string>("");

  readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly tabs = inject(KoTabs);
  protected readonly selected = computed(() => this.tabs.value() === this.value());
  protected readonly triggerId = computed(() => triggerId(this.tabs, this.value()));
  protected readonly panelId = computed(() => panelId(this.tabs, this.value()));
  protected readonly classes = computed(() =>
    cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-[color,background-color] duration-150 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-[var(--shadow-border)]",
      this.class(),
    ),
  );

  activate(): void {
    this.tabs.value.set(this.value());
  }
}

@Component({
  selector: "ko-tabs-list",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "tablist",
    "[class]": "classes()",
    "(keydown)": "onKeydown($event)",
  },
  template: `<ng-content />`,
})
export class KoTabsList {
  readonly class = input<string>("");
  protected readonly classes = computed(() =>
    cn("inline-flex items-center gap-1 rounded-lg bg-secondary p-1", this.class()),
  );
  private readonly triggers = contentChildren(KoTabsTrigger, { descendants: true });

  protected onKeydown(event: KeyboardEvent): void {
    const triggers = this.triggers();
    const current = triggers.findIndex((trigger) => trigger.element === event.target);
    if (current < 0) return;
    const last = triggers.length - 1;
    const targets: Record<string, number> = {
      ArrowRight: current === last ? 0 : current + 1,
      ArrowLeft: current === 0 ? last : current - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    triggers[next].element.focus();
    triggers[next].activate();
  }
}

@Component({
  selector: "ko-tabs-content",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: "tabpanel",
    tabindex: "0",
    "[attr.id]": "id()",
    "[attr.aria-labelledby]": "labelledBy()",
    "[hidden]": "!selected()",
    "[class]": "classes()",
  },
  template: `<ng-content />`,
})
export class KoTabsContent {
  readonly value = input.required<string>();
  readonly class = input<string>("");
  private readonly tabs = inject(KoTabs);
  protected readonly selected = computed(() => this.tabs.value() === this.value());
  protected readonly id = computed(() => panelId(this.tabs, this.value()));
  protected readonly labelledBy = computed(() => triggerId(this.tabs, this.value()));
  protected readonly classes = computed(() => cn("mt-4", this.class()));
}
