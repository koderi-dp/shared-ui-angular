import { describe, expect, it } from "vitest";
import {
  clampWidth,
  parseStoredWidths,
  resetColumnWidth,
  serializeWidths,
  setColumnWidth,
  widthsStorageKey,
  type ColumnLimits,
} from "./column-widths";

const name: ColumnLimits = { id: "name", minSize: 48, maxSize: 800 };

describe("widthsStorageKey", () => {
  it("namespaces and versions the key", () => {
    expect(widthsStorageKey("proxmox.guests")).toBe("pylon.grid.proxmox.guests.v1");
  });
});

describe("parseStoredWidths", () => {
  it("reads valid widths", () => {
    expect(parseStoredWidths('{"name":300}', [name])).toEqual({ name: 300 });
  });
  it.each([null, "", "not json", "[1]", "42"])("returns {} for %j", (raw) => {
    expect(parseStoredWidths(raw, [name])).toEqual({});
  });
  it("drops unknown ids", () => {
    expect(parseStoredWidths('{"name":300,"gone":200}', [name])).toEqual({ name: 300 });
  });
  it("drops non-number and non-finite values", () => {
    expect(parseStoredWidths('{"name":"x"}', [name])).toEqual({});
    expect(parseStoredWidths('{"name":1e999}', [name])).toEqual({});
  });
  it("clamps to current limits", () => {
    expect(parseStoredWidths('{"name":10}', [{ ...name, minSize: 160 }])).toEqual({ name: 160 });
    expect(parseStoredWidths('{"name":5000}', [name])).toEqual({ name: 800 });
  });
});

describe("clampWidth", () => {
  it("rounds to an integer", () => {
    expect(clampWidth(200.6, name)).toBe(201);
  });
});

describe("setColumnWidth / resetColumnWidth", () => {
  it("returns a new object with the clamped value", () => {
    const input = { other: 100 };
    const out = setColumnWidth(input, "name", 5000, name);
    expect(out).toEqual({ other: 100, name: 800 });
    expect(input).toEqual({ other: 100 });
  });
  it("reset removes only the key", () => {
    const input = { a: 1, b: 2 };
    expect(resetColumnWidth(input, "a")).toEqual({ b: 2 });
    expect(input).toEqual({ a: 1, b: 2 });
  });
});

describe("serializeWidths", () => {
  it("serializes as JSON", () => {
    expect(serializeWidths({ a: 1 })).toBe('{"a":1}');
  });
});
