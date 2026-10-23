// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Dialog, type DialogRef } from "@angular/cdk/dialog";
import { inject, Injectable, type Type } from "@angular/core";
import { animateExit } from "./dialog-exit";

/** Panel classes from the React `DialogContent`; padding is added where the panel has no wrapper. */
export const KO_DIALOG_PANEL_CLASS = [
  "rounded-xl",
  "bg-popover",
  "shadow-[var(--shadow-elevated)]",
  "duration-200",
  "animate-in",
  "fade-in-0",
  "zoom-in-95",
];

/**
 * Size goes through the overlay config (inline styles): the CDK injects an unlayered
 * `.cdk-overlay-pane { max-width: 100% }` that beats Tailwind utilities, so `max-w-lg` cannot work.
 * 32rem is `--container-lg`.
 */
export const KO_DIALOG_SIZE = { width: "calc(100% - 2rem)", maxWidth: "32rem" } as const;

/** Backdrop classes from the React `DialogOverlay`. */
export const KO_DIALOG_BACKDROP_CLASS = ["bg-background/70", "animate-in", "fade-in-0"];

export interface KoDialogConfig<D = unknown> {
  data?: D;
  ariaLabel?: string;
  /** Ignore Escape and backdrop clicks; `ref.close()` still closes. Also settable on the ref. */
  disableClose?: boolean;
}

/**
 * Opens a component in the dialog overlay: focus trap, Escape, backdrop click and focus return
 * come from the CDK, and `ref.close()` plays the exit animation before `closed` emits. Put
 * `ko-dialog-title` in the component, or pass `ariaLabel`.
 */
@Injectable({ providedIn: "root" })
export class KoDialogService {
  private readonly dialog = inject(Dialog);

  open<C, D = unknown, R = unknown>(
    component: Type<C>,
    config: KoDialogConfig<D> = {},
  ): DialogRef<R, C> {
    const ref = this.dialog.open<R, D, C>(component, {
      data: config.data,
      ariaLabel: config.ariaLabel,
      disableClose: config.disableClose,
      role: "dialog",
      ariaModal: true,
      ...KO_DIALOG_SIZE,
      panelClass: [...KO_DIALOG_PANEL_CLASS, "p-5"],
      backdropClass: KO_DIALOG_BACKDROP_CLASS,
    });
    animateExit(ref, "dialog");
    return ref;
  }
}
