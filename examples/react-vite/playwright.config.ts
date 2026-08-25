import { defineConfig } from "@playwright/test";

/**
 * Two suites, one browser install.
 *
 * The example app's tours are audited here because only a browser can catch an
 * anchor that exists in source and never renders. The docs site's layout is
 * audited here for a duller reason: it needed a gate, CI already installs
 * Chromium for this package, and standing up a second Playwright install to run
 * six assertions would cost more than it is worth.
 *
 * Each project keeps its spec next to the thing it tests, so `apps/web/tests`
 * belongs to the site and this directory belongs to the example.
 */
export default defineConfig({
  timeout: 60_000,
  projects: [
    {
      name: "example",
      testDir: "./tests",
      use: { baseURL: "http://localhost:4200" },
    },
    {
      name: "docs",
      testDir: "../../apps/web/tests",
      use: { baseURL: "http://localhost:4300" },
    },
  ],
  /*
   * `reuseExistingServer` on both, so running this while either dev server is
   * already up attaches to it rather than failing on a taken port.
   *
   * The site gets a longer timeout than the example: it is a Next app compiling
   * routes on demand, and a cold first request to /docs/install is slower than
   * anything Vite does.
   */
  webServer: [
    {
      command: "pnpm dev",
      url: "http://localhost:4200",
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @cairnkit/web dev",
      url: "http://localhost:4300",
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
