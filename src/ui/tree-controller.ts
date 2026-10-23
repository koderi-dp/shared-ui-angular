import {
  dragAndDropFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  type FeatureImplementation,
  type TreeConfig,
  type TreeInstance,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { preventScrollFocusFeature } from "@/ui/primitives/tree-focus";

/** The id the root of a tree is expected to carry when it is not passed explicitly. */
export const TREE_ROOT = "__root__";

/** What every tree needs to know about an item: its id, and its parent's id. */
export type TreeIdentity<T> = {
  getId: (item: T) => string;
  /** The parent id, or null/undefined for an item at the top level. */
  getParentId: (item: T) => string | null | undefined;
};

/** How to read an item: its identity, its label, and whether it can hold children. */
export type TreeAccessors<T> = TreeIdentity<T> & {
  getItemName: (item: T) => string;
  /** Defaults to "it has children", read from the items themselves. */
  isFolder?: (item: T) => boolean;
};

/** The synchronous loader a flat list is read through. */
export type TreeLoader<T> = {
  getItem: (itemId: string) => T;
  getChildren: (itemId: string) => string[];
};

/** A flat list, ready for headless-tree: the resolved root, its loader, and a child test. */
export type TreeIndex<T> = {
  rootId: string;
  dataLoader: TreeLoader<T>;
  hasChildren: (itemId: string) => boolean;
};

/**
 * Which item is the root. An explicit id wins, and has to be one of the items; otherwise
 * the single item with no parent is the root, and an ambiguous list is an error rather
 * than a guess. An item whose parent is missing is not a root: it is shown at the root.
 */
export function resolveRootId<T>(
  items: T[],
  { getId, getParentId }: TreeIdentity<T>,
  rootId?: string,
): string {
  const ids = new Set(items.map(getId));
  if (rootId !== undefined) {
    if (!ids.has(rootId)) throw new Error(`Tree root "${rootId}" is not one of the items.`);
    return rootId;
  }
  const top = items
    .filter((item) => {
      const parent = getParentId(item);
      return parent === null || parent === undefined;
    })
    .map(getId);
  if (top.length === 1) return top[0];
  throw new Error(
    top.length === 0
      ? "No tree item is at the top level; name one with rootId."
      : `Several tree items are at the top level (${top.join(", ")}); name one with rootId.`,
  );
}

/**
 * Turns a flat list into headless-tree's `dataLoader`, with the root resolved. Items keep
 * the order they were given in, within their parent. An item whose parent is missing is
 * shown at the root, as is the root itself — it is never its own child.
 */
export function createTreeIndex<T>(
  items: T[],
  accessors: TreeIdentity<T> & { rootId?: string },
): TreeIndex<T> {
  const { getId, getParentId } = accessors;
  const byId = new Map<string, T>();
  for (const item of items) byId.set(getId(item), item);

  const rootId = resolveRootId(items, accessors, accessors.rootId);
  const children = new Map<string, string[]>();
  for (const item of items) {
    const id = getId(item);
    if (id === rootId) continue;
    const parent = getParentId(item);
    const key = parent === null || parent === undefined || !byId.has(parent) ? rootId : parent;
    const bucket = children.get(key);
    if (bucket) bucket.push(id);
    else children.set(key, [id]);
  }

  return {
    rootId,
    hasChildren: (itemId) => (children.get(itemId)?.length ?? 0) > 0,
    dataLoader: {
      getItem: (itemId) => {
        const item = byId.get(itemId);
        if (item === undefined) throw new Error(`No tree item with id "${itemId}".`);
        return item;
      },
      getChildren: (itemId) => children.get(itemId) ?? [],
    },
  };
}

/** Expansion and keyboard, selection and drag-and-drop on request, the focus fix last. */
export function treeFeatures<T = unknown>({
  selectable,
  draggable,
}: { selectable?: boolean; draggable?: boolean } = {}): FeatureImplementation<T>[] {
  return [
    syncDataLoaderFeature,
    hotkeysCoreFeature,
    ...(selectable ? [selectionFeature] : []),
    ...(draggable ? [dragAndDropFeature] : []),
    // Last: the other features never touch updateDomFocus, but it means to be last.
    preventScrollFocusFeature,
  ];
}

export type TreeControllerOptions<T> = TreeAccessors<T> & {
  /** The flat list. One item is the root: name it with rootId, or leave one with no parent. */
  items: T[];
  rootId?: string;
  indent?: number;
  /** Selection on and off. Off by default: a plain tree needs no selection. */
  selectable?: boolean;
  /** Drag-and-drop on and off. Off by default. */
  draggable?: boolean;
  /** Replaces the default features entirely. */
  features?: FeatureImplementation<T>[];
  /** Anything else headless-tree takes, used as passed. */
  tree?: Omit<
    TreeConfig<T>,
    "rootItemId" | "dataLoader" | "getItemName" | "isItemFolder" | "features"
  >;
};

/**
 * The headless-tree config for a flat list: the loader built, the root resolved, the label
 * and folder test read off the item, and the usual features set. Pure, so it can be built
 * and driven without React.
 */
export function buildTreeConfig<T>({
  items,
  getId,
  getParentId,
  getItemName,
  isFolder,
  rootId,
  indent = 12,
  selectable,
  draggable,
  features,
  tree,
}: TreeControllerOptions<T>): TreeConfig<T> {
  const index = createTreeIndex(items, { getId, getParentId, rootId });
  return {
    indent,
    ...tree,
    rootItemId: index.rootId,
    getItemName: (item) => getItemName(item.getItemData()),
    isItemFolder: (item) =>
      isFolder ? isFolder(item.getItemData()) : index.hasChildren(item.getId()),
    dataLoader: index.dataLoader,
    features: features ?? treeFeatures<T>({ selectable, draggable }),
  };
}

/**
 * The whole of a tree's wiring, in one call: the flat list in, a headless-tree instance
 * out. Render it with the `Tree` and `TreeItem` primitives, and own only the data and the
 * actions. A structural change to the items needs `tree.rebuildTree()`: the tree reads
 * through the loader, and a new loader alone does not make it re-read.
 */
export function useTreeController<T>(options: TreeControllerOptions<T>): TreeInstance<T> {
  return useTree<T>(buildTreeConfig(options));
}
