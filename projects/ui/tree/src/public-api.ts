/*
 * @koderi-dp/ui/tree: the tree component and its controller, built on @headless-tree/core.
 */

export {
  KO_TREE_ITEM,
  KoTree,
  KoTreeDragHandle,
  KoTreeDragLine,
  KoTreeItem,
  KoTreeItemLabel,
  KoTreeItemProps,
} from "./lib/tree.component";
export { injectTreeController, type KoTreeHandle } from "./lib/tree-adapter";
export {
  buildTreeConfig,
  createTreeIndex,
  resolveRootId,
  TREE_ROOT,
  treeFeatures,
  type TreeAccessors,
  type TreeControllerOptions,
  type TreeIdentity,
} from "./lib/tree-controller";
export { preventScrollFocusFeature } from "./lib/tree-focus";
export { selectOnClick } from "./lib/tree-select";
export type { ItemInstance, TreeInstance } from "@headless-tree/core";
