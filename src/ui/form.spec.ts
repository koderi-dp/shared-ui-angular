import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { KoDisclosure, KoField, KoNumberInput } from "@/ui/form.component";
import { KoInput } from "@/ui/primitives/input.directive";

@Component({
  selector: "ko-form-host",
  imports: [KoField, KoNumberInput, KoDisclosure, KoInput, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-field label="Workers" [error]="error()" hint="How many.">
      <ko-number-input [formControl]="workers" [min]="1" [max]="16" ariaLabel="Workers" />
    </ko-field>
    <ko-field label="Name" hint="What it is called.">
      <input koInput id="name" />
    </ko-field>
    <ko-disclosure title="Advanced" [forceOpen]="force()">
      <p id="advanced">Inside</p>
    </ko-disclosure>
  `,
})
class HostComponent {
  readonly workers = new FormControl(4, { nonNullable: true });
  readonly error = signal<string | undefined>(undefined);
  readonly force = signal(false);
}

describe("form composites", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const root = () => fixture.nativeElement as HTMLElement;
  const input = () => root().querySelector<HTMLInputElement>('input[aria-label="Workers"]')!;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event("input"));
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    await settle();
  });

  describe("KoNumberInput", () => {
    it("shows the value and reports typed numbers", async () => {
      expect(input().value).toBe("4");
      type("9");
      await settle();
      expect(host.workers.value).toBe(9);
    });

    it("clamps a typed value above max to max on blur", async () => {
      type("99");
      input().dispatchEvent(new Event("blur"));
      await settle();
      expect(host.workers.value).toBe(16);
      expect(input().value).toBe("16");
    });

    it("keeps an emptied field empty until blur, then returns to min", async () => {
      type("");
      await settle();
      expect(input().value).toBe("");
      expect(host.workers.value).toBe(4);
      input().dispatchEvent(new Event("blur"));
      await settle();
      expect(host.workers.value).toBe(1);
      expect(input().value).toBe("1");
    });

    it("drops anything that is not a digit", async () => {
      type("1a2");
      await settle();
      expect(input().value).toBe("12");
      expect(host.workers.value).toBe(12);
    });
  });

  describe("KoField", () => {
    it("renders the error with role alert and links it to the control", async () => {
      host.error.set("Too many workers");
      await settle();
      const alert = root().querySelector<HTMLElement>('[role="alert"]')!;
      expect(alert.textContent).toContain("Too many workers");
      expect(input().getAttribute("aria-describedby")).toBe(alert.id);
      expect(input().getAttribute("aria-invalid")).toBe("true");
    });

    it("points the control at the hint when there is no error, and back again", async () => {
      const hintId = input().getAttribute("aria-describedby")!;
      expect(root().querySelector("#" + hintId)!.textContent).toContain("How many.");
      expect(input().hasAttribute("aria-invalid")).toBe(false);
      host.error.set("Bad");
      await settle();
      host.error.set(undefined);
      await settle();
      expect(input().hasAttribute("aria-invalid")).toBe(false);
      expect(input().getAttribute("aria-describedby")).toBe(hintId);
    });

    it("links a plain input to its hint", () => {
      const name = root().querySelector<HTMLInputElement>("#name")!;
      expect(name.getAttribute("aria-describedby")).toMatch(/^ko-field-message-\d+$/);
    });
  });

  describe("KoDisclosure", () => {
    const toggle = () => root().querySelector<HTMLButtonElement>("ko-disclosure button")!;

    it("is closed by default and toggles", async () => {
      expect(root().querySelector("#advanced")).toBeNull();
      toggle().click();
      await settle();
      expect(toggle().getAttribute("aria-expanded")).toBe("true");
      expect(root().querySelector("#advanced")).not.toBeNull();
      toggle().click();
      await settle();
      expect(root().querySelector("#advanced")).toBeNull();
    });

    it("cannot be closed while forceOpen is set", async () => {
      host.force.set(true);
      await settle();
      expect(toggle().getAttribute("aria-expanded")).toBe("true");
      toggle().click();
      await settle();
      expect(toggle().getAttribute("aria-expanded")).toBe("true");
      expect(root().querySelector("#advanced")).not.toBeNull();
    });
  });
});
