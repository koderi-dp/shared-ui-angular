import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { KoDemoApp } from "@/demo/app.component";

describe("KoDemoApp", () => {
  beforeEach(() => {
    // jsdom has no matchMedia, which the toaster reads for its theme.
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
  });

  it("renders the heading", async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(KoDemoApp);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("h1")?.textContent).toContain("shared-ui");
  });
});
