import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E tests against the Railway production backend.
 *
 * Usage:
 *   npm run test:e2e:prod                          # Expo web must be running locally
 *   APP_URL=https://my-app.railway.app npm run test:e2e:prod  # fully remote app
 */
export default defineConfig({
    testDir: './e2e-prod',
    timeout: 180_000,          // 3 min — network latency to Railway
    expect: { timeout: 20_000 },
    fullyParallel: false,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e-prod/report' }]],
    use: {
        baseURL: process.env.APP_URL || 'http://localhost:8081',
        headless: true,
        viewport: { width: 390, height: 844 },
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
