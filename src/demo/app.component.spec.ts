import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { KoDemoApp } from "@/demo/app.component";
import { routes } from "@/demo/routes";

describe("KoDemoApp", () => {
  beforeEach(() => {
    // jsdom has no matchMedia, which the toaster reads for its theme.
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    // Nor ResizeObserver, which the chart directive needs.
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = () => undefined;
        unobserve = () => undefined;
        disconnect = () => undefined;
      },
    );
  });

  it("draws the overview page inside the app shell", async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    });
    const fixture = TestBed.createComponent(KoDemoApp);
    await TestBed.inject(Router).navigateByUrl("/");
    await fixture.whenStable();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.querySelector("ko-app-shell")).not.toBeNull();
    expect(root.textContent).toContain("Shared UI");
    expect(root.querySelector("main h1")?.textContent).toContain("Overview");
  });

  it("shows Not Found for an unknown path", async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter(routes)],
    });
    const fixture = TestBed.createComponent(KoDemoApp);
    await TestBed.inject(Router).navigateByUrl("/nope");
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain("Not Found");
  });
});
