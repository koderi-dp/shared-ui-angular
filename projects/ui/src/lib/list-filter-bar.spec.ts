import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { KoSelectionToolbar } from "./list-filter-bar.component";

@Component({
  selector: "ko-toolbar-host",
  imports: [KoSelectionToolbar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ko-selection-toolbar id="toolbar" [count]="1" class="extra-class" />`,
})
class HostComponent {}

describe("selection toolbar", () => {
  it("merges a class onto the toolbar host", async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector("#toolbar")!.classList.contains("extra-class")).toBe(true);
  });
});
