import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The showcase: every registry item on one set of pages, to check them in a browser.
export default defineConfig({
  // The Pages workflow sets BASE_PATH to "/shared-ui/", the repo's subpath on github.io.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: { port: 5180 },
});
