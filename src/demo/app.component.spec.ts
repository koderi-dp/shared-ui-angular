import { provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { KoDemoApp } from "./app.component";

describe("KoDemoApp", () => {
  it("renders the heading", async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(KoDemoApp);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector("h1")?.textContent).toContain("shared-ui");
  });
});
