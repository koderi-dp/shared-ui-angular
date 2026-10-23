import { linkToPanel } from "./dialog-panel";

describe("linkToPanel", () => {
  const build = (panelAttrs = "") => {
    const root = document.createElement("div");
    root.innerHTML = `<div role="dialog" ${panelAttrs}><h2 id="title">Title</h2></div><p id="outside">x</p>`;
    return {
      panel: root.querySelector<HTMLElement>('[role="dialog"]')!,
      title: root.querySelector<HTMLElement>("#title")!,
      outside: root.querySelector<HTMLElement>("#outside")!,
    };
  };

  it("points the dialog panel at the element", () => {
    const { panel, title } = build();
    linkToPanel(title, "aria-labelledby");
    expect(panel.getAttribute("aria-labelledby")).toBe("title");
  });

  it("keeps an attribute the panel already has", () => {
    const { panel, title } = build('aria-labelledby="mine"');
    linkToPanel(title, "aria-labelledby");
    expect(panel.getAttribute("aria-labelledby")).toBe("mine");
  });

  it("does nothing outside a dialog", () => {
    const { outside } = build();
    expect(() => linkToPanel(outside, "aria-describedby")).not.toThrow();
  });
});
