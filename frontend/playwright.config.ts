import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    headless: process.env.HEADED !== "1",
    trace: "on-first-retry",
    video: "on",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    viewport: null,
    launchOptions: {
      args: ["--start-maximized"],
    },
  },
  webServer: [
    {
      command: "npm run start:dev",
      url: "http://localhost:5000/check",
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: "../backend",
      stdout: "ignore",
      stderr: "pipe",
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: ".",
      stdout: "ignore",
      stderr: "pipe",
    },
  ],
});