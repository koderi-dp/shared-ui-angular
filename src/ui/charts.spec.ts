import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { KoStateTimeline } from "@/ui/state-timeline.component";
import { KoTimeChart } from "@/ui/time-chart.component";

@Component({
  selector: "ko-charts-host",
  imports: [KoStateTimeline, KoTimeChart],
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
  `,
})
class HostComponent {
  readonly fmt = (value: number) => String(value);
}

describe("chart hosts", () => {
  it("keeps the title off the chart and timeline hosts", async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("#timeline")!.hasAttribute("title")).toBe(false);
    expect(root.querySelector("#chart")!.hasAttribute("title")).toBe(false);
  });
});
