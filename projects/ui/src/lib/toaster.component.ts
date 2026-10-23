import { ChangeDetectionStrategy, Component } from "@angular/core";
import { NgxSonnerToaster } from "ngx-sonner";

/** Sonner, drawn with the `app-toast` classes in theme.css. Mount once at the root. */
@Component({
  selector: "ko-toaster",
  imports: [NgxSonnerToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ngx-sonner-toaster
      theme="dark"
      position="bottom-right"
      [closeButton]="true"
      [duration]="3500"
      [offset]="20"
      [visibleToasts]="3"
      class="app-toaster"
      [toastOptions]="toastOptions"
    />
  `,
})
export class KoToaster {
  protected readonly toastOptions = {
    unstyled: true,
    classes: {
      toast: "app-toast",
      title: "app-toast__title",
      description: "app-toast__description",
      closeButton: "app-toast__close",
      success: "app-toast--success",
      error: "app-toast--error",
      warning: "app-toast--warning",
      info: "app-toast--info",
    },
  };
}
