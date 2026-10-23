import { describe, expect, it } from "vitest";
import { isMacPlatform, isPaletteShortcut, shortcutLabel, urlPath } from "./app-shell";

const key = (init: Partial<KeyboardEvent>) =>
  ({
    key: "k",
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    isComposing: false,
    ...init,
  }) as Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "isComposing">;

describe("isPaletteShortcut", () => {
  it("is Ctrl+K off macOS", () => {
    expect(isPaletteShortcut(key({ ctrlKey: true }), false)).toBe(true);
    expect(isPaletteShortcut(key({ key: "K", ctrlKey: true }), false)).toBe(true);
    expect(isPaletteShortcut(key({ metaKey: true }), false)).toBe(false);
  });

  it("is Cmd+K on macOS", () => {
    expect(isPaletteShortcut(key({ metaKey: true }), true)).toBe(true);
    expect(isPaletteShortcut(key({ ctrlKey: true }), true)).toBe(false);
  });

  it("ignores other keys, Alt, and IME composition", () => {
    expect(isPaletteShortcut(key({ key: "j", ctrlKey: true }), false)).toBe(false);
    expect(isPaletteShortcut(key({}), false)).toBe(false);
    expect(isPaletteShortcut(key({ ctrlKey: true, altKey: true }), false)).toBe(false);
    expect(isPaletteShortcut(key({ ctrlKey: true, isComposing: true }), false)).toBe(false);
  });
});

describe("isMacPlatform", () => {
  it("reads userAgentData first, then navigator.platform", () => {
    expect(isMacPlatform({ userAgentData: { platform: "macOS" }, platform: "Win32" })).toBe(true);
    expect(isMacPlatform({ platform: "MacIntel" })).toBe(true);
    expect(isMacPlatform({ platform: "iPhone" })).toBe(true);
    expect(isMacPlatform({ platform: "Win32" })).toBe(false);
    expect(isMacPlatform({ userAgentData: { platform: "Windows" }, platform: "MacIntel" })).toBe(
      false,
    );
    expect(isMacPlatform({})).toBe(false);
  });
});

describe("shortcutLabel", () => {
  it("is Ctrl K off macOS and ⌘K on it", () => {
    expect(shortcutLabel(false)).toBe("Ctrl K");
    expect(shortcutLabel(true)).toBe("⌘K");
  });
});

describe("urlPath", () => {
  it("drops the query and the fragment", () => {
    expect(urlPath("/grid?sort=name#top")).toBe("/grid");
    expect(urlPath("/detail/itm-01#notes")).toBe("/detail/itm-01");
    expect(urlPath("/")).toBe("/");
    expect(urlPath("")).toBe("/");
  });
});
