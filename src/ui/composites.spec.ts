import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { KoDetailShell } from "@/ui/detail-shell.component";
import { KoSettingsSaveFooter } from "@/ui/settings-section.component";

@Component({
  selector: "ko-composites-host",
  imports: [KoSettingsSaveFooter, KoDetailShell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-settings-save-footer
      id="footer"
      dirty
      [discardable]="optIn()"
      (cancel)="cancelled.set(true)"
    />
    <ko-detail-shell
      id="shell"
      icon=""
      title="Item"
      activeTab="a"
      [tabs]="[
        { id: 'a', label: 'A', count: 0 },
        { id: 'b', label: 'B' },
      ]"
      [refreshable]="optIn()"
      (refresh)="refreshed.set(true)"
    />
  `,
})
class HostComponent {
  readonly optIn = signal(false);
  readonly cancelled = signal(false);
  readonly refreshed = signal(false);
}

describe("opt-in footer and shell actions", () => {
  const setup = async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const find = (selector: string, text: string) =>
      Array.from(root.querySelectorAll<HTMLButtonElement>(selector)).find(
        (node) => node.textContent?.trim() === text || node.getAttribute("aria-label") === text,
      );
    return { fixture, host: fixture.componentInstance, root, find };
  };

  it("hides Discard unless discardable, and emits cancel when shown", async () => {
    const { fixture, host, find } = await setup();
    expect(find("#footer button", "Discard")).toBeUndefined();
    host.optIn.set(true);
    await fixture.whenStable();
    find("#footer button", "Discard")!.click();
    expect(host.cancelled()).toBe(true);
  });

  it("hides Refresh unless refreshable, and emits refresh when shown", async () => {
    const { fixture, host, find } = await setup();
    expect(find("#shell button", "Refresh")).toBeUndefined();
    host.optIn.set(true);
    await fixture.whenStable();
    find("#shell button", "Refresh")!.click();
    expect(host.refreshed()).toBe(true);
  });

  it("renders a tab count of 0 but none when the count is absent", async () => {
    const { root } = await setup();
    const tabs = root.querySelectorAll('[role="tab"]');
    expect(tabs[0].textContent).toContain("0");
    expect(tabs[1].querySelector("span")).toBeNull();
  });
});
