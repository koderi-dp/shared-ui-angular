// Adapted from Zard UI 1.1.1 (MIT) — https://github.com/zard-ui/zardui
import { Dialog, type DialogRef } from "@angular/cdk/dialog";
import { inject, Injectable, type Type } from "@angular/core";

/** Panel classes from the React `DialogContent`; padding is added where the panel has no wrapper. */
export const KO_DIALOG_PANEL_CLASS = [
  "w-[calc(100%-2rem)]",
  "max-w-lg",
  "rounded-xl",
  "bg-popover",
  "shadow-[var(--shadow-elevated)]",
  "duration-200",
  "animate-in",
  "fade-in-0",
  "zoom-in-95",
];

/** Backdrop classes from the React `DialogOverlay`. */
export const KO_DIALOG_BACKDROP_CLASS = ["bg-background/70", "animate-in", "fade-in-0"];

export interface KoDialogConfig<D = unknown> {
  data?: D;
  ariaLabel?: string;
}

/**
 * Opens a component in the dialog overlay: focus trap, Escape, backdrop click and focus return
 * come from the CDK. Put `ko-dialog-title` in the component, or pass `ariaLabel`.
 */
@Injectable({ providedIn: "root" })
export class KoDialogService {
  private readonly dialog = inject(Dialog);

  open<C, D = unknown, R = unknown>(
    component: Type<C>,
    config: KoDialogConfig<D> = {},
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(component, {
      data: config.data,
      ariaLabel: config.ariaLabel,
      role: "dialog",
      ariaModal: true,
      panelClass: [...KO_DIALOG_PANEL_CLASS, "p-5"],
      backdropClass: KO_DIALOG_BACKDROP_CLASS,
    });
  }
}
