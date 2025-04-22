import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    globals: true,
    globalSetup: ["./src/tests/global-setup.ts"],
    setupFiles: ["./src/tests/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    fileParallelism: false,
    coverage: {
      provider: "istanbul",
      reporter: ["text", "json", "html", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/db/migrations/**",
        "src/db/index.ts",
        "src/index.ts",
        "src/**/*.{test,spec}.{ts,tsx}",
        "src/tests/setup.ts",
        "src/tests/global-setup.ts",
      ],
      all: true,
    },
  },
});
