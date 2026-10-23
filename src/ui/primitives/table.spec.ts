import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  KoTable,
  KoTableBody,
  KoTableCell,
  KoTableHead,
  KoTableHeader,
  KoTableRow,
} from "@/ui/primitives/table.component";

@Component({
  selector: "ko-table-host",
  imports: [KoTable, KoTableHeader, KoTableBody, KoTableRow, KoTableHead, KoTableCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ko-table class="mt-4">
      <thead koTableHeader>
        <tr koTableRow>
          <th koTableHead>Name</th>
        </tr>
      </thead>
      <tbody koTableBody>
        <tr koTableRow>
          <td koTableCell>Alpha</td>
        </tr>
      </tbody>
    </ko-table>
  `,
})
class HostComponent {}

describe("KoTable", () => {
  let root: HTMLElement;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    root = fixture.nativeElement as HTMLElement;
  });

  it("wraps the table in an overflow-x-auto div", () => {
    const wrapper = root.querySelector("ko-table > div")!;
    expect(wrapper.classList.contains("overflow-x-auto")).toBe(true);
    expect(wrapper.classList.contains("w-full")).toBe(true);
    expect(wrapper.querySelector(":scope > table")).not.toBeNull();
  });

  it("keeps a consumer class on the host and the fixed classes on the table", () => {
    expect(root.querySelector("ko-table")!.classList.contains("mt-4")).toBe(true);
    const table = root.querySelector("table")!;
    expect(table.classList.contains("mt-4")).toBe(false);
    for (const name of ["w-full", "text-left", "text-sm"]) {
      expect(table.classList.contains(name)).toBe(true);
    }
  });

  it("projects thead and tbody inside the table", () => {
    const table = root.querySelector("table")!;
    expect(table.querySelector(":scope > thead th")?.textContent).toBe("Name");
    expect(table.querySelector(":scope > tbody td")?.textContent).toBe("Alpha");
  });

  it("is a block host", () => {
    expect(root.querySelector("ko-table")!.classList.contains("block")).toBe(true);
  });
});
