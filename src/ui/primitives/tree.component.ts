import { NgTemplateOutlet } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  InjectionToken,
  Injector,
  input,
  Renderer2,
  TemplateRef,
} from "@angular/core";
import type { ItemInstance } from "@headless-tree/core";
import { NgIcon } from "@ng-icons/core";
import { lucideChevronDown, lucideChevronRight, lucideMinus, lucidePlus } from "@ng-icons/lucide";
import type { KoTreeHandle } from "@/ui/primitives/tree-adapter";
import {
  styleEntriesOf,
  TreePropsApplier,
  type TreeElementProps,
} from "@/ui/primitives/tree-props";
import { selectOnClick } from "@/ui/primitives/tree-select";
import { cn } from "@koderi-dp/ui";

/** The item of the row an item template is rendered in. */
export const KO_TREE_ITEM = new InjectionToken<ItemInstance<unknown>>("KoTreeItem");

/** Keeps a props bag from headless-tree applied to an element, until it is destroyed. */
function bindProps(props: () => TreeElementProps | null): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const applier = new TreePropsApplier(element, inject(Renderer2));
  effect(() => {
    const next = props();
    if (next) applier.apply(next);
  });
  inject(DestroyRef).onDestroy(() => applier.clear());
}

/**
 * Spreads what `item.getProps()` (or any headless-tree props bag) returns onto its element:
 * attributes and ARIA, styles, the `onClick`-style handlers as DOM listeners, and the `ref`.
 */
@Directive({ selector: "[koTreeItemProps]" })
export class KoTreeItemProps {
  readonly koTreeItemProps = input.required<TreeElementProps>();

  constructor() {
    bindProps(() => this.koTreeItemProps());
  }
}

/**
 * The row template: `<ng-template koTreeItem let-item>`. Bind the tree handle,
 * `[koTreeItem]="tree"`, for a typed `item`.
 */
@Directive({ selector: "ng-template[koTreeItem]" })
export class KoTreeItem<T = unknown> {
  /** Only there to type `let-item`; a bare `koTreeItem` works the same. */
  readonly koTreeItem = input<KoTreeHandle<T> | "">("");
  readonly template = inject<TemplateRef<{ $implicit: ItemInstance<T> }>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: KoTreeItem<T>,
    _ctx: unknown,
  ): _ctx is { $implicit: ItemInstance<T> } {
    return true;
  }
}

/** The line drawn where an ordered drop would land; nothing while no drag is over the tree. */
@Component({
  selector: "ko-tree-drag-line",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    @if (lineStyle(); as style) {
      <div [style]="style" [class]="classes()"></div>
    }
  `,
})
export class KoTreeDragLine {
  readonly class = input<string>("");
  private readonly tree = inject(KoTree, { optional: true });

  protected readonly lineStyle = computed(() => {
    const handle = this.tree?.handle();
    if (!handle) return null;
    handle.items();
    const tree = handle.tree;
    if (typeof tree.getDragLineStyle !== "function") return null;
    const style = tree.getDragLineStyle() as Record<string, unknown> | undefined;
    if (!style || style["display"] === "none") return null;
    return styleEntriesOf(style);
  });

  protected readonly classes = computed(() =>
    cn("pointer-events-none z-20 h-0.5 bg-signal", this.class()),
  );
}

type TreeRow<T> = {
  item: ItemInstance<T>;
  props: TreeElementProps;
  padding: number;
  classes: string;
  injector: Injector;
};

/**
 * A tree over a handle from `injectTreeController`: the host is the `role="tree"`
 * container, and each visible item is a row rendered from the `koTreeItem` template.
 */
@Component({
  selector: "ko-tree",
  imports: [NgTemplateOutlet, KoTreeItemProps, KoTreeDragLine],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes()" },
  templateUrl: "./tree.component.html",
})
export class KoTree<T = unknown> {
  readonly handle = input.required<KoTreeHandle<T>>();
  readonly indent = input(12);
  readonly toggleIconType = input<"chevron" | "plus-minus">("chevron");
  readonly class = input<string>("");

  protected readonly itemTemplate = contentChild<KoTreeItem<T>>(KoTreeItem);
  private readonly injector = inject(Injector);
  private readonly label = inject(new HostAttributeToken("aria-label"), { optional: true });
  private readonly injectors = new Map<string, Injector>();

  protected readonly classes = computed(() => cn("relative flex flex-col", this.class()));

  protected readonly rows = computed<TreeRow<T>[]>(() => {
    const indent = this.indent();
    return this.handle()
      .items()
      .map((item) => {
        // The row's own click replaces headless-tree's, which would also toggle the folder.
        const props = {
          ...(item.getProps() as TreeElementProps),
          onClick: (event: MouseEvent) => this.onRowClick(item, event),
        };
        return {
          item,
          props,
          padding: indent * item.getItemMeta().level + 8,
          classes: cn(
            "group flex min-h-8 items-stretch gap-0.5 rounded-md pr-1 text-sm outline-none",
            item.isSelected?.() && "bg-secondary",
            // Nest-into-folder only — ordered drops use the drag line, not row fill/opacity.
            item.isUnorderedDragTarget?.() &&
              item.isFolder() &&
              "bg-signal/5 ring-1 ring-inset ring-signal/30",
          ),
          injector: this.injectorFor(item),
        };
      });
  });

  constructor() {
    bindProps(() => this.handle().tree.getContainerProps(this.label ?? undefined));
  }

  private onRowClick(item: ItemInstance<T>, event: MouseEvent): void {
    if (event.defaultPrevented) return;
    // Ignore bubbled clicks — label, chevron and drag handle handle their own.
    if (event.target !== event.currentTarget) return;
    selectOnClick(item, event);
    item.setFocused();
    item.getTree().updateDomFocus();
    item.primaryAction();
  }

  /** One injector per item id, so a row's template is not re-created on every change. */
  private injectorFor(item: ItemInstance<T>): Injector {
    const id = item.getId();
    let injector = this.injectors.get(id);
    if (!injector) {
      injector = Injector.create({
        providers: [{ provide: KO_TREE_ITEM, useValue: item }],
        parent: this.injector,
      });
      this.injectors.set(id, injector);
    }
    return injector;
  }
}

/**
 * The label of a row: a chevron (or plus/minus) that opens and closes a folder, then the
 * projected content, or the item's name. Without `item`, it labels the row it sits in.
 */
@Component({
  selector: "ko-tree-item-label",
  imports: [NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    @if (view(); as view) {
      <button type="button" tabindex="-1" [class]="classes()" (click)="onClick($event)">
        <span
          data-tree-toggle=""
          class="grid size-6 shrink-0 place-items-center text-muted-foreground"
        >
          @if (view.icon; as icon) {
            <ng-icon aria-hidden="true" size="0.875rem" [svg]="icon" />
          } @else {
            <span class="size-3.5"></span>
          }
        </span>
        <ng-content
          ><span class="truncate">{{ view.name }}</span></ng-content
        >
      </button>
    }
  `,
})
export class KoTreeItemLabel<T = unknown> {
  readonly item = input<ItemInstance<T>>();
  readonly class = input<string>("");

  private readonly tree = inject<KoTree<T>>(KoTree, { optional: true });
  private readonly rowItem = inject(KO_TREE_ITEM, { optional: true }) as ItemInstance<T> | null;

  private readonly node = computed(() => this.item() ?? this.rowItem);

  protected readonly view = computed(() => {
    // Read the items so a change in the tree's state re-reads the node.
    this.tree?.handle().items();
    const node = this.node();
    if (!node) return null;
    const folder = node.isFolder();
    const expanded = folder && node.isExpanded();
    const plusMinus = this.tree?.toggleIconType() === "plus-minus";
    const icon = !folder
      ? null
      : plusMinus
        ? expanded
          ? lucideMinus
          : lucidePlus
        : expanded
          ? lucideChevronDown
          : lucideChevronRight;
    return { name: node.getItemName(), icon };
  });

  protected readonly classes = computed(() =>
    cn("flex min-h-8 min-w-0 flex-1 items-center gap-2 self-stretch text-left", this.class()),
  );

  protected onClick(event: MouseEvent): void {
    const node = this.node();
    if (!node) return;
    // The chevron opens and closes a folder, and does nothing else; on a file it is the label.
    const toggle = (event.target as Element | null)?.closest?.("[data-tree-toggle]");
    if (toggle && node.isFolder()) {
      event.stopPropagation();
      if (node.isExpanded()) node.collapse();
      else node.expand();
      return;
    }
    event.stopPropagation();
    node.setFocused();
    node.getTree().updateDomFocus();
    if (event.defaultPrevented) return;
    selectOnClick(node, event);
    node.primaryAction();
  }
}

/** A drag handle for a row: `<span [koTreeDragHandle]="item">`. */
@Directive({ selector: "[koTreeDragHandle]", host: { "[class]": "classes()" } })
export class KoTreeDragHandle<T = unknown> {
  readonly koTreeDragHandle = input.required<ItemInstance<T>>();
  readonly class = input<string>("");

  protected readonly classes = computed(() =>
    cn(
      "grid size-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground opacity-40 transition-opacity hover:opacity-100 active:cursor-grabbing group-hover:opacity-100",
      this.class(),
    ),
  );

  constructor() {
    bindProps(() => {
      const item = this.koTreeDragHandle();
      return typeof item.getDragHandleProps === "function"
        ? (item.getDragHandleProps() as TreeElementProps)
        : null;
    });
  }
}
