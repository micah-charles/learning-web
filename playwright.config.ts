import { defineConfig, devices } from "@playwright/test";

const qaBaseUrl = process.env.QA_BASE_URL || "http://127.0.0.1:4175";
const useLocalServer = process.env.QA_USE_LOCAL_SERVER !== "false";

export default defineConfig({
  testDir: "./qa/tests",
  timeout: 90_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ["html", { outputFolder: "qa/reports/html", open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: qaBaseUrl,
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 960 },
      },
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 5"],
      },
    },
  ],
  webServer: useLocalServer
    ? {
        command: "npm run dev -- --host 127.0.0.1 --port 4175",
        url: "http://127.0.0.1:4175",
        timeout: 180_000,
        reuseExistingServer: false,
      }
    : undefined,
});
