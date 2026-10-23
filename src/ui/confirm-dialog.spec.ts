import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from "@angular/core";
import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { KoConfirmDialog } from "@/ui/confirm-dialog.component";

@Component({
  selector: "ko-confirm-host",
  imports: [KoConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-confirm-dialog
      title="Delete 2 items?"
      description="This cannot be undone."
      confirmLabel="Delete"
      [destructive]="destructive()"
      [pending]="pending()"
      [(open)]="open"
      (confirm)="confirmed.set(confirmed() + 1)"
    >
      <p id="extra">Extra body</p>
    </ko-confirm-dialog>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly pending = signal(false);
  readonly destructive = signal(false);
  readonly confirmed = signal(0);
}

describe("KoConfirmDialog", () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const buttons = () =>
    Array.from(document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button'));
  const button = (text: string) => buttons().find((node) => node.textContent?.trim() === text)!;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    host.open.set(true);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    document.querySelectorAll(".cdk-overlay-container").forEach((node) => node.replaceChildren());
  });

  it("shows the title, description and projected body", () => {
    const panel = document.querySelector('[role="dialog"]')!;
    expect(panel.textContent).toContain("Delete 2 items?");
    expect(panel.textContent).toContain("This cannot be undone.");
    expect(panel.querySelector("#extra")).not.toBeNull();
  });

  it("emits confirm once when the confirm button is clicked", async () => {
    button("Delete").click();
    await settle();
    expect(host.confirmed()).toBe(1);
    expect(host.open()).toBe(true);
  });

  it("sets open to false on cancel", async () => {
    button("Cancel").click();
    await settle();
    expect(host.open()).toBe(false);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it("disables confirm and marks it busy when pending changes while open", async () => {
    expect(button("Delete").disabled).toBe(false);
    host.pending.set(true);
    await fixture.whenStable();
    expect(button("Delete").disabled).toBe(true);
    expect(button("Delete").getAttribute("aria-busy")).toBe("true");
    expect(button("Cancel").disabled).toBe(true);
  });

  it("uses the destructive variant when destructive", async () => {
    expect(button("Delete").className).not.toContain("bg-destructive");
    host.destructive.set(true);
    await fixture.whenStable();
    expect(button("Delete").className).toContain("bg-destructive");
  });
});
