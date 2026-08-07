import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: { baseURL: "http://localhost:4200" },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4200",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
