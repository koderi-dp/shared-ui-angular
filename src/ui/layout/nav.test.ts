import { Activity, Settings } from "lucide-react";
import { expect, it } from "vitest";
import { isNavActive, navItems, type NavConfig } from "./nav";

const nav: NavConfig = {
  primary: [
    { to: "/", label: "Overview", icon: Activity },
    { to: "/items", label: "Items", icon: Activity },
  ],
  secondary: [{ to: "/settings", label: "Settings", icon: Settings, keywords: ["preferences"] }],
};

it("lists the secondary items after the primary ones", () => {
  expect(navItems(nav).map((item) => item.to)).toEqual(["/", "/items", "/settings"]);
  expect(navItems({ primary: nav.primary }).map((item) => item.to)).toEqual(["/", "/items"]);
});

it("marks `/` active only on itself", () => {
  expect(isNavActive("/", "/")).toBe(true);
  expect(isNavActive("/items", "/")).toBe(false);
});

it("marks any other item active on itself and on its child pages", () => {
  expect(isNavActive("/items", "/items")).toBe(true);
  expect(isNavActive("/items/42", "/items")).toBe(true);
  // A sibling whose path merely starts with the same letters is not a child.
  expect(isNavActive("/items-archive", "/items")).toBe(false);
});
