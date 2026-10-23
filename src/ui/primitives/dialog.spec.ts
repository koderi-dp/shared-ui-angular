/// <reference types="node" />
import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { readFileSync } from "node:fs";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import {
  KoDialog,
  KoDialogClose,
  KoDialogContent,
  KoDialogDescription,
  KoDialogFooter,
  KoDialogHeader,
  KoDialogTitle,
  KoDialogTrigger,
} from "@/ui/primitives/dialog.component";
import { KoDialogService } from "@/ui/primitives/dialog.service";
import {
  KoSheet,
  KoSheetContent,
  KoSheetDescription,
  KoSheetTitle,
  KoSheetTrigger,
} from "@/ui/primitives/sheet.component";

@Component({
  selector: "ko-dialog-host",
  imports: [
    KoDialog,
    KoDialogContent,
    KoDialogHeader,
    KoDialogTitle,
    KoDialogDescription,
    KoDialogFooter,
    KoDialogClose,
    KoDialogTrigger,
    KoSheet,
    KoSheetContent,
    KoSheetTitle,
    KoSheetDescription,
    KoSheetTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button id="open-dialog" [koDialogTrigger]="dialog">Open dialog</button>
    <ko-dialog #dialog [(open)]="dialogOpen">
      <ng-template koDialogContent>
        <ko-dialog-header>
          <ko-dialog-title>Delete item</ko-dialog-title>
          <ko-dialog-description>This cannot be undone.</ko-dialog-description>
        </ko-dialog-header>
        <input id="field" aria-label="Name" />
        <ko-dialog-footer>
          <button id="cancel" koDialogClose>Cancel</button>
        </ko-dialog-footer>
      </ng-template>
    </ko-dialog>

    <button id="open-sheet" [koSheetTrigger]="sheet">Open sheet</button>
    <ko-sheet #sheet [(open)]="sheetOpen" side="left">
      <ng-template koSheetContent>
        <ko-sheet-title>Navigation</ko-sheet-title>
        <ko-sheet-description>Where to go.</ko-sheet-description>
        <a id="link" href="/a">Link</a>
      </ng-template>
    </ko-sheet>
  `,
})
class HostComponent {
  readonly dialogOpen = signal(false);
  readonly sheetOpen = signal(false);
}

@Component({
  selector: "ko-service-content",
  imports: [KoDialogTitle, KoDialogClose],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-dialog-title>From the service</ko-dialog-title>
    <button id="service-close" koDialogClose>Close</button>
  `,
})
class ServiceContentComponent {}

describe("KoDialog and KoSheet", () => {
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
  const panel = () => el('[role="dialog"]');
  const press = (target: Element, key: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        keyCode: key === "Escape" ? 27 : 0,
        bubbles: true,
        ...init,
      }),
    );

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

  describe("dialog", () => {
    it("opens from the trigger and moves focus inside", async () => {
      expect(panel()).toBeNull();
      const trigger = el("#open-dialog")!;
      trigger.focus();
      trigger.click();
      await settle();
      expect(host.dialogOpen()).toBe(true);
      expect(panel()).not.toBeNull();
      expect(panel()!.contains(document.activeElement)).toBe(true);
    });

    it("has role dialog, labelled by the title and described by the description", async () => {
      host.dialogOpen.set(true);
      await settle();
      const title = el("ko-dialog-title")!;
      expect(title.id).toMatch(/^ko-dialog-title-\d+$/);
      expect(panel()!.getAttribute("aria-labelledby")).toBe(title.id);
      expect(panel()!.getAttribute("aria-describedby")).toBe(el("ko-dialog-description")!.id);
      expect(panel()!.getAttribute("aria-modal")).toBe("true");
    });

    it("keeps Tab inside the dialog", async () => {
      host.dialogOpen.set(true);
      await settle();
      const inside = Array.from(panel()!.querySelectorAll<HTMLElement>("input, button"));
      expect(inside.length).toBeGreaterThan(1);
      for (let i = 0; i < inside.length * 2 + 1; i++) {
        const active = document.activeElement as HTMLElement;
        const index = inside.indexOf(active);
        inside[(index + 1) % inside.length].focus();
        expect(panel()!.contains(document.activeElement)).toBe(true);
      }
      // The focus trap anchors catch focus that leaves the panel.
      const anchors = document.querySelectorAll<HTMLElement>(".cdk-focus-trap-anchor");
      expect(anchors.length).toBe(2);
    });

    it("closes on Escape, writes false back and returns focus to the trigger", async () => {
      const trigger = el("#open-dialog")!;
      trigger.focus();
      trigger.click();
      await settle();
      press(panel()!, "Escape");
      await settle();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });

    it("closes on a backdrop click", async () => {
      host.dialogOpen.set(true);
      await settle();
      el(".cdk-overlay-backdrop")!.click();
      await settle();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("closes from outside with open.set(false), and from koDialogClose", async () => {
      host.dialogOpen.set(true);
      await settle();
      expect(panel()).not.toBeNull();
      host.dialogOpen.set(false);
      await settle();
      expect(panel()).toBeNull();

      host.dialogOpen.set(true);
      await settle();
      el("#cancel")!.click();
      await settle();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("renders a labelled close button with the React classes", async () => {
      host.dialogOpen.set(true);
      await settle();
      const close = Array.from(panel()!.querySelectorAll("button")).find(
        (button) => button.textContent?.trim() === "Close",
      )!;
      expect(close.className).toContain("absolute right-3 top-3");
      expect(panel()!.closest(".cdk-overlay-pane")!.className).toContain("rounded-xl");
    });

    it("can reopen after closing", async () => {
      host.dialogOpen.set(true);
      await settle();
      press(panel()!, "Escape");
      await settle();
      host.dialogOpen.set(true);
      await settle();
      expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
    });
  });

  describe("overlay sizing", () => {
    it("sizes the dialog pane inline, since the CDK's unlayered max-width beats utilities", async () => {
      host.dialogOpen.set(true);
      await settle();
      const pane = panel()!.closest<HTMLElement>(".cdk-overlay-pane")!;
      expect(pane.style.maxWidth).toBe("32rem");
      expect(pane.style.width).toContain("calc(100% - 2rem)");
    });

    it("sizes the sheet pane inline", async () => {
      host.sheetOpen.set(true);
      await settle();
      const pane = panel()!.closest<HTMLElement>(".cdk-overlay-pane")!;
      expect(pane.style.width).toBe("18rem");
      expect(pane.style.height).toBe("100%");
    });

    it("sizes a service dialog inline", async () => {
      TestBed.inject(KoDialogService).open(ServiceContentComponent, { ariaLabel: "x" });
      await settle();
      expect(panel()!.closest<HTMLElement>(".cdk-overlay-pane")!.style.maxWidth).toBe("32rem");
    });

    it("no longer imports the CDK stylesheet; the CDK injects its own structural CSS", () => {
      expect(readFileSync("src/styles.css", "utf8")).not.toContain("overlay-prebuilt");
    });
  });

  describe("sheet", () => {
    it("traps focus, closes on Escape and returns focus to the trigger", async () => {
      const trigger = el("#open-sheet")!;
      trigger.focus();
      trigger.click();
      await settle();
      expect(host.sheetOpen()).toBe(true);
      expect(panel()!.contains(document.activeElement)).toBe(true);
      expect(document.querySelectorAll(".cdk-focus-trap-anchor").length).toBe(2);
      expect(panel()!.getAttribute("aria-labelledby")).toBe(el("ko-sheet-title")!.id);

      press(panel()!, "Escape");
      await settle();
      expect(panel()).toBeNull();
      expect(host.sheetOpen()).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });

    it("slides in from its side and closes on a backdrop click", async () => {
      host.sheetOpen.set(true);
      await settle();
      expect(panel()!.closest(".cdk-overlay-pane")!.className).toContain("slide-in-from-left");
      el(".cdk-overlay-backdrop")!.click();
      await settle();
      expect(panel()).toBeNull();
      expect(host.sheetOpen()).toBe(false);
    });
  });

  describe("service", () => {
    it("opens a component with a labelled panel and closes through koDialogClose", async () => {
      const ref = TestBed.inject(KoDialogService).open(ServiceContentComponent, {
        ariaLabel: "Service dialog",
      });
      let closed = false;
      ref.closed.subscribe(() => (closed = true));
      await settle();
      expect(panel()!.getAttribute("aria-label")).toBe("Service dialog");
      expect(panel()!.closest(".cdk-overlay-pane")!.className).toContain("bg-popover");
      expect(panel()!.getAttribute("aria-labelledby")).toBe(el("ko-dialog-title")!.id);
      el("#service-close")!.click();
      await settle();
      expect(closed).toBe(true);
      expect(panel()).toBeNull();
    });
  });
});
