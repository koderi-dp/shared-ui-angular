import type { ItemInstance } from "@headless-tree/core";

type ClickModifiers = { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean };

/**
 * The selection half of headless-tree's row click, without the folder toggle that comes with
 * it (the rows open and close from the chevron only). A click selects the row, Ctrl or Cmd
 * adds or removes it, and Shift selects the range from the last row clicked. Does nothing
 * when the tree has no selection feature.
 */
export function selectOnClick<T>(item: ItemInstance<T>, e: ClickModifiers): void {
  if (typeof item.toggleSelect !== "function") return;
  const tree = item.getTree();
  const additive = e.ctrlKey || e.metaKey;
  if (e.shiftKey) item.selectUpTo(additive);
  else if (additive) item.toggleSelect();
  else tree.setSelectedItems([item.getId()]);
  // The anchor a later Shift-click ranges from, kept where headless-tree keeps it.
  if (!e.shiftKey) {
    tree.getDataRef<{ selectUpToAnchorId?: string | null }>().current.selectUpToAnchorId =
      item.getId();
  }
}
