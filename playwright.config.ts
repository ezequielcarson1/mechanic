import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 120_000,          // 2 min per test — bot takes ~4-8 s, searching up to 35 s
    expect: { timeout: 15_000 },
    fullyParallel: false,       // tests share state (logged-in user)
    retries: 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'e2e/report' }]],
    use: {
        baseURL: process.env.APP_URL || 'http://localhost:8081',
        headless: true,
        viewport: { width: 390, height: 844 },   // iPhone 14 dimensions
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
    // Do NOT start a web server automatically — run `npm run web` separately
    // or pass APP_URL= pointing to your running Expo instance.
});
