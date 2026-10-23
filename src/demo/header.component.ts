import { ChangeDetectionStrategy, Component, inject, input } from "@angular/core";
import { Router } from "@angular/router";
import { NgIcon } from "@ng-icons/core";
import { lucideCircleUser, lucideLogOut, lucideSettings, lucideUser } from "@ng-icons/lucide";
import { headerChipClass } from "@/ui/layout/nav";
import {
  notify,
  KoDropdownItem,
  KoDropdownLabel,
  KoDropdownMenu,
  KoDropdownSeparator,
  KoDropdownTrigger,
  KoStatusDot,
  cn,
} from "@koderi-dp/ui";

/** The chip the shell takes as `koHeaderEnd`: a dot, a word, and never more than that. */
@Component({
  selector: "ko-header-status",
  imports: [KoStatusDot],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { "[class]": "classes" },
  template: `
    <ko-status-dot [state]="state()" />
    <span class="hidden sm:inline">{{ label() }}</span>
  `,
})
export class KoHeaderStatus {
  readonly state = input("running");
  readonly label = input("All services up");
  protected readonly classes = cn(headerChipClass, "cursor-default");
}

/** The account menu, in the header and (when the sidebar is collapsed) in its footer. */
@Component({
  selector: "ko-user-menu",
  imports: [
    NgIcon,
    KoDropdownTrigger,
    KoDropdownMenu,
    KoDropdownItem,
    KoDropdownLabel,
    KoDropdownSeparator,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "contents" },
  template: `
    <button
      type="button"
      aria-label="Account"
      class="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      [koDropdownTrigger]="menu"
    >
      <ng-icon aria-hidden="true" size="1rem" [svg]="icons.account" />
    </button>
    <ng-template #menu>
      <ko-dropdown-menu class="w-52">
        <ko-dropdown-label>ada@example.com</ko-dropdown-label>
        <ko-dropdown-separator />
        <button koDropdownItem (triggered)="profile()">
          <ng-icon aria-hidden="true" size="1rem" [svg]="icons.user" />
          Profile
        </button>
        <button koDropdownItem (triggered)="settings()">
          <ng-icon aria-hidden="true" size="1rem" [svg]="icons.settings" />
          Settings
        </button>
        <ko-dropdown-separator />
        <button koDropdownItem (triggered)="signOut()">
          <ng-icon aria-hidden="true" size="1rem" [svg]="icons.logOut" />
          Sign out
        </button>
      </ko-dropdown-menu>
    </ng-template>
  `,
})
export class KoUserMenu {
  private readonly router = inject(Router);
  protected readonly icons = {
    account: lucideCircleUser,
    user: lucideUser,
    settings: lucideSettings,
    logOut: lucideLogOut,
  };

  protected profile(): void {
    notify.success("Profile opened");
  }

  protected settings(): void {
    void this.router.navigateByUrl("/settings");
  }

  protected signOut(): void {
    notify.success("Signed out");
  }
}

/** The sidebar footer: the account, or only its menu when the sidebar is collapsed. */
@Component({
  selector: "ko-account-footer",
  imports: [NgIcon, KoUserMenu],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: "block" },
  template: `
    @if (collapsed()) {
      <ko-user-menu />
    } @else {
      <div class="flex items-center gap-2.5">
        <span
          class="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground"
        >
          <ng-icon aria-hidden="true" size="1rem" [svg]="account" />
        </span>
        <span class="grid min-w-0 leading-tight">
          <span class="truncate text-xs font-medium">Ada Lovelace</span>
          <span class="truncate text-[11px] text-muted-foreground">ada@example.com</span>
        </span>
      </div>
    }
  `,
})
export class KoAccountFooter {
  readonly collapsed = input(false);
  protected readonly account = lucideCircleUser;
}
