import { defineConfig, devices } from "@playwright/test";

// TKT-0040: minimal Playwright config. Targets the dev server at
// localhost:3000. Operator runs `npx playwright install chromium`
// once to fetch the browser, then `npm run e2e` to execute.

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
