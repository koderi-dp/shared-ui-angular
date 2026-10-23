/** A row of the tree page's flat list. A folder's children are in the order the list has them. */
export type FlatNode = { id: string; parentId: string | null };

/** Whether `ancestorId` is above `id`, so `id` cannot take it as a child. */
export function isAncestor(nodes: FlatNode[], ancestorId: string, id: string): boolean {
  let current = nodes.find((node) => node.id === id)?.parentId ?? null;
  while (current) {
    if (current === ancestorId) return true;
    current = nodes.find((node) => node.id === current)?.parentId ?? null;
  }
  return false;
}

/**
 * Moves `ids` under `parentId`, in the order given. `index` is their place among the parent's
 * other children (the dragged rows left out), as headless-tree's `insertionIndex` gives it;
 * without one, or past the end, they go last.
 */
export function moveNodes<T extends FlatNode>(
  nodes: T[],
  ids: string[],
  parentId: string,
  index?: number,
): T[] {
  const moving = new Set(ids);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const moved = ids.flatMap((id) => {
    const node = byId.get(id);
    return node ? [{ ...node, parentId }] : [];
  });
  const rest = nodes.filter((node) => !moving.has(node.id));
  const siblings = rest.filter((node) => node.parentId === parentId);
  const before = index === undefined ? undefined : siblings[index];
  const at = before ? rest.indexOf(before) : rest.length;
  return [...rest.slice(0, at), ...moved, ...rest.slice(at)];
}
