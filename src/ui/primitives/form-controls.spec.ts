import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { KoCheckbox } from "@/ui/primitives/checkbox.component";
import { KoSelect } from "@/ui/primitives/select.component";
import { KoSwitch } from "@/ui/primitives/switch.component";

@Component({
  selector: "ko-form-controls-host",
  imports: [ReactiveFormsModule, KoCheckbox, KoSwitch, KoSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-checkbox id="check" ariaLabel="Select row" [formControl]="check" />
    <ko-checkbox id="mixed" ariaLabel="Select all" checked="indeterminate" />
    <ko-switch id="switch" ariaLabel="Enabled" [formControl]="toggle" />
    <ko-select id="select" placeholder="Pick a region" [options]="options" [formControl]="region" />
  `,
})
class HostComponent {
  readonly check = new FormControl<boolean | "indeterminate">(false, { nonNullable: true });
  readonly toggle = new FormControl(false, { nonNullable: true });
  readonly region = new FormControl<string | null>(null);
  readonly options = [
    { value: "eu", label: "Europe" },
    { value: "us", label: "United States" },
  ];
}

describe("form controls", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let root: HTMLElement;
  const el = (id: string) => root.querySelector<HTMLElement>(`#${id}`)!;
  const settle = () => fixture.whenStable();
  const press = (target: HTMLElement, key: string) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    root = fixture.nativeElement;
    await settle();
  });

  describe("KoCheckbox", () => {
    it("reflects setValue in aria-checked without echoing it back", async () => {
      const changes: unknown[] = [];
      host.check.valueChanges.subscribe((v) => changes.push(v));
      host.check.setValue(true);
      await settle();
      expect(el("check").getAttribute("role")).toBe("checkbox");
      expect(el("check").getAttribute("aria-checked")).toBe("true");
      expect(changes).toEqual([true]);
    });

    it("updates the control on click and on Space", async () => {
      el("check").click();
      await settle();
      expect(host.check.value).toBe(true);
      press(el("check"), " ");
      await settle();
      expect(host.check.value).toBe(false);
      expect(el("check").getAttribute("aria-checked")).toBe("false");
    });

    it("renders indeterminate as mixed, and a click checks it", async () => {
      expect(el("mixed").getAttribute("aria-checked")).toBe("mixed");
      el("mixed").click();
      await settle();
      expect(el("mixed").getAttribute("aria-checked")).toBe("true");
    });

    it("blocks interaction when the control is disabled", async () => {
      host.check.disable();
      await settle();
      el("check").click();
      press(el("check"), " ");
      await settle();
      expect(host.check.value).toBe(false);
      expect(el("check").getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("KoSwitch", () => {
    it("reflects setValue in aria-checked", async () => {
      host.toggle.setValue(true);
      await settle();
      expect(el("switch").getAttribute("role")).toBe("switch");
      expect(el("switch").getAttribute("aria-checked")).toBe("true");
    });

    it("updates the control on click and toggles on Space", async () => {
      el("switch").click();
      await settle();
      expect(host.toggle.value).toBe(true);
      press(el("switch"), " ");
      await settle();
      expect(host.toggle.value).toBe(false);
    });

    it("blocks interaction when the control is disabled", async () => {
      host.toggle.disable();
      await settle();
      el("switch").click();
      press(el("switch"), " ");
      await settle();
      expect(host.toggle.value).toBe(false);
      expect(el("switch").getAttribute("aria-disabled")).toBe("true");
    });
  });

  describe("KoSelect", () => {
    const native = () => root.querySelector<HTMLSelectElement>("#select select")!;

    it("shows the placeholder, then the option set by setValue", async () => {
      expect(native().selectedOptions[0].textContent?.trim()).toBe("Pick a region");
      host.region.setValue("us");
      await settle();
      expect(native().value).toBe("us");
      expect(native().selectedOptions[0].textContent?.trim()).toBe("United States");
    });

    it("updates the control when the user changes the selection", async () => {
      native().value = "eu";
      native().dispatchEvent(new Event("change", { bubbles: true }));
      await settle();
      expect(host.region.value).toBe("eu");
    });

    it("blocks interaction when the control is disabled", async () => {
      host.region.disable();
      await settle();
      expect(native().disabled).toBe(true);
    });
  });
});
