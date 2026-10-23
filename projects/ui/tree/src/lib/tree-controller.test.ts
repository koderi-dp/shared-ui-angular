import { createTree, type TreeInstance } from "@headless-tree/core";
import { expect, it } from "vitest";
import {
  buildTreeConfig,
  createTreeIndex,
  resolveRootId,
  TREE_ROOT,
  treeFeatures,
  type TreeControllerOptions,
} from "./tree-controller";

type Node = { id: string; parentId: string | null; name: string; folder: boolean };

const getId = (node: Node) => node.id;
const getParentId = (node: Node) => node.parentId;
const getItemName = (node: Node) => node.name;
const isFolder = (node: Node) => node.folder;

const tree: Node[] = [
  { id: TREE_ROOT, parentId: null, name: "All", folder: true },
  { id: "a", parentId: TREE_ROOT, name: "A", folder: true },
  { id: "a1", parentId: "a", name: "A1", folder: false },
  { id: "a2", parentId: "a", name: "A2", folder: false },
  { id: "b", parentId: TREE_ROOT, name: "B", folder: false },
];

it("takes the one top-level item as the root when it is not named", () => {
  expect(resolveRootId(tree, { getId, getParentId })).toBe(TREE_ROOT);
});

it("takes a named root, and refuses one that is not an item", () => {
  expect(resolveRootId(tree, { getId, getParentId }, "a")).toBe("a");
  expect(() => resolveRootId(tree, { getId, getParentId }, "nope")).toThrow(/not one of the items/);
});

it("refuses to guess a root when the top level is empty or crowded", () => {
  expect(() => resolveRootId([], { getId, getParentId })).toThrow(/No tree item is at the top/);
  const two: Node[] = [
    { id: "x", parentId: null, name: "X", folder: false },
    { id: "y", parentId: null, name: "Y", folder: false },
  ];
  expect(() => resolveRootId(two, { getId, getParentId })).toThrow(
    /Several tree items are at the top/,
  );
});

it("groups the items under their parent, in the order they were given", () => {
  const { dataLoader, hasChildren, rootId } = createTreeIndex(tree, { getId, getParentId });
  expect(rootId).toBe(TREE_ROOT);
  expect(dataLoader.getChildren(TREE_ROOT)).toEqual(["a", "b"]);
  expect(dataLoader.getChildren("a")).toEqual(["a1", "a2"]);
  expect(dataLoader.getChildren("a1")).toEqual([]);
  expect(hasChildren("a")).toBe(true);
  expect(hasChildren("a1")).toBe(false);
  expect(hasChildren(TREE_ROOT)).toBe(true);
});

it("returns the item for an id, and throws for one it does not have", () => {
  const { dataLoader } = createTreeIndex(tree, { getId, getParentId });
  expect(dataLoader.getItem("a1")).toBe(tree[2]);
  expect(() => dataLoader.getItem("gone")).toThrow(/No tree item with id "gone"/);
});

it("shows an item whose parent is missing at the root, and never the root as its own child", () => {
  const orphan: Node[] = [
    { id: TREE_ROOT, parentId: null, name: "All", folder: true },
    { id: "kept", parentId: "deleted", name: "Kept", folder: false },
  ];
  const { dataLoader } = createTreeIndex(orphan, { getId, getParentId });
  expect(dataLoader.getChildren(TREE_ROOT)).toEqual(["kept"]);
  expect(dataLoader.getChildren(TREE_ROOT)).not.toContain(TREE_ROOT);
});

/** The config built the way the hook builds it, driven by the engine with no React. */
function mount(options: Partial<TreeControllerOptions<Node>> = {}): TreeInstance<Node> {
  const mounted = createTree(
    buildTreeConfig({ items: tree, getId, getParentId, getItemName, isFolder, ...options }),
  );
  mounted.setMounted(true);
  mounted.rebuildTree();
  return mounted;
}

it("reads the rows, folders and labels of a real tree off the flat list", () => {
  const mounted = mount();
  // Only the top level is shown until a folder opens.
  expect(mounted.getItems().map((item) => item.getId())).toEqual(["a", "b"]);
  expect(
    mounted
      .getItemInstance(TREE_ROOT)
      .getChildren()
      .map((item) => item.getId()),
  ).toEqual(["a", "b"]);
  expect(mounted.getItemInstance("a").isFolder()).toBe(true);
  expect(mounted.getItemInstance("a").getItemName()).toBe("A");

  mounted.getItemInstance("a").expand();
  expect(mounted.getItems().map((item) => item.getId())).toEqual(["a", "a1", "a2", "b"]);
  expect(
    mounted
      .getItemInstance("a")
      .getChildren()
      .map((item) => item.getId()),
  ).toEqual(["a1", "a2"]);
  expect(mounted.getItemInstance("a1").isFolder()).toBe(false);
});

it("opens and closes a folder", () => {
  const mounted = mount();
  const folder = mounted.getItemInstance("a");
  expect(folder.isExpanded()).toBe(false);
  folder.expand();
  expect(folder.isExpanded()).toBe(true);
  folder.collapse();
  expect(folder.isExpanded()).toBe(false);
});

it("leaves selection and drag-and-drop off unless they are asked for", () => {
  const plain = mount();
  expect(typeof plain.getItemInstance("a").isSelected).not.toBe("function");
  expect(typeof plain.getItemInstance("a").getDragHandleProps).not.toBe("function");

  const rich = mount({ selectable: true, draggable: true });
  expect(typeof rich.getItemInstance("a").isSelected).toBe("function");
  expect(typeof rich.getItemInstance("a").getDragHandleProps).toBe("function");
  rich.getItemInstance("a").select();
  expect(rich.getState().selectedItems ?? []).toContain("a");
});

it("ends the feature list with the focus fix, whichever features are on", () => {
  expect(
    treeFeatures()
      .map((feature) => feature.key)
      .at(-1),
  ).toBe("prevent-scroll-focus");
  expect(treeFeatures({ selectable: true, draggable: true }).at(-1)).toBe(treeFeatures().at(-1));
});
