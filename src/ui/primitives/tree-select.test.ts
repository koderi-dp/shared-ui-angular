import { createTree, type TreeInstance } from "@headless-tree/core";
import { expect, it } from "vitest";
import { buildTreeConfig, TREE_ROOT } from "@/ui/tree-controller";
import { selectOnClick } from "./tree-select";

type Node = { id: string; parentId: string | null; folder: boolean };

const nodes: Node[] = [
  { id: TREE_ROOT, parentId: null, folder: true },
  { id: "a", parentId: TREE_ROOT, folder: true },
  { id: "b", parentId: TREE_ROOT, folder: false },
  { id: "c", parentId: TREE_ROOT, folder: false },
  { id: "d", parentId: TREE_ROOT, folder: false },
];

const plain = { shiftKey: false, ctrlKey: false, metaKey: false };
const ctrl = { ...plain, ctrlKey: true };
const shift = { ...plain, shiftKey: true };

function mount(selectable = true): TreeInstance<Node> {
  const tree = createTree(
    buildTreeConfig({
      items: nodes,
      getId: (node) => node.id,
      getParentId: (node) => node.parentId,
      getItemName: (node) => node.id,
      isFolder: (node) => node.folder,
      selectable,
    }),
  );
  tree.setMounted(true);
  tree.rebuildTree();
  return tree;
}

const selected = (tree: TreeInstance<Node>) => tree.getState().selectedItems ?? [];

it("selects the clicked row alone", () => {
  const tree = mount();
  selectOnClick(tree.getItemInstance("b"), plain);
  selectOnClick(tree.getItemInstance("c"), plain);
  expect(selected(tree)).toEqual(["c"]);
});

it("adds and removes a row with Ctrl", () => {
  const tree = mount();
  selectOnClick(tree.getItemInstance("b"), plain);
  selectOnClick(tree.getItemInstance("d"), ctrl);
  expect(selected(tree)).toEqual(["b", "d"]);
  selectOnClick(tree.getItemInstance("b"), ctrl);
  expect(selected(tree)).toEqual(["d"]);
});

it("selects the range from the last clicked row with Shift", () => {
  const tree = mount();
  selectOnClick(tree.getItemInstance("b"), plain);
  selectOnClick(tree.getItemInstance("d"), shift);
  expect([...selected(tree)].sort()).toEqual(["b", "c", "d"]);
});

it("leaves a folder closed: selecting is not opening", () => {
  const tree = mount();
  selectOnClick(tree.getItemInstance("a"), plain);
  expect(selected(tree)).toEqual(["a"]);
  expect(tree.getItemInstance("a").isExpanded()).toBe(false);
});

it("does nothing on a tree without selection", () => {
  const tree = mount(false);
  expect(() => selectOnClick(tree.getItemInstance("b"), plain)).not.toThrow();
});
