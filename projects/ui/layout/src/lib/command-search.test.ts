import { expect, it } from "vitest";
import { matchesTokens, searchTokens } from "./command-search";

it("splits a query into lowercased words", () => {
  expect(searchTokens("  New   Item ")).toEqual(["new", "item"]);
  expect(searchTokens("")).toEqual([]);
});

it("matches nothing but an empty query when there are no tokens", () => {
  expect(matchesTokens([], { name: "Overview" })).toBe(true);
  expect(matchesTokens(searchTokens("zzz"), { name: "Overview" })).toBe(false);
});

it("requires every token to appear in some field", () => {
  const fields = { name: "Overview", keywords: "home dashboard summary" };
  expect(matchesTokens(searchTokens("over"), fields)).toBe(true);
  expect(matchesTokens(searchTokens("dashboard"), fields)).toBe(true);
  expect(matchesTokens(searchTokens("dashboard over"), fields)).toBe(true);
  expect(matchesTokens(searchTokens("dashboard missing"), fields)).toBe(false);
});

it("restricts a `field:value` token to that field", () => {
  const fields = { name: "Overview", keywords: "dashboard" };
  expect(matchesTokens(searchTokens("name:view"), fields)).toBe(true);
  expect(matchesTokens(searchTokens("keywords:view"), fields)).toBe(false);
});

it("treats a token with an unknown field as plain text", () => {
  const fields = { name: "Overview", keywords: "dashboard" };
  // The colon is part of the text, so it cannot be mistaken for a field restriction.
  expect(matchesTokens(searchTokens("nope:dashboard"), fields)).toBe(false);
  expect(matchesTokens(searchTokens("nope:other"), fields)).toBe(false);
});
