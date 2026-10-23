import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import {
  KoDropdownItem,
  KoDropdownMenu,
  KoDropdownTrigger,
} from "@/ui/primitives/dropdown-menu.component";
import { KoPopover, KoPopoverContent, KoPopoverTrigger } from "@/ui/primitives/popover.component";
import { KoTabs, KoTabsContent, KoTabsList, KoTabsTrigger } from "@/ui/primitives/tabs.component";
import { KoTooltip } from "@/ui/primitives/tooltip.directive";

@Component({
  selector: "ko-overlays-host",
  imports: [
    KoDropdownTrigger,
    KoDropdownMenu,
    KoDropdownItem,
    KoPopover,
    KoPopoverTrigger,
    KoPopoverContent,
    KoTabs,
    KoTabsList,
    KoTabsTrigger,
    KoTabsContent,
    KoTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button id="menu-trigger" [koDropdownTrigger]="menu">Menu</button>
    <ng-template #menu>
      <ko-dropdown-menu>
        <button id="item-a" koDropdownItem (triggered)="picked.set('a')">A</button>
        <button id="item-b" koDropdownItem (triggered)="picked.set('b')">B</button>
        <button id="item-c" koDropdownItem variant="destructive" (triggered)="picked.set('c')">
          C
        </button>
      </ko-dropdown-menu>
    </ng-template>

    <ko-tabs [(value)]="tab">
      <ko-tabs-list>
        <button id="tab-one" koTabsTrigger value="one">One</button>
        <button id="tab-two" koTabsTrigger value="two">Two</button>
        <button id="tab-three" koTabsTrigger value="three">Three</button>
      </ko-tabs-list>
      <ko-tabs-content value="one">First</ko-tabs-content>
      <ko-tabs-content value="two">Second</ko-tabs-content>
      <ko-tabs-content value="three">Third</ko-tabs-content>
    </ko-tabs>

    <button id="tip" koTooltip="Helpful text" koTooltipSide="right">Hover</button>

    <button id="pop-trigger" [koPopoverTrigger]="pop">Popover</button>
    <ko-popover #pop [(open)]="popOpen">
      <ng-template koPopoverContent><p id="pop-body">Popover body</p></ng-template>
    </ko-popover>
    <p id="outside">Outside</p>
  `,
})
class HostComponent {
  readonly picked = signal("");
  readonly tab = signal("one");
  readonly popOpen = signal(false);
}

describe("overlay primitives", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const el = (selector: string) => document.querySelector<HTMLElement>(selector);
  const KEY_CODES: Record<string, number> = {
    Enter: 13,
    Escape: 27,
    ArrowLeft: 37,
    ArrowUp: 38,
    ArrowRight: 39,
    ArrowDown: 40,
  };
  const press = (target: Element, key: string) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        keyCode: KEY_CODES[key],
        bubbles: true,
        cancelable: true,
      }),
    );
  const items = () => [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')];

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll(".cdk-overlay-container").forEach((node) => node.replaceChildren());
  });

  describe("dropdown menu", () => {
    const open = async () => {
      const trigger = el("#menu-trigger")!;
      trigger.focus();
      press(trigger, "Enter");
      await settle();
    };

    it("opens on Enter with the first item focused", async () => {
      await open();
      expect(el('[role="menu"]')).not.toBeNull();
      expect(items()).toHaveLength(3);
      expect(document.activeElement).toBe(items()[0]);
    });

    it("moves focus with ArrowDown and ArrowUp, wrapping at both ends", async () => {
      await open();
      const menu = el('[role="menu"]')!;
      press(menu, "ArrowDown");
      expect(document.activeElement).toBe(items()[1]);
      press(menu, "ArrowDown");
      press(menu, "ArrowDown");
      expect(document.activeElement).toBe(items()[0]);
      press(menu, "ArrowUp");
      expect(document.activeElement).toBe(items()[2]);
    });

    it("closes on Escape and refocuses the trigger", async () => {
      await open();
      press(el('[role="menu"]')!, "Escape");
      await settle();
      expect(el('[role="menu"]')).toBeNull();
      expect(document.activeElement).toBe(el("#menu-trigger"));
    });

    it("emits and closes when an item is activated", async () => {
      await open();
      items()[1].click();
      await settle();
      expect(host.picked()).toBe("b");
      expect(el('[role="menu"]')).toBeNull();
    });
  });

  describe("tabs", () => {
    it("wires aria-selected, aria-controls and the panel label", () => {
      const one = el("button[value=one]")!;
      const two = el("button[value=two]")!;
      expect(one.getAttribute("role")).toBe("tab");
      expect(one.getAttribute("aria-selected")).toBe("true");
      expect(two.getAttribute("aria-selected")).toBe("false");
      expect(one.tabIndex).toBe(0);
      expect(two.tabIndex).toBe(-1);
      const panel = document.getElementById(one.getAttribute("aria-controls")!)!;
      expect(panel.getAttribute("role")).toBe("tabpanel");
      expect(panel.getAttribute("aria-labelledby")).toBe(one.id);
      expect(panel.hidden).toBe(false);
      const other = document.getElementById(two.getAttribute("aria-controls")!)!;
      expect(other.hidden).toBe(true);
    });

    it("ArrowRight moves to and activates the next tab, wrapping", async () => {
      el("button[value=one]")!.focus();
      press(el("button[value=one]")!, "ArrowRight");
      await settle();
      expect(host.tab()).toBe("two");
      expect(document.activeElement).toBe(el("button[value=two]"));
      expect(el("button[value=two]")!.getAttribute("aria-selected")).toBe("true");
      press(el("button[value=two]")!, "ArrowRight");
      await settle();
      press(el("button[value=three]")!, "ArrowRight");
      await settle();
      expect(host.tab()).toBe("one");
      press(el("button[value=one]")!, "ArrowLeft");
      await settle();
      expect(host.tab()).toBe("three");
    });

    it("activates a tab on click", async () => {
      el("button[value=two]")!.click();
      await settle();
      expect(host.tab()).toBe("two");
    });
  });

  describe("tooltip", () => {
    it("shows on focus with aria-describedby and hides on blur", async () => {
      const trigger = el("#tip")!;
      trigger.focus();
      await settle();
      const tip = el('[role="tooltip"]')!;
      expect(tip).not.toBeNull();
      expect(tip.textContent).toContain("Helpful text");
      expect(trigger.getAttribute("aria-describedby")).toBe(tip.id);
      trigger.blur();
      await settle();
      expect(el('[role="tooltip"]')).toBeNull();
    });

    it("shows on hover after the delay and hides on mouseleave", async () => {
      const trigger = el("#tip")!;
      trigger.dispatchEvent(new MouseEvent("mouseenter"));
      await settle();
      expect(el('[role="tooltip"]')).toBeNull();
      await new Promise((resolve) => setTimeout(resolve, 350));
      await settle();
      expect(el('[role="tooltip"]')).not.toBeNull();
      trigger.dispatchEvent(new MouseEvent("mouseleave"));
      await settle();
      expect(el('[role="tooltip"]')).toBeNull();
    });

    it("hides on Escape", async () => {
      el("#tip")!.focus();
      await settle();
      press(el("#tip")!, "Escape");
      await settle();
      expect(el('[role="tooltip"]')).toBeNull();
    });
  });

  describe("popover", () => {
    it("opens from the trigger and closes on an outside click", async () => {
      el("#pop-trigger")!.click();
      await settle();
      expect(host.popOpen()).toBe(true);
      expect(el("#pop-body")).not.toBeNull();
      el("#outside")!.click();
      await settle();
      expect(host.popOpen()).toBe(false);
      expect(el("#pop-body")).toBeNull();
    });

    it("closes on Escape and refocuses the trigger", async () => {
      el("#pop-trigger")!.click();
      await settle();
      press(document.body, "Escape");
      await settle();
      expect(host.popOpen()).toBe(false);
      expect(document.activeElement).toBe(el("#pop-trigger"));
    });
  });
});
