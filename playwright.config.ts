import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

// Uçtan uca testler (KURALLAR 11, FAZLAR 2.5): giriş, ürün ekleme, menünün açılması.
// Seed'li bir veritabanı gerekir (npm run db:reset). Çalıştırma: npm run test:e2e
// Sunucu açık değilse üretim derlemesi alınıp başlatılır.

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  // Testler aynı örnek işletmeyi değiştirir; sırayla çalışır.
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    locale: "tr-TR",
    timezoneId: "Europe/Istanbul",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "setup", testMatch: "**/auth.setup.ts" },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: `${process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
