import type { DialogRef } from "@angular/cdk/dialog";

export type KoExitKind = "dialog" | "left" | "right";

/**
 * Exit classes per panel kind, mirroring the enter classes. The strings are literal so Tailwind
 * generates them. `fill-mode-forwards` keeps the panel hidden if the backdrop (150ms) or the
 * panel ends before the close lands. `duration-*` stays on the pane from the enter classes.
 */
export const KO_EXIT_PANEL: Record<KoExitKind, { classes: string[]; durationMs: number }> = {
  dialog: {
    classes: ["animate-out", "fade-out-0", "zoom-out-95", "fill-mode-forwards"],
    durationMs: 200,
  },
  left: { classes: ["animate-out", "slide-out-to-left", "fill-mode-forwards"], durationMs: 300 },
  right: { classes: ["animate-out", "slide-out-to-right", "fill-mode-forwards"], durationMs: 300 },
};

export const KO_EXIT_BACKDROP = ["animate-out", "fade-out-0", "fill-mode-forwards"];

/** Slack on top of the animation duration before the fallback closes the dialog anyway. */
export const KO_EXIT_MARGIN_MS = 50;

const ENTER_CLASS = /^(animate-in|fade-in|zoom-in|slide-in)/;

type MatchMedia = (query: string) => { matches: boolean };

/** True when the user asked for reduced motion; false where `matchMedia` is missing. */
export function prefersReducedMotion(
  matchMedia: MatchMedia | undefined = globalThis.matchMedia?.bind(globalThis),
): boolean {
  return matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

export interface KoExitController {
  /** True between a close request and the real close. */
  readonly closing: boolean;
  /** Abort a pending close and bring the panel back. Returns whether one was pending. */
  cancel(): boolean;
  /** Close at once, skipping the animation (for example when the host component is destroyed). */
  closeNow(): void;
}

/**
 * Makes `ref.close()` play an exit animation first. The CDK calls `close` for Escape, backdrop
 * clicks and `closeOnOverlayDetachments` too, so patching it on the instance covers every path.
 * The result is kept and passed to the real close, so `ref.closed` still emits it, after the
 * animation. A second `close` while one is pending is ignored (the first result wins).
 */
export function animateExit<R, C>(
  ref: DialogRef<R, C>,
  kind: KoExitKind,
  reducedMotion: () => boolean = prefersReducedMotion,
): KoExitController {
  const realClose = ref.close.bind(ref);
  const { classes, durationMs } = KO_EXIT_PANEL[kind];
  let stop: (() => void) | undefined;
  let restore: (() => void) | undefined;

  const settle = (): void => {
    stop?.();
    stop = restore = undefined;
  };

  ref.close = (...args: Parameters<typeof realClose>): void => {
    if (stop) return;
    const pane = ref.overlayRef.overlayElement;
    if (reducedMotion() || !pane?.isConnected) {
      realClose(...args);
      return;
    }
    const backdrop = ref.overlayRef.backdropElement;
    const removed = Array.from(pane.classList).filter((name) => ENTER_CLASS.test(name));
    pane.classList.remove(...removed);
    pane.classList.add(...classes);
    backdrop?.classList.remove(
      ...Array.from(backdrop.classList).filter((n) => ENTER_CLASS.test(n)),
    );
    backdrop?.classList.add(...KO_EXIT_BACKDROP);

    const finish = (): void => {
      settle();
      realClose(...args);
    };
    const onEnd = (event: AnimationEvent): void => {
      if (event.target === pane) finish();
    };
    const timer = setTimeout(finish, durationMs + KO_EXIT_MARGIN_MS);
    pane.addEventListener("animationend", onEnd);
    stop = () => {
      clearTimeout(timer);
      pane.removeEventListener("animationend", onEnd);
    };
    restore = () => {
      pane.classList.remove(...classes);
      pane.classList.add(...removed);
      backdrop?.classList.remove(...KO_EXIT_BACKDROP);
      backdrop?.classList.add("animate-in", "fade-in-0");
    };
  };

  return {
    get closing() {
      return stop !== undefined;
    },
    cancel() {
      if (!stop) return false;
      restore?.();
      settle();
      return true;
    },
    closeNow() {
      settle();
      realClose();
    },
  };
}
