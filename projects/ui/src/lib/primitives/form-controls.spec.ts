import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { KoCheckbox } from "./checkbox.component";
import { KoSelect } from "./select.component";
import { KoSwitch } from "./switch.component";

@Component({
  selector: "ko-form-controls-host",
  imports: [ReactiveFormsModule, KoCheckbox, KoSwitch, KoSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <label id="check-label" for="check">Row</label>
    <label id="switch-label" for="switch">Enabled flag</label>
    <label id="select-label" for="select">Region</label>
    <ko-checkbox id="check" [formControl]="check" />
    <ko-checkbox id="mixed" aria-label="Select all" checked="indeterminate" />
    <ko-switch id="switch" [formControl]="toggle" />
    <ko-switch id="named-switch" aria-label="Dark mode" />
    <ko-select id="named-select" aria-label="Zone" [options]="options" />
    <ko-select
      id="select"
      name="region"
      [required]="true"
      aria-invalid="true"
      aria-describedby="region-help"
      placeholder="Pick a region"
      [options]="options"
      [formControl]="region"
    />
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
      expect((el("check") as HTMLButtonElement).disabled).toBe(true);
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
      expect((el("switch") as HTMLButtonElement).disabled).toBe(true);
    });
  });

  describe("KoSelect", () => {
    const native = () => el("select") as HTMLSelectElement;

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

  describe("labels and forwarded attributes", () => {
    const labelOf = (id: string) =>
      (root.querySelector(`#${id}`) as HTMLButtonElement | HTMLSelectElement).labels;

    it("keeps exactly one element per id, never on the host", () => {
      for (const id of ["check", "switch", "select"]) {
        expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
        expect(el(id).tagName).not.toMatch(/^KO-/);
      }
    });

    it("names each control through its label", () => {
      for (const [id, text] of [
        ["check", "Row"],
        ["switch", "Enabled flag"],
        ["select", "Region"],
      ]) {
        const labels = labelOf(id)!;
        expect(labels).toHaveLength(1);
        expect(labels[0].textContent).toBe(text);
      }
    });

    it("toggles a checkbox and a switch by clicking their label", async () => {
      el("check-label").click();
      el("switch-label").click();
      await settle();
      expect(host.check.value).toBe(true);
      expect(host.toggle.value).toBe(true);
    });

    // jsdom does not move focus on a label click, so assert the association a browser acts on.
    it("points the label at the native select, which a label click focuses in a browser", () => {
      expect((el("select-label") as HTMLLabelElement).control).toBe(el("select"));
    });

    it("puts an aria-label written as an attribute on the inner control, not the host", () => {
      for (const [id, name] of [
        ["mixed", "Select all"],
        ["named-switch", "Dark mode"],
        ["named-select", "Zone"],
      ]) {
        expect(el(id).getAttribute("aria-label")).toBe(name);
        expect(el(id).parentElement!.hasAttribute("aria-label")).toBe(false);
      }
    });

    it("forwards name, required, aria-invalid and aria-describedby to the native select", () => {
      const select = el("select");
      expect(select.tagName).toBe("SELECT");
      expect(select.getAttribute("name")).toBe("region");
      expect((select as HTMLSelectElement).required).toBe(true);
      expect(select.getAttribute("aria-invalid")).toBe("true");
      expect(select.getAttribute("aria-describedby")).toBe("region-help");
    });
  });
});
