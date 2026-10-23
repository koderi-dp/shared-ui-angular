import { expect, it } from "vitest";
import { statusLabel, statusTone } from "./status-text";

it("gives every state a tone, and an unknown state the outline one", () => {
  expect(statusTone("running")).toBe("live");
  expect(statusTone("degraded")).toBe("warn");
  expect(statusTone("failed")).toBe("danger");
  expect(statusTone("stopped")).toBe("outline");
  expect(statusTone("something-new")).toBe("outline");
});

it("matches a state whatever its case", () => {
  expect(statusTone("RUNNING")).toBe("live");
  expect(statusLabel("FAILED")).toBe("Failed");
});

it("shows an unlisted state under its own name, capitalised", () => {
  expect(statusLabel("running")).toBe("Running");
  expect(statusLabel("warming-up")).toBe("Warming-up");
});
