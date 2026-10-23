import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter, Router, RouterOutlet } from "@angular/router";
import { lucideBoxes, lucideHouse, lucideSettings, lucideTable2 } from "@ng-icons/lucide";
import { KoAppShell, KoSidebarFooter, type Brand } from "./app-shell.component";
import { KoCommandPalette } from "./command-palette.component";
import { injectCommands, KoCommandRegistry, type Command } from "./command-registry";
import type { NavConfig } from "./nav";

const nav: NavConfig = {
  primary: [
    { to: "/", label: "Overview", icon: lucideHouse, keywords: ["home"] },
    { to: "/grid", label: "Data grid", icon: lucideTable2 },
  ],
  secondary: [
    { to: "/settings", label: "Settings", icon: lucideSettings, keywords: ["preferences"] },
  ],
};
const brand: Brand = { name: "Shared UI", tagline: "Showcase", icon: lucideBoxes };

@Component({
  selector: "ko-blank-page",
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p id="page">Page</p>`,
})
class BlankPage {}

const routes = [
  { path: "", component: BlankPage },
  { path: "grid", component: BlankPage },
  { path: "settings", component: BlankPage },
];

const el = (selector: string) => document.querySelector<HTMLElement>(selector);
const all = (selector: string) => Array.from(document.querySelectorAll<HTMLElement>(selector));
const press = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      keyCode: key === "Escape" ? 27 : 0,
      bubbles: true,
      cancelable: true,
      ...init,
    }),
  );
const type = (input: HTMLInputElement, value: string) => {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
};
const optionLabels = () =>
  all('[role="option"]').map((option) => option.querySelector("span")!.textContent!.trim());

async function settle(fixture: ComponentFixture<unknown>) {
  for (let i = 0; i < 2; i++) {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  fixture.detectChanges();
}

/** Waits out the exit animation's timeout fallback (jsdom fires no `animationend`). */
async function exited(fixture: ComponentFixture<unknown>) {
  await new Promise((resolve) => setTimeout(resolve, 400));
  await settle(fixture);
}

function clearOverlays() {
  document.querySelectorAll(".cdk-overlay-container").forEach((node) => node.replaceChildren());
}

describe("KoCommandPalette", () => {
  @Component({
    selector: "ko-palette-host",
    imports: [KoCommandPalette],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `<ko-command-palette [(open)]="open" [nav]="nav" [commands]="commands" />`,
  })
  class PaletteHost {
    readonly open = signal(false);
    readonly nav = nav;
    readonly ran = signal<string[]>([]);
    readonly commands: Command[] = [
      {
        id: "new",
        label: "New item",
        group: "Actions",
        run: () => this.ran.update((list) => [...list, "new"]),
      },
      {
        id: "reset",
        label: "Reset settings",
        group: "Actions",
        run: () => this.ran.update((list) => [...list, "reset"]),
      },
      {
        id: "theme",
        label: "Toggle theme",
        group: "Appearance",
        keywords: ["settings", "dark"],
        run: () => this.ran.update((list) => [...list, "theme"]),
      },
    ];
  }

  let fixture: ComponentFixture<PaletteHost>;
  let host: PaletteHost;
  const input = () => el('input[role="combobox"]') as HTMLInputElement;
  const headings = () =>
    all('[role="group"]').map((group) =>
      document.getElementById(group.getAttribute("aria-labelledby")!)!.textContent!.trim(),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    });
    fixture = TestBed.createComponent(PaletteHost);
    host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    host.open.set(true);
    await settle(fixture);
  });

  afterEach(() => {
    fixture.destroy();
    clearOverlays();
  });

  it("lists commands by group, then the pages, in a labelled combobox and listbox", () => {
    expect(optionLabels()).toEqual([
      "New item",
      "Reset settings",
      "Toggle theme",
      "Overview",
      "Data grid",
      "Settings",
    ]);
    expect(headings()).toEqual(["Actions", "Appearance", "Pages"]);
    const listbox = el('[role="listbox"]')!;
    expect(input().getAttribute("aria-controls")).toBe(listbox.id);
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(input().getAttribute("aria-activedescendant")).toBe(all('[role="option"]')[0].id);
    expect(input().placeholder).toBe("Search…");
    expect(el('[role="dialog"]')!.getAttribute("aria-labelledby")).toBeTruthy();
  });

  it("filters on 'sett' and runs the second match on ArrowDown then Enter", async () => {
    type(input(), "sett");
    await settle(fixture);
    expect(optionLabels()).toEqual(["Reset settings", "Toggle theme", "Settings"]);
    expect(headings()).toEqual(["Actions", "Appearance", "Navigate"]);

    press(input(), "ArrowDown");
    await settle(fixture);
    const options = all('[role="option"]');
    expect(options[1].getAttribute("aria-selected")).toBe("true");
    expect(input().getAttribute("aria-activedescendant")).toBe(options[1].id);

    press(input(), "Enter");
    await settle(fixture);
    expect(host.ran()).toEqual(["theme"]);
    await exited(fixture);
    expect(host.open()).toBe(false);
    expect(el('[role="dialog"]')).toBeNull();
  });

  it("navigates for a page, and wraps around from the first option with ArrowUp", async () => {
    const router = TestBed.inject(Router);
    type(input(), "sett");
    await settle(fixture);
    press(input(), "ArrowUp");
    await settle(fixture);
    press(input(), "Enter");
    await settle(fixture);
    expect(router.url).toBe("/settings");
    expect(host.ran()).toEqual([]);
    await exited(fixture);
    expect(host.open()).toBe(false);
  });

  it("shows the empty message when nothing matches", async () => {
    type(input(), "zzz");
    await settle(fixture);
    expect(all('[role="option"]')).toEqual([]);
    expect(el('[role="listbox"]')!.textContent).toContain("Nothing matches.");
    expect(input().hasAttribute("aria-activedescendant")).toBe(false);
  });

  it("closes on Escape and clears the query", async () => {
    type(input(), "sett");
    await settle(fixture);
    press(input(), "Escape");
    await settle(fixture);
    await exited(fixture);
    expect(host.open()).toBe(false);
    expect(el('[role="dialog"]')).toBeNull();
    host.open.set(true);
    await settle(fixture);
    expect(input().value).toBe("");
    expect(all('[role="option"]').length).toBe(6);
  });

  it("runs an option on click", async () => {
    all('[role="option"]')[0].click();
    await settle(fixture);
    expect(host.ran()).toEqual(["new"]);
    await exited(fixture);
    expect(host.open()).toBe(false);
  });
});

describe("KoCommandRegistry and injectCommands", () => {
  @Component({
    selector: "ko-commands-owner",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: ``,
  })
  class CommandsOwner {
    constructor() {
      injectCommands([{ id: "a", label: "A", group: "G", run: () => undefined }]);
    }
  }

  @Component({
    selector: "ko-signal-commands-owner",
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: ``,
  })
  class SignalCommandsOwner {
    readonly list = signal<Command[]>([{ id: "b", label: "B", group: "G", run: () => undefined }]);
    constructor() {
      injectCommands(this.list);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it("adds a component's commands while it lives, and removes them when destroyed", () => {
    const registry = TestBed.inject(KoCommandRegistry);
    expect(registry.commands()).toEqual([]);
    const owner = TestBed.createComponent(CommandsOwner);
    expect(registry.commands().map((command) => command.id)).toEqual(["a"]);
    owner.destroy();
    expect(registry.commands()).toEqual([]);
  });

  it("follows a signal of commands", async () => {
    const registry = TestBed.inject(KoCommandRegistry);
    const owner = TestBed.createComponent(SignalCommandsOwner);
    await owner.whenStable();
    expect(registry.commands().map((command) => command.id)).toEqual(["b"]);
    owner.componentInstance.list.set([
      { id: "c", label: "C", group: "G", run: () => undefined },
      { id: "d", label: "D", group: "G", run: () => undefined },
    ]);
    await owner.whenStable();
    expect(registry.commands().map((command) => command.id)).toEqual(["c", "d"]);
    owner.destroy();
    expect(registry.commands()).toEqual([]);
  });

  it("register replaces an owner's commands, unregister removes them", () => {
    const registry = TestBed.inject(KoCommandRegistry);
    const run = () => undefined;
    registry.register("x", [{ id: "1", label: "1", group: "G", run }]);
    registry.register("y", [{ id: "2", label: "2", group: "G", run }]);
    registry.register("x", [{ id: "3", label: "3", group: "G", run }]);
    expect(registry.commands().map((command) => command.id)).toEqual(["3", "2"]);
    registry.unregister("x");
    expect(registry.commands().map((command) => command.id)).toEqual(["2"]);
  });
});

describe("KoAppShell", () => {
  @Component({
    selector: "ko-shell-host",
    imports: [KoAppShell, KoSidebarFooter, RouterOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
      <ko-app-shell [nav]="nav" [brand]="brand" storageKey="shell-spec" [fullHeight]="fullHeight">
        <button koHeaderEnd id="header-end" type="button">Account</button>
        <ng-template koSidebarFooter let-collapsed>
          <span id="footer">{{ collapsed ? "short" : "long" }}</span>
        </ng-template>
        <router-outlet />
      </ko-app-shell>
    `,
  })
  class ShellHost {
    readonly nav = nav;
    readonly brand = brand;
    readonly fullHeight = (path: string) => path.startsWith("/grid");
  }

  let fixture: ComponentFixture<ShellHost>;

  async function create() {
    fixture = TestBed.createComponent(ShellHost);
    document.body.appendChild(fixture.nativeElement);
    await settle(fixture);
  }

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    });
    await TestBed.inject(Router).navigateByUrl("/settings");
    await create();
  });

  afterEach(() => {
    fixture.destroy();
    clearOverlays();
    localStorage.clear();
  });

  const desktopLinks = () => all("aside nav a");
  const toggle = () =>
    all("header button").find((button) =>
      /(Collapse|Expand) navigation/.test(button.getAttribute("aria-label") ?? ""),
    )!;

  it("projects the page, the header end and the sidebar footer", () => {
    expect(el("main #page")).not.toBeNull();
    expect(el("header #header-end")).not.toBeNull();
    expect(el("aside #footer")!.textContent).toBe("long");
    expect(el("aside")!.textContent).toContain("Shared UI");
    expect(el("aside")!.textContent).toContain("Showcase");
  });

  it("marks the nav item of the current route with aria-current", async () => {
    const current = () =>
      desktopLinks()
        .filter((link) => link.getAttribute("aria-current") === "page")
        .map((link) => link.getAttribute("href"));
    expect(current()).toEqual(["/settings"]);
    await TestBed.inject(Router).navigateByUrl("/grid?sort=name");
    await settle(fixture);
    expect(current()).toEqual(["/grid"]);
  });

  it("makes main the scroll container, or a fixed-height column for fullHeight pages", async () => {
    expect(el("main")!.className).toContain("overflow-y-auto");
    await TestBed.inject(Router).navigateByUrl("/grid");
    await settle(fixture);
    expect(el("main")!.className).toContain("overflow-hidden");
    expect(el("main")!.className).not.toContain("overflow-y-auto");
  });

  it("opens the palette with Ctrl+K, and closes it with Ctrl+K again", async () => {
    expect(el('[role="dialog"]')).toBeNull();
    press(document.body, "k", { ctrlKey: true });
    await settle(fixture);
    expect(el('input[role="combobox"]')).not.toBeNull();
    press(document.body, "k", { ctrlKey: true });
    await exited(fixture);
    expect(el('input[role="combobox"]')).toBeNull();
  });

  it("ignores Ctrl+K while an IME is composing", async () => {
    press(document.body, "k", { ctrlKey: true, isComposing: true });
    await settle(fixture);
    expect(el('[role="dialog"]')).toBeNull();
  });

  it("lists commands registered with injectCommands in the palette", async () => {
    TestBed.inject(KoCommandRegistry).register("spec", [
      { id: "x", label: "Sign out", group: "Account", run: () => undefined },
    ]);
    press(document.body, "k", { ctrlKey: true });
    await settle(fixture);
    expect(optionLabels()).toContain("Sign out");
    TestBed.inject(KoCommandRegistry).unregister("spec");
  });

  it("collapses the sidebar, with tooltips and labels on the links, and persists it", async () => {
    expect(toggle().getAttribute("aria-label")).toBe("Collapse navigation");
    toggle().click();
    await settle(fixture);
    expect(toggle().getAttribute("aria-label")).toBe("Expand navigation");
    expect(el("aside")!.className).toContain("w-16");
    expect(el("aside #footer")!.textContent).toBe("short");
    expect(desktopLinks()[0].getAttribute("aria-label")).toBe("Overview");
    expect(localStorage.getItem("shell-spec:collapsed")).toBe("true");

    fixture.destroy();
    await create();
    expect(toggle().getAttribute("aria-label")).toBe("Expand navigation");
    expect(el("aside")!.className).toContain("w-16");
  });

  it("opens the mobile nav in a sheet and closes it on navigation", async () => {
    const open = all("header button").find(
      (button) => button.getAttribute("aria-label") === "Open navigation",
    )!;
    open.click();
    await settle(fixture);
    const sheet = el('[role="dialog"]')!;
    expect(sheet.textContent).toContain("Navigation");
    const link = Array.from(sheet.querySelectorAll<HTMLElement>("nav a")).find(
      (a) => a.getAttribute("href") === "/grid",
    )!;
    link.click();
    await settle(fixture);
    await exited(fixture);
    expect(el('[role="dialog"]')).toBeNull();
    expect(TestBed.inject(Router).url).toBe("/grid");
  });
});
