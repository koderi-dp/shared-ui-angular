import { describe, expect, it } from "vitest";
import { KO_EXIT_BACKDROP, KO_EXIT_PANEL, prefersReducedMotion } from "./dialog-exit";

describe("KO_EXIT_PANEL", () => {
  it("fades and zooms a dialog out, matching the enter duration", () => {
    expect(KO_EXIT_PANEL.dialog.classes).toEqual(
      expect.arrayContaining(["animate-out", "fade-out-0", "zoom-out-95"]),
    );
    expect(KO_EXIT_PANEL.dialog.durationMs).toBe(200);
  });

  it("slides a sheet out towards its own side", () => {
    expect(KO_EXIT_PANEL.left.classes).toContain("slide-out-to-left");
    expect(KO_EXIT_PANEL.right.classes).toContain("slide-out-to-right");
    expect(KO_EXIT_PANEL.right.durationMs).toBe(300);
  });

  it("fades the backdrop out", () => {
    expect(KO_EXIT_BACKDROP).toEqual(expect.arrayContaining(["animate-out", "fade-out-0"]));
  });
});

describe("prefersReducedMotion", () => {
  it("reads the media query", () => {
    const query = (matches: boolean) => (q: string) => {
      expect(q).toBe("(prefers-reduced-motion: reduce)");
      return { matches };
    };
    expect(prefersReducedMotion(query(true))).toBe(true);
    expect(prefersReducedMotion(query(false))).toBe(false);
  });

  it("is false where matchMedia is missing", () => {
    expect(prefersReducedMotion(undefined)).toBe(false);
  });
});
