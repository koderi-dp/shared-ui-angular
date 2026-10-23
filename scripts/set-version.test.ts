import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const script = fileURLToPath(new URL("./set-version.mjs", import.meta.url));
const original = JSON.stringify({ name: "@koderi-dp/ui", version: "0.0.0" }, null, 2) + "\n";

function tempPackageJson(): string {
  const file = join(mkdtempSync(join(tmpdir(), "set-version-")), "package.json");
  writeFileSync(file, original);
  return file;
}

function run(tag: string, file: string) {
  return spawnSync("node", [script, tag, file], { encoding: "utf8" });
}

describe("set-version", () => {
  it("writes the version from a release tag and prints it", () => {
    const file = tempPackageJson();
    const out = execFileSync("node", [script, "v0.1.0", file], { encoding: "utf8" });
    expect(out.trim()).toBe("0.1.0");
    expect(JSON.parse(readFileSync(file, "utf8")).version).toBe("0.1.0");
  });

  it("accepts a prerelease tag", () => {
    const file = tempPackageJson();
    const out = execFileSync("node", [script, "v1.2.3-beta.1", file], { encoding: "utf8" });
    expect(out.trim()).toBe("1.2.3-beta.1");
    expect(JSON.parse(readFileSync(file, "utf8")).version).toBe("1.2.3-beta.1");
  });

  it("accepts a dotted prerelease tag", () => {
    const file = tempPackageJson();
    const out = execFileSync("node", [script, "v1.2.3-rc.1", file], { encoding: "utf8" });
    expect(out.trim()).toBe("1.2.3-rc.1");
  });

  it.each(["release-1", "1.0.0", "v01.2.3", "v1.2.3-."])(
    "rejects %s and leaves the file unchanged",
    (tag) => {
      const file = tempPackageJson();
      const result = run(tag, file);
      expect(result.status).toBe(1);
      expect(result.stderr).toContain(`Not a release tag: ${tag}`);
      expect(readFileSync(file, "utf8")).toBe(original);
    },
  );
});
