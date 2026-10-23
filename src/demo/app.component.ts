import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { KoToaster } from "@/ui/toaster.component";

@Component({
  selector: "ko-demo-app",
  imports: [RouterOutlet, KoToaster],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="h-dvh overflow-y-auto">
      <h1 class="p-6 text-lg font-semibold">shared-ui</h1>
      <router-outlet />
    </main>
    <ko-toaster />
  `,
})
export class KoDemoApp {}
