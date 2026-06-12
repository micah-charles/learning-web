import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 120000,
  expect: {
    timeout: 15000,
  },
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    timeout: 180000,
    reuseExistingServer: true,
  },
});
