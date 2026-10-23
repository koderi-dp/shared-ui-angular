import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover logic that needs no browser: formatting, status wording, validation.
// A test sits beside the file it tests, as `name.test.ts`. Component specs (`name.spec.ts`)
// run under `ng test` instead.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    restoreMocks: true,
  },
});
