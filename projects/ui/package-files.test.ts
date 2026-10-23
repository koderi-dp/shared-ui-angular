import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("packaged files", () => {
  it.each(["LICENSE", "README.md"])("projects/ui/%s is identical to the root file", (name) => {
    expect(read(`./${name}`), `copy projects/ui/${name} from the root ${name}`).toBe(
      read(`../../${name}`),
    );
  });
});
