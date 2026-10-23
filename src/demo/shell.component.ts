import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { KoAccountFooter, KoHeaderStatus, KoUserMenu } from "@/demo/header.component";
import { demoBrand, demoFullHeight, demoNav } from "@/demo/nav";
import { KoAppShell, KoSidebarFooter } from "@/ui/layout/app-shell.component";

/** The layout route: everything under it is drawn inside the app shell. */
@Component({
  selector: "ko-demo-shell",
  imports: [RouterOutlet, KoAppShell, KoSidebarFooter, KoHeaderStatus, KoUserMenu, KoAccountFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <ko-app-shell [nav]="nav" [brand]="brand" [fullHeight]="fullHeight">
      <div koHeaderEnd class="flex items-center gap-1">
        <ko-header-status />
        <ko-user-menu />
      </div>
      <ng-template koSidebarFooter let-collapsed>
        <ko-account-footer [collapsed]="collapsed" />
      </ng-template>
      <router-outlet />
    </ko-app-shell>
  `,
})
export class KoDemoShell {
  protected readonly nav = demoNav;
  protected readonly brand = demoBrand;
  protected readonly fullHeight = demoFullHeight;
}
