import { expect, it } from "vitest";
import { buttonVariants } from "./button-variants";

it("uses consistent compact geometry across visual variants", () => {
  for (const variant of ["default", "secondary", "outline", "ghost", "destructive"] as const) {
    const classes = buttonVariants({ variant });
    expect(classes).toContain("h-9");
    expect(classes).toContain("rounded-md");
    expect(classes).toContain("gap-2");
    expect(classes).not.toContain("scale-");
  }
});
