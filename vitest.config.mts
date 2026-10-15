import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    reporters: ["verbose"],
    include: ["src/tests/**/*.test.ts", "src/tests/**/*.test.tsx"],
    // Run all test files in one worker to share the mongoose connection
    pool: "forks",
    forks: {
      singleFork: true,
    },
    isolate: false,
    fileParallelism: false,
    hookTimeout: 30000,
    testTimeout: 30000,
    coverage: {
      reporter: ["text", "json", "html"],
      include: ["src/lib/**", "src/db/**", "src/app/actions/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
});
