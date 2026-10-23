import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover logic that needs no browser: formatting, status wording, validation.
// A test sits beside the file it tests, as `name.test.ts`. Component specs (`name.spec.ts`)
// run under `ng test` instead.
export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@koderi-dp\/ui$/,
        replacement: fileURLToPath(new URL("./projects/ui/src/public-api.ts", import.meta.url)),
      },
      {
        find: /^@koderi-dp\/ui\/(.+)$/,
        replacement: fileURLToPath(new URL("./projects/ui/$1/src/public-api.ts", import.meta.url)),
      },
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
    ],
  },
  // The chart options live inside the library, and node tests that import the `@koderi-dp/ui`
  // barrel load its Angular classes too. They need legacy decorators and, for the partially
  // compiled Angular packages, the JIT compiler.
  oxc: { decorator: { legacy: true } },
  test: {
    environment: "node",
    include: ["projects/ui/**/*.test.ts", "src/**/*.test.ts", "scripts/**/*.test.ts"],
    restoreMocks: true,
    setupFiles: ["@angular/compiler"],
  },
});
