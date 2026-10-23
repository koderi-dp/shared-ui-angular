import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { KoDetailShell } from "@/ui/detail-shell.component";
import { KoSelectionToolbar } from "@/ui/list-filter-bar.component";
import { KoSettingsSaveFooter } from "@/ui/settings-section.component";
import { KoStateTimeline } from "@/ui/state-timeline.component";
import { KoTimeChart } from "@/ui/time-chart.component";

@Component({
  selector: "ko-composites-host",
  imports: [KoSettingsSaveFooter, KoDetailShell, KoStateTimeline, KoTimeChart, KoSelectionToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-state-timeline
      id="timeline"
      title="Encoder"
      [rows]="[]"
      [from]="0"
      [to]="1000"
      [stepMs]="100"
    />
    <ko-time-chart
      id="chart"
      title="Bitrate"
      icon=""
      [rows]="[]"
      [series]="[]"
      [from]="0"
      [to]="1000"
      [format]="fmt"
      fill
    />
    <ko-selection-toolbar id="toolbar" [count]="1" class="extra-class" />
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
  readonly fmt = (value: number) => String(value);
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

  it("keeps the title off the chart and timeline hosts, and merges a toolbar class", async () => {
    const { root } = await setup();
    expect(root.querySelector("#timeline")!.hasAttribute("title")).toBe(false);
    expect(root.querySelector("#chart")!.hasAttribute("title")).toBe(false);
    expect(root.querySelector("#toolbar")!.classList.contains("extra-class")).toBe(true);
  });

  it("renders a tab count of 0 but none when the count is absent", async () => {
    const { root } = await setup();
    const tabs = root.querySelectorAll('[role="tab"]');
    expect(tabs[0].textContent).toContain("0");
    expect(tabs[1].querySelector("span")).toBeNull();
  });
});
