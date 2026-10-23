import { describe, expect, it } from "vitest";
import { fitChipCount, moreTagsLabel } from "./chip-fit";

describe("fitChipCount", () => {
  it("fits all chips when there is room", () => {
    expect(fitChipCount([50, 50, 50], 200, 24, 4)).toBe(3);
  });
  it("reserves room for the +N chip when some are hidden", () => {
    expect(fitChipCount([50, 50, 50], 120, 24, 4)).toBe(1);
  });
  it("needs no plus chip when everything fits", () => {
    expect(fitChipCount([50], 50, 24, 4)).toBe(1);
  });
  it("returns 0 when not even one chip plus the counter fits", () => {
    expect(fitChipCount([50, 50], 20, 24, 4)).toBe(0);
  });
  it("returns 0 for no chips", () => {
    expect(fitChipCount([], 100, 24, 4)).toBe(0);
  });
  it("accepts the exact boundary", () => {
    expect(fitChipCount([50, 50], 104, 24, 4)).toBe(2);
  });
});

describe("moreTagsLabel", () => {
  it("pluralises the hidden-tag count", () => {
    expect(moreTagsLabel(4)).toBe("Show 4 more tags");
    expect(moreTagsLabel(1)).toBe("Show 1 more tag");
  });
});
