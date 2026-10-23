import { expect, it } from "vitest";
import {
  cn,
  formatBytes,
  formatDuration,
  formatRelative,
  clampFixedPopoverPosition,
} from "./utils";

it("merges conflicting Tailwind classes, keeping the last one", () => {
  const hidden = false as boolean;
  expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  expect(cn("text-sm", hidden && "hidden", undefined, "font-medium")).toBe("text-sm font-medium");
});

it("formats bytes at each unit boundary", () => {
  expect(formatBytes(512)).toBe("512 B");
  expect(formatBytes(1024)).toBe("1.0 KB");
  expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
  expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe("3.0 GB");
});

it("formats a duration in the largest two units", () => {
  expect(formatDuration(45_000)).toBe("45s");
  expect(formatDuration(90_000)).toBe("1m 30s");
  expect(formatDuration(3 * 3600_000 + 5 * 60_000)).toBe("3h 5m");
  // A clock that has gone backwards is shown as zero, not a negative time.
  expect(formatDuration(-1000)).toBe("0s");
});

it("formats a timestamp relative to now", () => {
  const now = Date.parse("2026-01-01T12:00:00Z");
  expect(formatRelative(now, now)).toBe("just now");
  expect(formatRelative(now - 5 * 60_000, now)).toBe("5m ago");
  expect(formatRelative(now - 3 * 3600_000, now)).toBe("3h ago");
  expect(formatRelative(now - 2 * 86_400_000, now)).toBe("2d ago");
});

it("flips a popover above and left when it would leave the viewport", () => {
  const viewport = { width: 1000, height: 800 };
  expect(clampFixedPopoverPosition(10, 10, 200, 100, viewport)).toEqual({ left: 10, top: 10 });
  // Too near the bottom right: the box is placed above and to the left of the point.
  expect(clampFixedPopoverPosition(980, 780, 200, 100, viewport)).toEqual({
    left: 780,
    top: 680,
  });
  // Never outside the padding, even for a box larger than the viewport.
  expect(clampFixedPopoverPosition(0, 0, 2000, 2000, viewport)).toEqual({ left: 8, top: 8 });
});
