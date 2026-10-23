import { describe, expect, it } from "vitest";
import { BADGE_VARIANT, DOT_CLASS, TEXT_CLASS, type StatusTone } from "./tones";

const TONES: StatusTone[] = ["live", "success", "warning", "danger", "muted", "neutral"];

describe("status tones", () => {
  it("maps every tone to a badge variant", () => {
    expect(BADGE_VARIANT).toEqual({
      live: "live",
      success: "live",
      warning: "warn",
      danger: "danger",
      muted: "outline",
      neutral: "default",
    });
  });

  it("maps every tone to a dot class", () => {
    expect(DOT_CLASS).toEqual({
      success: "bg-emerald-500",
      live: "bg-emerald-500",
      warning: "bg-amber-500",
      danger: "bg-destructive",
      muted: "bg-muted-foreground/50",
      neutral: "bg-muted-foreground",
    });
  });

  it("maps every tone to a text class", () => {
    expect(TEXT_CLASS).toEqual({
      success: "text-emerald-600 dark:text-emerald-400",
      live: "text-emerald-600 dark:text-emerald-400",
      warning: "text-amber-600 dark:text-amber-400",
      danger: "text-destructive",
      muted: "text-muted-foreground",
      neutral: "text-foreground",
    });
  });

  it("covers exactly the StatusTone values", () => {
    for (const map of [BADGE_VARIANT, DOT_CLASS, TEXT_CLASS]) {
      expect(Object.keys(map).sort()).toEqual([...TONES].sort());
    }
  });
});
