import { createContext, useContext, type HTMLAttributes } from "react";
import type { ItemInstance, TreeInstance } from "@headless-tree/core";
import { ChevronDown, ChevronRight, Minus, Plus } from "lucide-react";
import { cn } from "@/ui/utils";
import { selectOnClick } from "./tree-select";

type TreeContextValue<T> = {
  indent: number;
  tree?: TreeInstance<T>;
  toggleIconType: "chevron" | "plus-minus";
  currentItem?: ItemInstance<T>;
};

const TreeContext = createContext<TreeContextValue<any>>({
  indent: 12,
  toggleIconType: "chevron",
});

function useTreeContext<T>() {
  return useContext(TreeContext) as TreeContextValue<T>;
}

export type TreeProps<T> = HTMLAttributes<HTMLDivElement> & {
  tree: TreeInstance<T>;
  indent?: number;
  toggleIconType?: "chevron" | "plus-minus";
};

export function Tree<T>({
  tree,
  indent = 12,
  toggleIconType = "chevron",
  className,
  children,
  onKeyDown,
  ...props
}: TreeProps<T>) {
  const containerProps = tree.getContainerProps() as Record<string, unknown> & {
    ref?: (el: HTMLDivElement | null) => void;
  };
  const { ref: registerTree, ...containerRest } = containerProps;

  return (
    <TreeContext.Provider value={{ indent, tree, toggleIconType }}>
      <div
        ref={registerTree}
        className={cn("relative flex flex-col", className)}
        {...containerRest}
        {...props}
        onKeyDownCapture={onKeyDown}
      >
        {children}
        <TreeDragLine />
      </div>
    </TreeContext.Provider>
  );
}

export type TreeItemProps<T> = HTMLAttributes<HTMLDivElement> & {
  item: ItemInstance<T>;
  indent?: number;
};

export function TreeItem<T>({
  item,
  indent,
  className,
  children,
  onClick,
  ...props
}: TreeItemProps<T>) {
  const ctx = useTreeContext<T>();
  const level = item.getItemMeta().level;
  const pad = (indent ?? ctx.indent) * level + 8;
  const { onClick: _defaultClick, ...itemProps } = item.getProps();

  return (
    <TreeContext.Provider value={{ ...ctx, currentItem: item }}>
      <div
        {...itemProps}
        {...props}
        style={{ paddingLeft: pad, ...(props.style ?? {}) }}
        onClick={(e) => {
          onClick?.(e);
          if (e.defaultPrevented) return;
          // Ignore bubbled clicks — label/chevron/drag handle handle their own.
          if (e.target !== e.currentTarget) return;
          selectOnClick(item, e);
          item.setFocused();
          item.getTree().updateDomFocus();
          item.primaryAction();
        }}
        className={cn(
          "group flex min-h-8 items-stretch gap-0.5 rounded-md pr-1 text-sm outline-none",
          item.isSelected() && "bg-secondary",
          // Nest-into-folder only — ordered drops use TreeDragLine, not row fill/opacity.
          item.isUnorderedDragTarget() &&
            item.isFolder() &&
            "bg-signal/5 ring-1 ring-inset ring-signal/30",
          className,
        )}
      >
        {children}
      </div>
    </TreeContext.Provider>
  );
}

export type TreeItemLabelProps<T> = HTMLAttributes<HTMLButtonElement> & {
  item?: ItemInstance<T>;
};

export function TreeItemLabel<T>({
  item,
  className,
  children,
  onClick,
  ...props
}: TreeItemLabelProps<T>) {
  const ctx = useTreeContext<T>();
  const node = item ?? ctx.currentItem;
  if (!node) return null;

  const { toggleIconType } = ctx;
  const folder = node.isFolder();

  return (
    <button
      type="button"
      tabIndex={-1}
      className={cn(
        "flex min-h-8 min-w-0 flex-1 items-center gap-2 self-stretch text-left",
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        node.setFocused();
        node.getTree().updateDomFocus();
        onClick?.(e);
        if (e.defaultPrevented) return;
        selectOnClick(node, e);
        node.primaryAction();
      }}
      {...props}
    >
      <span
        data-tree-toggle=""
        className="grid size-6 shrink-0 place-items-center text-muted-foreground"
        onClick={(e) => {
          if (!folder) return;
          e.stopPropagation();
          if (node.isExpanded()) node.collapse();
          else node.expand();
        }}
      >
        {!folder ? (
          <span className="size-3.5" />
        ) : toggleIconType === "plus-minus" ? (
          node.isExpanded() ? (
            <Minus className="size-3.5" />
          ) : (
            <Plus className="size-3.5" />
          )
        ) : node.isExpanded() ? (
          <ChevronDown className="size-3.5" />
        ) : (
          <ChevronRight className="size-3.5" />
        )}
      </span>
      {children ?? <span className="truncate">{node.getItemName()}</span>}
    </button>
  );
}

export function TreeDragLine({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { tree } = useTreeContext();
  if (!tree || typeof tree.getDragLineStyle !== "function") return null;
  const style = tree.getDragLineStyle();
  if (!style || style.display === "none") return null;

  return (
    <div
      {...props}
      style={style}
      className={cn("pointer-events-none z-20 h-0.5 bg-signal", className)}
    />
  );
}

export function TreeDragHandle<T>({
  item,
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { item: ItemInstance<T> }) {
  return (
    <span
      {...item.getDragHandleProps()}
      className={cn(
        "grid size-6 shrink-0 cursor-grab touch-none place-items-center text-muted-foreground opacity-40 transition-opacity hover:opacity-100 active:cursor-grabbing group-hover:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export type { ItemInstance, TreeInstance };
