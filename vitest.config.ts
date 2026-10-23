import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover logic that needs no browser: formatting, status wording, validation.
// A test sits beside the file it tests, as `name.test.ts`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
