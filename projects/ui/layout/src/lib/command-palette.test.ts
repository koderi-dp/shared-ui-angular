import { describe, expect, it } from "vitest";
import { paletteGroups } from "./command-palette";
import type { Command } from "./command-registry";
import type { NavConfig } from "./nav";

const run = () => undefined;
const nav: NavConfig = {
  primary: [
    { to: "/", label: "Overview", icon: "<svg/>", keywords: ["home"] },
    { to: "/grid", label: "Data grid", icon: "<svg/>" },
  ],
  secondary: [{ to: "/settings", label: "Settings", icon: "<svg/>", keywords: ["preferences"] }],
};
const commands: Command[] = [
  { id: "new", label: "New item", group: "Actions", run },
  { id: "out", label: "Sign out", group: "Account", description: "End the session", run },
  { id: "reset", label: "Reset settings", group: "Actions", run },
  { id: "theme", label: "Toggle theme", group: "Appearance", keywords: ["dark"], run },
];

const shape = (query: string) =>
  paletteGroups(query, nav, commands).map((group) => [
    group.heading,
    group.options.map((option) => option.label),
  ]);

describe("paletteGroups", () => {
  it("lists commands by group in first-seen order, then the pages under Pages", () => {
    expect(shape("")).toEqual([
      ["Actions", ["New item", "Reset settings"]],
      ["Account", ["Sign out"]],
      ["Appearance", ["Toggle theme"]],
      ["Pages", ["Overview", "Data grid", "Settings"]],
    ]);
  });

  it("numbers the options in display order", () => {
    const indexes = paletteGroups("", nav, commands).flatMap((group) =>
      group.options.map((option) => option.index),
    );
    expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("matches commands on label, group, description and keywords", () => {
    expect(shape("session")).toEqual([["Account", ["Sign out"]]]);
    expect(shape("dark")).toEqual([["Appearance", ["Toggle theme"]]]);
    expect(shape("appearance")).toEqual([["Appearance", ["Toggle theme"]]]);
  });

  it("matches pages on label and keywords, under Navigate while searching", () => {
    expect(shape("prefer")).toEqual([["Navigate", ["Settings"]]]);
    expect(shape("sett")).toEqual([
      ["Actions", ["Reset settings"]],
      ["Navigate", ["Settings"]],
    ]);
  });

  it("drops empty groups", () => {
    expect(shape("zzz")).toEqual([]);
  });

  it("carries the command or the page target, and the icon", () => {
    const [actions, , , pages] = paletteGroups("", nav, commands);
    expect(actions.options[0].command?.id).toBe("new");
    expect(actions.options[0].to).toBeUndefined();
    expect(pages.options[2].to).toBe("/settings");
    expect(pages.options[2].icon).toBe("<svg/>");
    expect(pages.options[2].command).toBeUndefined();
  });
});
