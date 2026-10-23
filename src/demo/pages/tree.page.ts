import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
  untracked,
} from "@angular/core";
import type { ItemInstance } from "@headless-tree/core";
import { NgIcon } from "@ng-icons/core";
import {
  lucideFileText,
  lucideFolder,
  lucideFolderOpen,
  lucideFolderTree,
  lucideGripVertical,
} from "@ng-icons/lucide";
import {
  KoPageHeader,
  KoPageShell,
  KoCard,
  KoCardContent,
  KoCardDescription,
  KoCardHeader,
  KoCardTitle,
  KoLabel,
  KoSwitch,
} from "@koderi-dp/ui";
import {
  injectTreeController,
  KoTree,
  KoTreeDragHandle,
  KoTreeItem,
  KoTreeItemLabel,
  TREE_ROOT,
} from "@koderi-dp/ui/tree";
import { isAncestor, moveNodes } from "@/demo/file-tree";

type Node = { id: string; parentId: string | null; name: string; kind: "root" | "folder" | "file" };

const INITIAL: Node[] = [
  { id: TREE_ROOT, parentId: null, name: "workspace", kind: "root" },
  { id: "src", parentId: TREE_ROOT, name: "src", kind: "folder" },
  { id: "src/ui", parentId: "src", name: "ui", kind: "folder" },
  { id: "src/ui/tree.tsx", parentId: "src/ui", name: "tree.tsx", kind: "file" },
  { id: "src/ui/button.tsx", parentId: "src/ui", name: "button.tsx", kind: "file" },
  { id: "src/server", parentId: "src", name: "server", kind: "folder" },
  { id: "src/server/db.ts", parentId: "src/server", name: "db.ts", kind: "file" },
  { id: "src/readme.md", parentId: "src", name: "readme.md", kind: "file" },
  { id: "tests", parentId: TREE_ROOT, name: "tests", kind: "folder" },
  { id: "tests/tree.test.ts", parentId: "tests", name: "tree.test.ts", kind: "file" },
  { id: "package.json", parentId: TREE_ROOT, name: "package.json", kind: "file" },
];

const getId = (node: Node) => node.id;
const getParentId = (node: Node) => node.parentId;
const getItemName = (node: Node) => node.name;
const isFolder = (node: Node) => node.kind !== "file";

/** The tree item on a page of its own: the whole controller, and one row per item. */
@Component({
  selector: "ko-tree-page",
  imports: [
    KoPageShell,
    KoPageHeader,
    KoCard,
    KoCardHeader,
    KoCardTitle,
    KoCardDescription,
    KoCardContent,
    KoLabel,
    KoSwitch,
    KoTree,
    KoTreeItem,
    KoTreeItemLabel,
    KoTreeDragHandle,
    NgIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    <ko-page-shell gap="loose">
      <ko-page-header
        kicker="Registry"
        title="Tree"
        description="One flat list in, a tree out: the loader, the root and the usual features are wired for you."
      />
      <ko-card>
        <ko-card-header>
          <div class="flex items-start justify-between gap-4">
            <div class="grid gap-1.5">
              <ko-card-title>Files</ko-card-title>
              <ko-card-description>
                Arrow keys move, left and right open and close, and Enter opens. Drag a row onto a
                folder to move it in, or between rows to place it. Turn off drag to drop the
                handles.
              </ko-card-description>
            </div>
            <div class="flex items-center gap-2">
              <ko-switch id="tree-drag" [(checked)]="draggable" />
              <label koLabel for="tree-drag">Drag</label>
            </div>
          </div>
        </ko-card-header>
        <ko-card-content>
          <ko-tree
            [handle]="tree"
            class="rounded-lg bg-inset p-1 shadow-[var(--shadow-border)]"
            aria-label="Files"
          >
            <ng-template [koTreeItem]="tree" let-item>
              @if (draggable()) {
                <span [koTreeDragHandle]="item" aria-hidden="true">
                  <ng-icon size="0.875rem" [svg]="icons.grip" />
                </span>
              }
              <ko-tree-item-label>
                <ng-icon size="1rem" class="shrink-0 text-muted-foreground" [svg]="iconOf(item)" />
                <span class="truncate">{{ item.getItemData().name }}</span>
                @if (item.getItemData().kind !== "file") {
                  <span class="ml-auto pr-1 text-xs text-muted-foreground">
                    {{ item.getChildren().length }}
                  </span>
                }
              </ko-tree-item-label>
            </ng-template>
          </ko-tree>
        </ko-card-content>
      </ko-card>
      <ko-card>
        <ko-card-header>
          <ko-card-title>Selection</ko-card-title>
          <ko-card-description>
            <ng-icon size="0.875rem" class="mr-1 align-[-2px]" [svg]="icons.folderTree" />
            The same array the tree keeps, so an app can act on it.
          </ko-card-description>
        </ko-card-header>
        <ko-card-content>
          <p class="text-sm text-muted-foreground">
            {{ selected().length === 0 ? "Nothing selected." : selected().join(", ") }}
          </p>
        </ko-card-content>
      </ko-card>
    </ko-page-shell>
  `,
})
export class KoTreePage {
  protected readonly icons = {
    grip: lucideGripVertical,
    folderTree: lucideFolderTree,
  };

  private readonly nodes = signal(INITIAL);
  protected readonly draggable = signal(true);
  protected readonly selected = signal<string[]>([]);

  protected readonly tree = injectTreeController<Node>(() => {
    const nodes = this.nodes();
    return {
      items: nodes,
      getId,
      getParentId,
      getItemName,
      isFolder,
      selectable: true,
      draggable: this.draggable(),
      tree: {
        state: { selectedItems: this.selected() },
        setSelectedItems: (updater) =>
          this.selected.update((prev) => (typeof updater === "function" ? updater(prev) : updater)),
        // A drop on a folder goes last in it; a drop between rows goes at the drag line.
        canReorder: true,
        canDrop: (items, target) => {
          const to = target.item.getId();
          return items.every((item) => item.getId() !== to && !isAncestor(nodes, item.getId(), to));
        },
        onDrop: (items, target) => {
          const ids = items.map((item) => item.getId());
          const index = "insertionIndex" in target ? target.insertionIndex : undefined;
          this.nodes.update((prev) => moveNodes(prev, ids, target.item.getId(), index));
        },
      },
    };
  });

  /** The tree reads through the loader; a new loader alone does not make it re-read. */
  private readonly structureKey = computed(() =>
    this.nodes()
      .map((node) => `${node.id}:${node.parentId}`)
      .join("|"),
  );

  constructor() {
    effect(() => {
      this.structureKey();
      untracked(() => this.tree.rebuild());
    });
  }

  protected iconOf(item: ItemInstance<Node>): string {
    if (item.getItemData().kind === "file") return lucideFileText;
    return item.isExpanded() ? lucideFolderOpen : lucideFolder;
  }
}
