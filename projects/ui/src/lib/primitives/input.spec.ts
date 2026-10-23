import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { KoInput } from "./input.directive";
import { KoTextarea } from "./textarea.directive";

@Component({
  selector: "ko-input-host",
  imports: [KoInput, KoTextarea, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input koInput [formControl]="input" />
    <textarea koTextarea [formControl]="area"></textarea>
  `,
})
class HostComponent {
  readonly input = new FormControl("", { nonNullable: true });
  readonly area = new FormControl("", { nonNullable: true });
}

describe("koInput and koTextarea", () => {
  let host: HostComponent;
  let input: HTMLInputElement;
  let area: HTMLTextAreaElement;
  let stable: () => Promise<void>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    host = fixture.componentInstance;
    input = fixture.nativeElement.querySelector("input");
    area = fixture.nativeElement.querySelector("textarea");
    stable = () => fixture.whenStable();
  });

  it("writes a control value into the element", () => {
    host.input.setValue("a");
    expect(input.value).toBe("a");
    host.area.setValue("z");
    expect(area.value).toBe("z");
  });

  it("reads typing back into the control", () => {
    input.value = "b";
    input.dispatchEvent(new Event("input"));
    expect(host.input.value).toBe("b");
    area.value = "y";
    area.dispatchEvent(new Event("input"));
    expect(host.area.value).toBe("y");
  });

  it("disables the element with the control", async () => {
    host.input.disable();
    host.area.disable();
    await stable();
    expect(input.hasAttribute("disabled")).toBe(true);
    expect(area.hasAttribute("disabled")).toBe(true);
  });

  it("applies the field classes", () => {
    expect(input.className).toContain("bg-inset");
    expect(area.className).toContain("min-h-24");
  });
});
