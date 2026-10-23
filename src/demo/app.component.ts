import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { KoToaster } from "@koderi-dp/ui";

/** Providers and one-off mounts, above the shell so login-style pages could use them too. */
@Component({
  selector: "ko-demo-app",
  imports: [RouterOutlet, KoToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <ko-toaster />
  `,
})
export class KoDemoApp {}
