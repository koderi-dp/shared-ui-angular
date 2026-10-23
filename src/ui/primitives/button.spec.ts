import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { lucideRefreshCw, lucideSave } from "@ng-icons/lucide";
import { KoButton, KoIconButton } from "@/ui/primitives/button.component";

/**
 * Type-check note: `<button koIconButton>` without `label` (or `icon`) does not compile, because
 * both are `input.required()`. There is nothing to assert at runtime, and a test that compiles
 * bad code would break the build, so that case is covered by the type checker alone.
 */
@Component({
  selector: "ko-button-host",
  imports: [KoButton, KoIconButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button id="saving" koButton [icon]="icon" [loading]="true">Save record</button>
    <button id="continue" koButton [loading]="true">Continue</button>
    <!-- eslint-disable-next-line @angular-eslint/template/elements-content -->
    <button id="refresh" koIconButton [icon]="refresh" label="Refresh connections"></button>
    <a id="assets" koButton href="/assets" [disabled]="true">Assets</a>
    <button id="plain" koButton class="h-12">Plain</button>
  `,
})
class HostComponent {
  protected readonly icon = lucideSave;
  protected readonly refresh = lucideRefreshCw;
}

describe("KoButton", () => {
  let root: HTMLElement;
  const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    root = fixture.nativeElement;
  });

  it("keeps the label and shows a spinner in place of the icon while loading", () => {
    const button = el("saving");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
    expect(button.innerHTML).toContain("animate-spin");
    expect(button.textContent).toContain("Save record");
    expect(button.textContent).not.toContain("Saving");
  });

  it("hides the label with opacity, not visibility, when loading without an icon", () => {
    const button = el("continue");
    expect(button.textContent).toContain("Continue");
    expect(button.querySelector(".opacity-0")?.textContent).toContain("Continue");
    expect(button.querySelector(".invisible")).toBeNull();
    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });

  it("names an icon button from its label", () => {
    const button = el("refresh");
    expect(button.getAttribute("aria-label")).toBe("Refresh connections");
    expect(button.getAttribute("title")).toBe("Refresh connections");
    expect(button.classList).toContain("size-8");
    expect(button.querySelectorAll("svg")).toHaveLength(1);
  });

  it("disables an anchor with aria-disabled and no tab stop", () => {
    const link = el("assets");
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.getAttribute("tabindex")).toBe("-1");
    expect(link.querySelector("button")).toBeNull();
  });

  it("merges a consumer class over the variant classes", () => {
    const button = el("plain");
    expect(button.classList).toContain("h-12");
    expect(button.classList).not.toContain("h-9");
  });
});
