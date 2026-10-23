import {
  afterNextRender,
  computed,
  DestroyRef,
  effect,
  inject,
  signal,
  untracked,
  type Signal,
} from "@angular/core";
import {
  createTree,
  type FeatureImplementation,
  type ItemInstance,
  type TreeConfig,
  type TreeInstance,
  type TreeState,
} from "@headless-tree/core";
import { buildTreeConfig, type TreeControllerOptions } from "@/ui/tree-controller";

/** A headless-tree instance with its visible items as a signal. */
export type KoTreeHandle<T> = {
  tree: TreeInstance<T>;
  /** The visible items, in order; a new array whenever the tree's state changes. */
  items: Signal<ItemInstance<T>[]>;
  /** Re-reads the options (a new item list, say) and rebuilds the visible items. */
  rebuild(): void;
};

/**
 * The Angular counterpart of `@headless-tree/react`'s `useTree`, over `buildTreeConfig`.
 * The tree's state is mirrored into a signal, and every state change (through `setState`,
 * or a sub-state update a caller's own `set*` handler took over) bumps a version that
 * `items` is computed from, so a zoneless template re-renders. The options are re-read
 * whenever a signal they read changes; a structural change still needs `rebuild()`, as
 * React's `rebuildTree()` does. Call it in an injection context.
 */
export function injectTreeController<T>(options: () => TreeControllerOptions<T>): KoTreeHandle<T> {
  const destroyRef = inject(DestroyRef);
  const version = signal(0);
  const bump = () => version.update((v) => v + 1);

  const state = signal<TreeState<T>>({} as TreeState<T>);

  /** Catches every sub-state update, also those a caller's `set*` handler took over. */
  const signalsFeature: FeatureImplementation<T> = {
    key: "ko-signals",
    treeInstance: {
      applySubStateUpdate: ({ tree, prev }, ...args: unknown[]) => {
        (prev as (...a: unknown[]) => void)?.(...args);
        state.set({ ...tree.getState() });
        bump();
      },
    },
  };

  const configure = (opts: TreeControllerOptions<T>): TreeConfig<T> => {
    const config = buildTreeConfig(opts);
    return { ...config, features: [...(config.features ?? []), signalsFeature] };
  };

  const sync = (opts: TreeControllerOptions<T>) => {
    const next = configure(opts);
    tree.setConfig((prev) => ({
      ...prev,
      ...next,
      state: { ...untracked(state), ...next.state },
      setState: (updated) => {
        state.set({ ...(updated as TreeState<T>) });
        bump();
        next.setState?.(updated);
      },
    }));
  };

  const tree = createTree(configure(untracked(options)));
  state.set({ ...tree.getState() });
  sync(untracked(options));

  effect(() => {
    const opts = options();
    untracked(() => {
      sync(opts);
      bump();
    });
  });

  afterNextRender(() => {
    tree.setMounted(true);
    tree.rebuildTree();
    bump();
  });

  destroyRef.onDestroy(() => tree.setMounted(false));

  const items = computed(() => {
    version();
    return [...tree.getItems()];
  });

  return {
    tree,
    items,
    rebuild: () => {
      sync(untracked(options));
      tree.rebuildTree();
      bump();
    },
  };
}
