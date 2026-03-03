import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: "server",
          include: ["app/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "client",
          include: ["extensions/**/*.test.ts"],
          environment: "happy-dom",
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: [
        "app/schemas/**",
        "app/utils/**",
        "app/billing.server.ts",
        "extensions/sticky-button/assets/**",
      ],
    },
  },
});
