import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";

// The theme consumers import as `@koderi-dp/ui/theme.css`, after their own tailwindcss import.
const theme = readFileSync(fileURLToPath(new URL("./theme.css", import.meta.url)), "utf8");

describe("theme.css", () => {
  it("leaves the tailwindcss import to the consumer", () => {
    expect(theme).not.toContain('@import "tailwindcss"');
  });

  it("defines the design tokens", () => {
    expect(theme).toContain("@theme");
  });

  it("brings in the animation utilities", () => {
    expect(theme).toContain('@import "tw-animate-css"');
  });

  // Resolved relative to theme.css, so importing the theme also scans the package's bundles.
  it("scans its own package for classes", () => {
    expect(theme).toContain('@source "./";');
  });

  it("loads both font families", () => {
    expect(theme).toContain("@fontsource/ibm-plex-sans");
    expect(theme).toContain("@fontsource/ibm-plex-mono");
  });

  it("carries the toast overrides", () => {
    expect(theme).toContain(".app-toaster");
    expect(theme).toContain(".app-toast ");
  });

  it("does not import the CDK prebuilt overlay stylesheet", () => {
    expect(theme).not.toContain("overlay-prebuilt");
  });
});
