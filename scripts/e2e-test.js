#!/usr/bin/env node
/**
 * E2E API Test — Mechanic App
 *
 * Flow:
 *   1. Login as test user  (+1 111-111-1111)
 *   2. Edit profile (address + zip) and verify save
 *   3. Create an immediate assistance request
 *   4. Poll until the bot mechanic (mech-1) offers the job
 *   5. Accept the offer
 *   6. Cancel the request
 *
 * Usage:
 *   node scripts/e2e-test.js
 *   API_URL=https://t9smggmz3a.us-east-1.awsapprunner.com node scripts/e2e-test.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_PHONE = '+11111111111';

// ─── helpers ────────────────────────────────────────────────────────────────

async function api(method, path, body) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) {
        throw new Error(`${method} ${path} → HTTP ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function poll(fn, { timeout = 35000, interval = 2500 } = {}) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
        const result = await fn();
        if (result !== null) return result;
        await new Promise(r => setTimeout(r, interval));
    }
    throw new Error(`Timed out after ${timeout / 1000}s waiting for condition`);
}

// ─── test runner ─────────────────────────────────────────────────────────────

const results = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
    process.stdout.write(`  ${name} … `);
    try {
        const detail = await fn();
        passed++;
        results.push({ name, ok: true, detail });
        console.log(`✅  ${detail || 'ok'}`);
    } catch (err) {
        failed++;
        results.push({ name, ok: false, detail: err.message });
        console.log(`❌  ${err.message}`);
        throw err; // abort remaining tests on first failure
    }
}

// ─── test suite ──────────────────────────────────────────────────────────────

async function run() {
    console.log(`\n🔧  Mechanic App — E2E API Test`);
    console.log(`   API: ${BASE_URL}`);
    console.log(`${'─'.repeat(60)}\n`);

    let user;
    let requestId;

    try {
        // ── 1. Login ──────────────────────────────────────────────────────
        await test('Login as test user (+1 111-111-1111)', async () => {
            user = await api('POST', '/api/login', { phone: TEST_PHONE });
            if (!user?.id) throw new Error('No user ID in response');
            return `Logged in — id: ${user.id}, name: ${user.name} ${user.surname}`;
        });

        // ── 2. Edit profile ───────────────────────────────────────────────
        await test('Edit profile (address + zip) and save', async () => {
            const patch = {
                name:    user.name    || 'Test',
                surname: user.surname || 'User',
                email:   user.email   || 'testuser@mechanic.app',
                address: {
                    street:    '956 Golden Cane Dr',
                    apartment: '',
                    city:      'Weston',
                    state:     'FL',
                    zip:       '33327',
                },
            };
            await api('PATCH', `/api/users/${user.id}`, patch);

            const updated = await api('GET', `/api/users/${user.id}`);
            const savedZip = updated?.address?.zip || updated?.zip;
            if (savedZip !== '33327') {
                throw new Error(`ZIP not persisted — got: "${savedZip}"`);
            }
            return `Saved — street: ${patch.address.street}, zip: ${savedZip}`;
        });

        // ── 3. Create assistance request ──────────────────────────────────
        await test('Create immediate assistance request', async () => {
            const payload = {
                userId:        user.id,
                type:          'immediate',
                assistanceType:'immediate',
                title:         'E2E Test — Immediate Assistance',
                address:       '956 Golden Cane Dr, Weston, FL',
                zip:           '33327',
                locationLat:   26.1003,
                locationLng:   -80.3997,
                status:        'pending',
                notes:         'Automated E2E test — safe to discard',
                date:          new Date().toISOString(),
            };
            const req = await api('POST', '/api/assistance', payload);
            if (!req?.id) throw new Error('No request ID in response');
            requestId = req.id;
            return `Created — id: ${requestId}`;
        });

        // ── 4. Wait for bot offer ─────────────────────────────────────────
        await test('Wait for bot mechanic to offer (≤35 s)', async () => {
            const req = await poll(async () => {
                const r = await api('GET', `/api/assistance/${requestId}`);
                return r?.status === 'offered' ? r : null;
            });
            return `Bot offered — mechanic: ${req.mechanicId}`;
        });

        // ── 5. Accept the offer ───────────────────────────────────────────
        await test('Accept the bot offer (user confirms)', async () => {
            await api('PATCH', `/api/assistance/${requestId}`, {
                status:     'accepted',
                mechanicId: 'mech-1',
            });
            const r = await api('GET', `/api/assistance/${requestId}`);
            if (r?.status !== 'accepted') {
                throw new Error(`Expected "accepted", got "${r?.status}"`);
            }
            return `Status → accepted`;
        });

        // ── 6. Cancel the request ─────────────────────────────────────────
        await test('Cancel the assistance request', async () => {
            await api('PATCH', `/api/assistance/${requestId}`, {
                status:     'canceled',
                mechanicId: 'mech-1',
            });
            const r = await api('GET', `/api/assistance/${requestId}`);
            if (r?.status !== 'canceled') {
                throw new Error(`Expected "canceled", got "${r?.status}"`);
            }
            return `Status → canceled`;
        });

    } catch {
        // First failure already logged; remaining tests skipped
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n${'─'.repeat(60)}`);
    if (failed === 0) {
        console.log(`✅  All ${passed} tests passed.`);
    } else {
        console.log(`❌  ${failed} of ${passed + failed} tests failed.\n`);
        results.filter(r => !r.ok).forEach(r => {
            console.log(`   • ${r.name}`);
            console.log(`     ${r.detail}`);
        });
    }
    console.log(`${'─'.repeat(60)}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
    console.error('\nUnexpected error:', err.message);
    process.exit(1);
});
