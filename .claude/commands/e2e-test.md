Run the full end-to-end browser test for the Mechanic app using Playwright (headless Chromium).

## What this test does

Opens a real headless browser, loads the Expo web build, and drives the complete user journey across 15 steps:

| Step | Action | Key detail |
|------|--------|------------|
| 0 | Fetch test user from API | `POST /api/login` with `+11111111111` — no Firebase needed |
| 1 | Inject session into localStorage | Bypasses Firebase (native module, broken in browser) |
| 2 | Load app | Lands on main tabs already logged in |
| 3 | Open Personal Information | Navigates to `/personal-info` |
| 4 | Fill address | 956 Golden Cane Dr, Weston FL 33327 |
| 5 | Save profile | Clicks "Update Profile", closes success modal |
| 6 | Navigate to Request Assistance | `/request-assistance` |
| 7 | Choose Immediate Assistance | Clicks "IMMEDIATE ASSISTANCE" |
| 8 | Select vehicle | Matches first card by text (model/make/NO PLATE) |
| 9 | Issue selection | Fills textarea + clicks "Battery / Starting issue" chip + "Continue" |
| 10 | Add details | Fills "Type here..." + clicks "Confirm Issue" |
| 11 | Confirm location on map | Waits for `/location-map` URL, clicks "Confirm Location" |
| 12 | Submit request | Clicks "Confirm and Request", intercepts API response to capture request ID |
| 13 | Wait for bot | Polls until URL is `/mechanic-found` + "Select your best match" visible (up to 45 s) |
| 14 | Accept mechanic | Clicks "Confirm and Request", waits for `/appointments` + "accepted" status |
| 15 | Cancel request | Clicks "Cancel Request", confirms modal with "Yes, Cancel" |

## Prerequisites

Both services must be running:

```bash
# Terminal 1 — backend
cd server && node index.js

# Terminal 2 — Expo web
npm run web
```

## Steps to run

1. Verify both services are up:
   ```bash
   curl -s http://localhost:3000/health
   curl -s http://localhost:8081
   ```
   If either fails, tell the user to start the missing service first.

2. Run the test:
   ```bash
   npm run test:e2e
   ```
   For a visible browser window:
   ```bash
   npm run test:e2e:headed
   ```

3. On failure, open the HTML report (screenshots + video + traces auto-saved):
   ```bash
   npm run test:e2e:report
   ```

4. Report results clearly:
   - List each of the 15 steps with ✅ / ❌
   - For failures: read `test-results/.../test-failed-1.png` and `error-context.md` to diagnose
   - Only modify `e2e/user-flow.spec.ts` — never touch app source files to fix test issues

## Important selectors learned

- **Vehicle card**: `div` filtered by `/model|make|year|NO PLATE/i` — NOT by role/tabindex (tab bar also has those)
- **Stale DOM trap**: `getByText(/confirm/i)` matches hidden "Confirm Issue" divs from previous screens — always use **exact text** for buttons: `'Confirm and Request'`, `'Confirm Issue'`, `'Yes, Cancel'`
- **`waitForText` helper**: uses `page.getByText()` which supports RegExp natively — never use `page.locator('text=' + regex.source)`
- **Cancel modal button**: `'Yes, Cancel'` (not "Confirm" or "Yes")
- **mechanic-found screen heading**: `'Select your best match'` (not "mechanic found")

## Useful flags

```bash
APP_URL=http://192.168.1.229:8081 npm run test:e2e   # different app host
API_URL=http://20.124.131.193:3000 npm run test:e2e  # prod backend
npx playwright test --headed --debug                  # step-by-step debug
```

## Notes

- Test user `+11111111111` (user-111 / Ezequiel Carson) is a permanent seed — test requests are safe to create and cancel
- The bot (`mech-1 / Shayna Samett`) responds in ~4–8 s; step 13 allows up to 45 s
- `react-native-maps` does not render in headless Chromium — the map is blank but "Confirm Location" button is always in the DOM
- Failure artifacts saved automatically to `test-results/`
- API-only smoke test still available: `node scripts/e2e-test.js`
