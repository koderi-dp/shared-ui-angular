import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { injectTreeController } from "./tree-adapter";
import { KoTree, KoTreeItem, KoTreeItemLabel } from "./tree.component";
import { TREE_ROOT } from "./tree-controller";

type Node = { id: string; parentId: string | null; name: string; folder: boolean };

const NODES: Node[] = [
  { id: TREE_ROOT, parentId: null, name: "root", folder: true },
  { id: "docs", parentId: TREE_ROOT, name: "docs", folder: true },
  { id: "docs/a.md", parentId: "docs", name: "a.md", folder: false },
  { id: "src", parentId: TREE_ROOT, name: "src", folder: true },
  { id: "src/b.ts", parentId: "src", name: "b.ts", folder: false },
  { id: "readme.md", parentId: TREE_ROOT, name: "readme.md", folder: false },
];

@Component({
  selector: "ko-tree-host",
  imports: [KoTree, KoTreeItem, KoTreeItemLabel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-tree [handle]="tree" aria-label="Files">
      <ng-template koTreeItem let-item>
        <ko-tree-item-label [item]="item" />
      </ng-template>
    </ko-tree>
  `,
})
class HostComponent {
  readonly nodes = signal(NODES);
  readonly tree = injectTreeController<Node>(() => ({
    items: this.nodes(),
    getId: (node) => node.id,
    getParentId: (node) => node.parentId,
    getItemName: (node) => node.name,
    isFolder: (node) => node.folder,
    selectable: true,
  }));
}

describe("KoTree", () => {
  let fixture: ComponentFixture<HostComponent>;
  let root: HTMLElement;
  const settle = () => fixture.whenStable();
  const container = () => root.querySelector<HTMLElement>("ko-tree")!;
  const rows = () => [...root.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const row = (name: string) => rows().find((el) => el.getAttribute("aria-label") === name)!;
  const names = () => rows().map((el) => el.getAttribute("aria-label"));
  const press = async (key: string) => {
    container().dispatchEvent(
      new KeyboardEvent("keydown", { key, code: key, bubbles: true, cancelable: true }),
    );
    document.dispatchEvent(new KeyboardEvent("keyup", { key, code: key, bubbles: true }));
    await settle();
  };
  const click = async (el: HTMLElement, init: MouseEventInit = {}) => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
    await settle();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(HostComponent);
    root = fixture.nativeElement;
    await settle();
  });

  it("renders the top level as a tree, without the root", () => {
    expect(container().getAttribute("role")).toBe("tree");
    expect(container().getAttribute("aria-label")).toBe("Files");
    expect(names()).toEqual(["docs", "src", "readme.md"]);
  });

  it("moves focus to the next visible item on ArrowDown", async () => {
    await click(row("docs"));
    expect(row("docs").getAttribute("tabindex")).toBe("0");
    await press("ArrowDown");
    expect(row("docs").getAttribute("tabindex")).toBe("-1");
    expect(row("src").getAttribute("tabindex")).toBe("0");
  });

  it("expands a closed folder on ArrowRight and collapses it on ArrowLeft", async () => {
    await click(row("docs"));
    expect(row("docs").getAttribute("aria-expanded")).toBe("false");
    await press("ArrowRight");
    expect(row("docs").getAttribute("aria-expanded")).toBe("true");
    expect(names()).toEqual(["docs", "a.md", "src", "readme.md"]);
    await press("ArrowLeft");
    expect(row("docs").getAttribute("aria-expanded")).toBe("false");
    expect(names()).toEqual(["docs", "src", "readme.md"]);
  });

  it("selects on click and adds to the selection on Ctrl+click", async () => {
    await click(row("docs"));
    expect(row("docs").getAttribute("aria-selected")).toBe("true");
    expect(row("src").getAttribute("aria-selected")).toBe("false");
    await click(row("src"), { ctrlKey: true });
    expect(row("docs").getAttribute("aria-selected")).toBe("true");
    expect(row("src").getAttribute("aria-selected")).toBe("true");
    expect(fixture.componentInstance.tree.tree.getState().selectedItems).toEqual(["docs", "src"]);
  });

  it("opens a folder from the chevron of its label", async () => {
    row("src").querySelector<HTMLElement>("[data-tree-toggle]")!.click();
    await settle();
    expect(names()).toEqual(["docs", "src", "b.ts", "readme.md"]);
  });

  it("renders a new item after the items are replaced and the tree rebuilt", async () => {
    const host = fixture.componentInstance;
    host.nodes.update((nodes) => [
      ...nodes,
      { id: "license", parentId: TREE_ROOT, name: "LICENSE", folder: false },
    ]);
    host.tree.rebuild();
    await settle();
    expect(names()).toEqual(["docs", "src", "readme.md", "LICENSE"]);
  });
});
