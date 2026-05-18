import path from "node:path";
import { defineConfig } from "vitest/config";

// TKT-0039: minimal Vitest config. jsdom for component tests; @ alias
// mirrors the Next.js tsconfig paths.
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: false,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
