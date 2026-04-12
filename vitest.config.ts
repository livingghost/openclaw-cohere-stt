import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 120_000,
    hookTimeout: 120_000,
    unstubEnvs: true,
    unstubGlobals: true,
    include: ["*.test.ts"],
  },
});
