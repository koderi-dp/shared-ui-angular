import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "ko-demo-app",
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="p-6 text-lg font-semibold">shared-ui</h1>
    <router-outlet />
  `,
})
export class KoDemoApp {}
