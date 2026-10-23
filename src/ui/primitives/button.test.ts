import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Save, RefreshCw } from "lucide-react";
import { expect, it } from "vitest";
import { Button, IconButton } from "./button";
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
it("renders decorative icons with the unchanged label and disables while loading", () => {
  const html = renderToStaticMarkup(
    createElement(Button, { icon: Save, loading: true }, "Save record"),
  );
  expect(html).toContain('disabled=""');
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain('aria-hidden="true"');
  expect(html).toContain("animate-spin");
  expect(html).toContain("Save record");
  expect(html).not.toContain("Saving");
  expect((html.match(/<svg/g) ?? []).length).toBe(1);
});
it("keeps text-only labels in layout and the accessibility tree while busy", () => {
  const html = renderToStaticMarkup(createElement(Button, { loading: true }, "Continue"));
  expect(html).toContain("opacity-0");
  expect(html).toContain("Continue");
  expect(html).not.toContain("invisible");
});
it("provides an accessible label and tooltip on icon-only buttons", () => {
  const html = renderToStaticMarkup(
    createElement(IconButton, { icon: RefreshCw, label: "Refresh connections" }),
  );
  expect(html).toContain('aria-label="Refresh connections"');
  expect(html).toContain('title="Refresh connections"');
  expect(html).toContain("size-8");
});
it("preserves slotted links and removes disabled ones from tab order", () => {
  const html = renderToStaticMarkup(
    createElement(
      Button,
      { asChild: true, disabled: true },
      createElement("a", { href: "/assets" }, "Assets"),
    ),
  );
  expect(html).toContain('<a href="/assets"');
  expect(html).toContain('aria-disabled="true"');
  expect(html).toContain('tabindex="-1"');
  expect(html).not.toContain("<button");
});
