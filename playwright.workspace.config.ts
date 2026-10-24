import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/workspace",
  fullyParallel: true,
  timeout: 30000,
  expect: { timeout: 8000 },
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4175",
    ...devices["Desktop Chrome"],
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4175",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_WORKSPACE_V2: "true",
      VITE_SUPABASE_URL: "https://fkptdunoizrlkqwdmcyi.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-only-public-key",
    },
  },
});
