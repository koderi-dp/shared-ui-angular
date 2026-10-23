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
    <ko-dialog #dialog [(open)]="dialogOpen" [disableClose]="locked()">
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
    <ko-sheet #sheet [(open)]="sheetOpen" side="left" [width]="sheetWidth()">
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
  readonly locked = signal(false);
  readonly sheetWidth = signal("18rem");
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
  const exited = async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await settle();
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
      await exited();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
      expect(document.activeElement).toBe(trigger);
    });

    it("closes on a backdrop click", async () => {
      host.dialogOpen.set(true);
      await settle();
      el(".cdk-overlay-backdrop")!.click();
      await settle();
      await exited();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("ignores Escape and a backdrop click while disableClose, but koDialogClose still closes", async () => {
      host.locked.set(true);
      host.dialogOpen.set(true);
      await settle();
      press(panel()!, "Escape");
      el(".cdk-overlay-backdrop")!.click();
      await settle();
      expect(panel()).not.toBeNull();
      expect(host.dialogOpen()).toBe(true);
      el("#cancel")!.click();
      await settle();
      await exited();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("honours disableClose changing while the dialog is open", async () => {
      host.dialogOpen.set(true);
      await settle();
      host.locked.set(true);
      await settle();
      press(panel()!, "Escape");
      await settle();
      expect(panel()).not.toBeNull();
      host.locked.set(false);
      await settle();
      press(panel()!, "Escape");
      await settle();
      await exited();
      expect(panel()).toBeNull();
    });

    it("lets a service dialog refuse to close, while ref.close() still works", async () => {
      const ref = TestBed.inject(KoDialogService).open(ServiceContentComponent, {
        ariaLabel: "x",
        disableClose: true,
      });
      await settle();
      press(panel()!, "Escape");
      el(".cdk-overlay-backdrop")!.click();
      await settle();
      expect(panel()).not.toBeNull();
      ref.close();
      await settle();
      await exited();
      expect(panel()).toBeNull();
    });

    it("closes from outside with open.set(false), and from koDialogClose", async () => {
      host.dialogOpen.set(true);
      await settle();
      expect(panel()).not.toBeNull();
      host.dialogOpen.set(false);
      await settle();
      await exited();
      expect(panel()).toBeNull();

      host.dialogOpen.set(true);
      await settle();
      el("#cancel")!.click();
      await settle();
      await exited();
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
      await exited();
      expect(host.dialogOpen()).toBe(false);
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

    it("takes the sheet width from the width input", async () => {
      host.sheetWidth.set("20rem");
      host.sheetOpen.set(true);
      await settle();
      expect(panel()!.closest<HTMLElement>(".cdk-overlay-pane")!.style.width).toBe("20rem");
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
      await exited();
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
      await exited();
      expect(panel()).toBeNull();
      expect(host.sheetOpen()).toBe(false);
    });
  });

  describe("exit animation", () => {
    // jsdom fires no animationend, so these run through the timeout fallback (duration + margin).
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const pane = () => el(".cdk-overlay-pane")!;

    it("keeps the dialog attached with exit classes until the fallback elapses", async () => {
      host.dialogOpen.set(true);
      await settle();
      press(panel()!, "Escape");
      await settle();
      expect(pane().className).toContain("animate-out");
      expect(pane().className).toContain("fade-out-0");
      expect(pane().className).toContain("zoom-out-95");
      expect(pane().className).not.toContain("animate-in");
      expect(el(".cdk-overlay-backdrop")!.className).toContain("animate-out");
      expect(host.dialogOpen()).toBe(true);
      await sleep(100);
      expect(panel()).not.toBeNull();
      expect(host.dialogOpen()).toBe(true);
      await exited();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("closes early on animationend from the panel, not from a child", async () => {
      host.dialogOpen.set(true);
      await settle();
      press(panel()!, "Escape");
      el("#field")!.dispatchEvent(new Event("animationend", { bubbles: true }));
      expect(panel()).not.toBeNull();
      pane().dispatchEvent(new Event("animationend"));
      await settle();
      expect(panel()).toBeNull();
      expect(host.dialogOpen()).toBe(false);
    });

    it("animates every close path, including koDialogClose and open.set(false)", async () => {
      host.dialogOpen.set(true);
      await settle();
      el("#cancel")!.click();
      await settle();
      expect(pane().className).toContain("animate-out");
      expect(host.dialogOpen()).toBe(true);
      await exited();
      expect(panel()).toBeNull();

      host.dialogOpen.set(true);
      await settle();
      host.dialogOpen.set(false);
      await settle();
      expect(panel()).not.toBeNull();
      expect(pane().className).toContain("animate-out");
      await exited();
      expect(panel()).toBeNull();
    });

    it("slides a sheet out towards its side", async () => {
      host.sheetOpen.set(true);
      await settle();
      press(panel()!, "Escape");
      await settle();
      expect(pane().className).toContain("slide-out-to-left");
      expect(panel()).not.toBeNull();
      await exited();
      expect(panel()).toBeNull();
      expect(host.sheetOpen()).toBe(false);
    });

    it("keeps the close result on the service path and emits closed after the wait", async () => {
      const ref = TestBed.inject(KoDialogService).open<ServiceContentComponent, unknown, string>(
        ServiceContentComponent,
        { ariaLabel: "x" },
      );
      const results: (string | undefined)[] = [];
      ref.closed.subscribe((result) => results.push(result));
      await settle();
      ref.close("saved");
      await settle();
      expect(pane().className).toContain("animate-out");
      expect(results).toEqual([]);
      await sleep(100);
      expect(panel()).not.toBeNull();
      await exited();
      expect(results).toEqual(["saved"]);
      expect(panel()).toBeNull();
    });

    it("ignores a second close during the wait", async () => {
      const ref = TestBed.inject(KoDialogService).open<ServiceContentComponent, unknown, string>(
        ServiceContentComponent,
        { ariaLabel: "x" },
      );
      const results: (string | undefined)[] = [];
      ref.closed.subscribe((result) => results.push(result));
      await settle();
      ref.close("first");
      expect(() => ref.close("second")).not.toThrow();
      press(panel()!, "Escape");
      el(".cdk-overlay-backdrop")!.click();
      await exited();
      expect(results).toEqual(["first"]);
      expect(panel()).toBeNull();
    });

    it("cancels the pending close when reopened during the wait", async () => {
      host.dialogOpen.set(true);
      await settle();
      host.dialogOpen.set(false);
      await settle();
      expect(pane().className).toContain("animate-out");
      host.dialogOpen.set(true);
      await settle();
      expect(pane().className).not.toContain("animate-out");
      expect(pane().className).toContain("animate-in");
      await exited();
      expect(document.querySelectorAll('[role="dialog"]').length).toBe(1);
      expect(host.dialogOpen()).toBe(true);
    });

    it("skips the wait when the user prefers reduced motion", async () => {
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
      })) as typeof window.matchMedia;
      try {
        host.dialogOpen.set(true);
        await settle();
        press(panel()!, "Escape");
        await settle();
        expect(panel()).toBeNull();
        expect(host.dialogOpen()).toBe(false);
      } finally {
        window.matchMedia = original;
      }
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
      await exited();
      expect(closed).toBe(true);
      expect(panel()).toBeNull();
    });
  });
});
