import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests cover logic that needs no browser: formatting, status wording, validation.
// A test sits beside the file it tests, as `name.test.ts`. Component specs (`name.spec.ts`)
// run under `ng test` instead.
export default defineConfig({
  resolve: {
    alias: {
      "@koderi-dp/ui": fileURLToPath(new URL("./projects/ui/src/public-api.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // A logic file outside the library (the chart options) imports helpers from the
  // `@koderi-dp/ui` barrel, which loads the Angular classes too. They need legacy decorators
  // and, for the partially compiled Angular packages, the JIT compiler.
  oxc: { decorator: { legacy: true } },
  test: {
    environment: "node",
    include: ["projects/ui/**/*.test.ts", "src/**/*.test.ts", "scripts/**/*.test.ts"],
    restoreMocks: true,
    setupFiles: ["@angular/compiler"],
  },
});
