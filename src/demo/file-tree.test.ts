import { expect, it } from "vitest";
import { isAncestor, moveNodes, type FlatNode } from "./file-tree";

const nodes: FlatNode[] = [
  { id: "root", parentId: null },
  { id: "a", parentId: "root" },
  { id: "a/1", parentId: "a" },
  { id: "a/2", parentId: "a" },
  { id: "a/3", parentId: "a" },
  { id: "b", parentId: "root" },
  { id: "b/1", parentId: "b" },
];

const children = (list: FlatNode[], parentId: string) =>
  list.filter((node) => node.parentId === parentId).map((node) => node.id);

it("finds an ancestor any number of levels up", () => {
  expect(isAncestor(nodes, "root", "a/2")).toBe(true);
  expect(isAncestor(nodes, "a", "a/2")).toBe(true);
  expect(isAncestor(nodes, "b", "a/2")).toBe(false);
  expect(isAncestor(nodes, "a/2", "a/2")).toBe(false);
});

it("reorders within a folder, counting the index without the dragged rows", () => {
  // a/3 dropped above a/1: index 0 of [a/1, a/2].
  expect(children(moveNodes(nodes, ["a/3"], "a", 0), "a")).toEqual(["a/3", "a/1", "a/2"]);
  // a/1 dropped below a/3: index 2 of [a/2, a/3].
  expect(children(moveNodes(nodes, ["a/1"], "a", 2), "a")).toEqual(["a/2", "a/3", "a/1"]);
});

it("moves into another folder at a position", () => {
  const next = moveNodes(nodes, ["a/2"], "b", 0);
  expect(children(next, "b")).toEqual(["a/2", "b/1"]);
  expect(children(next, "a")).toEqual(["a/1", "a/3"]);
});

it("puts rows last when there is no index or it is past the end", () => {
  expect(children(moveNodes(nodes, ["a/1"], "b"), "b")).toEqual(["b/1", "a/1"]);
  expect(children(moveNodes(nodes, ["a/1"], "b", 9), "b")).toEqual(["b/1", "a/1"]);
});

it("keeps several moved rows together in the order given", () => {
  expect(children(moveNodes(nodes, ["a/3", "a/1"], "b", 0), "b")).toEqual(["a/3", "a/1", "b/1"]);
});

it("moves a folder to the root level between two others", () => {
  expect(children(moveNodes(nodes, ["b"], "root", 0), "root")).toEqual(["b", "a"]);
});
