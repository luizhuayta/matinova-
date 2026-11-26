import { defineConfig, devices } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function findPlaywrightChromium(): string | undefined {
  const override = process.env['PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH'];
  if (override && existsSync(override)) {
    return override;
  }
  const cacheDir = process.env['PLAYWRIGHT_BROWSERS_PATH'] || join(homedir(), '.cache/ms-playwright');
  if (!existsSync(cacheDir)) {
    return undefined;
  }
  const chromiumDirs = readdirSync(cacheDir)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.slice('chromium-'.length)) - Number(a.slice('chromium-'.length)));

  for (const dir of chromiumDirs) {
    const candidates = [
      join(cacheDir, dir, 'chrome-linux64/chrome'),
      join(cacheDir, dir, 'chrome-linux/chrome'),
      join(cacheDir, dir, 'chrome-mac/Chromium.app/Contents/MacOS/Chromium'),
    ];
    const match = candidates.find((candidate) => existsSync(candidate));
    if (match) {
      return match;
    }
  }
  return undefined;
}

const baseURL = process.env['E2E_BASE_URL'] || 'http://localhost:4200';
const chromiumExecutable = findPlaywrightChromium();

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(chromiumExecutable ? { executablePath: chromiumExecutable } : {}),
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
  webServer: {
    command: 'npm start -- --host localhost --port 4200',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
