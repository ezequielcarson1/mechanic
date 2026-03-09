/**
 * Mechanic App — Full E2E Browser Test (Playwright / headless Chromium)
 *
 * Prerequisites:
 *   1. Backend running:  cd server && node index.js
 *   2. Expo web running: npm run web   (http://localhost:8081)
 *
 * Run:
 *   npx playwright test
 *   npx playwright test --headed          ← visible browser, good for debugging
 *   APP_URL=http://... npx playwright test ← custom app URL
 *
 * Login strategy:
 *   @react-native-firebase is a native module and does NOT work in a web browser.
 *   Instead of going through the OTP UI we:
 *     1. Call the backend API directly to get the test user object.
 *     2. Inject it into localStorage (AsyncStorage maps to localStorage on web)
 *        BEFORE the page loads so UserContext reads it on startup.
 *   This gives us a fully logged-in session without touching Firebase.
 */

import { expect, Page, test } from '@playwright/test';

const API_URL   = process.env.API_URL   || 'http://localhost:3000';
const TEST_PHONE = '+11111111111';

// ─── helpers ─────────────────────────────────────────────────────────────────

async function waitForText(page: Page, text: string | RegExp, timeout = 20_000) {
    // page.getByText() natively handles both strings and RegExp
    await expect(page.getByText(text).first()).toBeVisible({ timeout });
}

async function clickText(page: Page, text: string) {
    await page.locator(`text=${text}`).first().click();
}

// ─── fetch test-user data from API (Node side, before browser opens) ─────────

async function fetchTestUser() {
    const res = await fetch(`${API_URL}/api/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: TEST_PHONE }),
    });
    if (!res.ok) throw new Error(`/api/login returned ${res.status} — is the backend running?`);
    return res.json();
}

// ─── test ─────────────────────────────────────────────────────────────────────

test('Full user journey: session inject → edit profile → request → accept → cancel', async ({ page }) => {

    // ── 0. Fetch user from API (Node context, not browser) ───────────────────
    let testUser: Record<string, unknown>;
    await test.step('Fetch test user from backend API', async () => {
        testUser = await fetchTestUser();
        expect(testUser.id).toBeTruthy();
        console.log(`  → user: ${testUser.name} ${testUser.surname}  id: ${testUser.id}`);
    });

    // ── 1. Inject session + force local API config ────────────────────────────
    await test.step('Inject session into localStorage (bypass Firebase)', async () => {
        // Intercept the bootstrap config fetch so ConfigService always gets
        // local endpoints — prevents it from overwriting localStorage with prod URLs.
        const localBootstrap = {
            allowEnvSwitch: true,
            defaultEnv: 'dev',
            envs: {
                prod: { apiBaseUrl: API_URL, wsUrl: API_URL.replace('http', 'ws') },
                dev:  { apiBaseUrl: API_URL, wsUrl: API_URL.replace('http', 'ws') },
            },
        };
        await page.route('https://bootstrap.mechanicapp.com/config', route =>
            route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(localBootstrap) })
        );

        // AsyncStorage on web stores values under the plain key in localStorage.
        await page.addInitScript(({ user, apiUrl }) => {
            try {
                const serialised = JSON.stringify(user);
                // Both storage keys used by different AsyncStorage versions
                localStorage.setItem('user_session', serialised);
                localStorage.setItem('@AsyncStorage:user_session', serialised);

                // Pre-seed the config cache so ConfigService skips the network
                // fetch even if the route intercept races with app startup.
                const localConfig = JSON.stringify({
                    allowEnvSwitch: true,
                    defaultEnv: 'dev',
                    envs: {
                        prod: { apiBaseUrl: apiUrl, wsUrl: apiUrl.replace('http', 'ws') },
                        dev:  { apiBaseUrl: apiUrl, wsUrl: apiUrl.replace('http', 'ws') },
                    },
                });
                localStorage.setItem('@mechanic:remoteConfigCache', localConfig);
                localStorage.setItem('@AsyncStorage:@mechanic:remoteConfigCache', localConfig);
                localStorage.setItem('@mechanic:selectedEnv', 'dev');
                localStorage.setItem('@AsyncStorage:@mechanic:selectedEnv', 'dev');
            } catch { /* storage blocked — test will fail later with a clear message */ }
        }, { user: testUser, apiUrl: API_URL });
    });

    // ── 2. Load app — should land on tabs (already logged in) ────────────────
    await test.step('Load app — expect to land on main tabs', async () => {
        await page.goto('/');
        // App reads the injected session from AsyncStorage and skips login
        await page.waitForURL(/\/(tabs|assist|appointments|index)/, { timeout: 25_000 });
        console.log('  → landed on:', page.url());
    });

    // ── 3. Navigate to Profile → Personal Information ────────────────────────
    await test.step('Open Personal Information screen', async () => {
        await page.goto('/personal-info');
        await waitForText(page, 'Personal information');
    });

    // ── 4. Update address fields ──────────────────────────────────────────────
    await test.step('Fill address: 956 Golden Cane Dr, Weston FL 33327', async () => {
        // Street input — find by placeholder text
        const streetInput = page.locator('input[placeholder*="street" i], input[placeholder*="address" i], input[placeholder*="Enter" i]').first();
        if (await streetInput.isVisible({ timeout: 5_000 }).catch(() => false)) {
            await streetInput.click({ clickCount: 3 });
            await streetInput.fill('956 Golden Cane Dr');
            // Wait briefly for autocomplete and dismiss if shown
            await page.waitForTimeout(1_500);
            const suggestion = page.locator('div').filter({ hasText: /956 Golden Cane/i }).nth(1);
            if (await suggestion.isVisible({ timeout: 4_000 }).catch(() => false)) {
                await suggestion.click();
            }
        }

        // Zip code — match by placeholder containing zip/33 digits
        const allInputs = await page.locator('input').all();
        for (const inp of allInputs) {
            const ph = (await inp.getAttribute('placeholder') ?? '').toLowerCase();
            if (/zip|postal|3313|3332/.test(ph)) {
                await inp.click({ clickCount: 3 });
                await inp.fill('33327');
                break;
            }
        }

        // City
        const cityInput = page.locator('input[placeholder*="city" i]').first();
        if (await cityInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
            await cityInput.click({ clickCount: 3 });
            await cityInput.fill('Weston');
        }
    });

    // ── 5. Save profile ───────────────────────────────────────────────────────
    await test.step('Click "Update Profile" and close success modal', async () => {
        await clickText(page, 'Update Profile');
        await waitForText(page, 'Success');
        await clickText(page, 'Close');
    });

    // ── 6. Start the request-assistance wizard ────────────────────────────────
    await test.step('Navigate to Request Assistance', async () => {
        await page.goto('/request-assistance');
        await waitForText(page, 'Request a mechanic');
    });

    // ── 7. Choose Immediate Assistance ───────────────────────────────────────
    await test.step('Choose IMMEDIATE ASSISTANCE', async () => {
        await clickText(page, 'IMMEDIATE ASSISTANCE');
        await page.waitForTimeout(1_000);
    });

    // ── 8. Select first vehicle ───────────────────────────────────────────────
    await test.step('Select first vehicle', async () => {
        // Wait for the vehicle selection screen to be fully loaded
        await waitForText(page, 'Select your vehicle', 10_000);

        // Vehicle cards are plain divs — match by the model text rendered inside them.
        // The first non-"Add a vehicle" card is the user's registered vehicle.
        const vehicleCard = page.locator('div')
            .filter({ hasText: /model|make|year|\bNO PLATE\b/i })
            .filter({ hasNotText: /add a vehicle/i })
            .first();

        try {
            await vehicleCard.waitFor({ state: 'visible', timeout: 8_000 });
            await vehicleCard.click();
        } catch {
            // Fallback: click "Add a vehicle" isn't useful — try any skip/continue
            const skip = page.locator('text=/skip|continue without/i').first();
            if (await skip.isVisible({ timeout: 2_000 }).catch(() => false)) await skip.click();
        }

        // Confirm we moved off the vehicle screen
        await expect(page.locator('text=Select your vehicle')).toBeHidden({ timeout: 8_000 });
    });

    // ── 9. Issue selection screen ─────────────────────────────────────────────
    await test.step('Select issue type and continue', async () => {
        // After vehicle selection the app navigates to issue-selection.tsx
        await waitForText(page, 'Indicate the issue', 10_000);

        // Fill in the description textarea
        const descBox = page.getByPlaceholder("Describe what's happening with your vehicle");
        await descBox.waitFor({ state: 'visible', timeout: 5_000 });
        await descBox.fill('Battery dead — E2E test');

        // Also tap a pre-defined issue chip to ensure validation passes
        await page.getByText('Battery / Starting issue').first().click();

        // Click Continue
        await page.getByText('Continue').first().click();

        // Confirm we left the issue screen
        await expect(page.getByText('Indicate the issue')).toBeHidden({ timeout: 8_000 });
    });

    // ── 10. Add-details screen ────────────────────────────────────────────────
    await test.step('Fill additional details and click "Confirm Issue"', async () => {
        await page.waitForURL(/add-details/, { timeout: 10_000 });
        await waitForText(page, 'Indicate more issue details', 8_000);

        const detailBox = page.getByPlaceholder('Type here...');
        await detailBox.waitFor({ state: 'visible', timeout: 5_000 });
        await detailBox.fill('Battery dead — E2E test');

        await page.getByText('Confirm Issue').first().click();
    });

    // ── 11. Location-map screen ───────────────────────────────────────────────
    await test.step('Confirm location on map', async () => {
        // react-native-maps may not render in a headless browser but the
        // "Confirm Location" button is always present in the DOM.
        await page.waitForURL(/location-map/, { timeout: 10_000 });
        const confirmBtn = page.getByText('Confirm Location').first();
        await confirmBtn.waitFor({ state: 'visible', timeout: 10_000 });
        await confirmBtn.click();
    });

    // ── 12. Confirm and submit ────────────────────────────────────────────────
    let requestId: string | null = null;
    await test.step('Confirm request and capture ID', async () => {
        // Wait for the unique heading on the confirmation screen
        await waitForText(page, 'Confirm assistance request', 10_000);

        const [response] = await Promise.all([
            page.waitForResponse(
                r => r.url().includes('/api/assistance') && r.request().method() === 'POST',
                { timeout: 15_000 }
            ),
            page.getByText('Confirm and Request').first().click(),
        ]);

        const body = await response.json().catch(() => ({}));
        requestId = (body as any)?.id ?? null;
        expect(requestId).toBeTruthy();
        console.log('  → request id:', requestId);
        console.log('  → api url hit:', response.url());
    });

    // ── 13. Searching — wait for bot to offer (up to 45 s) ───────────────────
    await test.step('Wait for bot mechanic to respond', async () => {
        // The searching screen auto-navigates to mechanic-found when status=offered.
        // The mechanic-found screen heading is "Select your best match".
        await page.waitForURL(/mechanic-found/, { timeout: 45_000 });
        await waitForText(page, 'Select your best match', 10_000);
    });

    // ── 14. Accept the mechanic offer ─────────────────────────────────────────
    await test.step('Click "Confirm and Request"', async () => {
        await page.locator('text=Confirm and Request').first().click();
        // App navigates to appointment detail
        await page.waitForURL(/appointments/, { timeout: 15_000 });
        await waitForText(page, /accepted/i, 10_000);
    });

    // ── 14a. Open chat and exchange a message with the bot mechanic ───────────
    await test.step('Send a chat message and wait for bot reply', async () => {
        // Click "Message" button on the appointment info tab
        await page.getByText('Message').first().click();
        await page.waitForURL(/\/chat\//, { timeout: 10_000 });

        // Type a message in the chat input
        const chatInput = page.getByPlaceholder('Write Here...');
        await chatInput.waitFor({ state: 'visible', timeout: 8_000 });
        await chatInput.fill('Hello, how long until you arrive?');

        // The send button renders as an <img> (lucide icon), not a <button>.
        // It is the immediate following sibling of the text input in the DOM.
        await page.locator('input[placeholder="Write Here..."]')
            .locator('xpath=following-sibling::*[1]')
            .click();

        // Verify our message appears in the chat
        await waitForText(page, 'Hello, how long until you arrive?', 5_000);
        console.log('  → user message sent');

        // Wait for bot reply (bot delays 1.5–3.5 s).
        // Check document.body.innerText for any phrase from BOT_CHAT_REPLIES.
        await page.waitForFunction(() => {
            const text = document.body.innerText;
            return [
                'On my way', 'Got it', 'No problem', 'Understood',
                'Thanks for the details', "I've seen this issue",
                'Just leaving now', 'Can you make sure',
                'Almost there', 'Noted.', 'heading your way',
                'have the parts', 'drive over', 'traffic looks',
                'accessible', 'tools needed',
            ].some(phrase => text.includes(phrase));
        }, undefined, { timeout: 12_000 });
        console.log('  → bot reply received');

        // Navigate back to the appointment detail
        await page.goto(`/appointments/${requestId}`);
        await page.waitForURL(/appointments/, { timeout: 10_000 });
    });

    // ── 15. Cancel the request ────────────────────────────────────────────────
    await test.step('Cancel the request', async () => {
        const cancelTrigger = page.locator('text=/cancel request/i').first();
        await cancelTrigger.waitFor({ state: 'visible', timeout: 10_000 });
        await cancelTrigger.click();

        // Cancellation modal — confirm with the exact button label
        await waitForText(page, 'Cancel Request', 6_000);
        await page.getByText('Yes, Cancel').first().click();

        // ── cancel-reason screen: select a reason then click Done ─────────────
        await page.waitForURL(/cancel-reason/, { timeout: 10_000 });
        await waitForText(page, 'Before you go', 8_000);
        await page.getByText('Other').first().click();
        await page.getByText('Done').first().click();

        // Should navigate to appointments tab after Done
        await page.waitForURL(/\/(tabs\/appointments|appointments)/, { timeout: 15_000 });
    });

    // ── 15a. Verify cancellation in the backend ───────────────────────────────
    await test.step('Verify appointment is cancelled in the backend', async () => {
        // Poll the API directly (Node context) to confirm status = 'canceled'
        // Both assistance_requests and appointments are updated on cancel.
        let finalStatus = '';
        for (let i = 0; i < 10; i++) {
            const res = await fetch(`${API_URL}/api/assistance/${requestId}`);
            if (res.ok) {
                const data: any = await res.json();
                finalStatus = data.status ?? '';
                if (finalStatus === 'canceled') break;
            }
            await new Promise(r => setTimeout(r, 1_000));
        }
        console.log(`  → appointment ${requestId} final status: ${finalStatus}`);
        expect(finalStatus).toBe('canceled');
    });

    console.log('\n  ✅ Full E2E browser test passed.\n');
});
