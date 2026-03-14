require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

const DAILY_API_KEY = process.env.DAILY_API_KEY;
if (!DAILY_API_KEY) throw new Error('Missing env var: DAILY_API_KEY');
const DAILY_API_URL = 'https://api.daily.co/v1';
const BOT_DURATION_MS = 2 * 60 * 1000; // 2 minutes

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/join', async (req, res) => {
    const { roomUrl, roomName } = req.body;
    if (!roomUrl || !roomName) {
        return res.status(400).json({ error: 'roomUrl and roomName are required' });
    }

    console.log(`[VIDEO-BOT] /join called for room "${roomName}"`);

    // Respond immediately — bot session runs in the background
    res.json({ success: true });

    _runBotSession(roomUrl, roomName).catch(err => {
        console.error('[VIDEO-BOT] Session error:', err.message);
    });
});

// Each session gets a unique virtual display number to avoid conflicts
let displayCounter = 99;

async function _runBotSession(roomUrl, roomName) {
    const puppeteer = require('puppeteer-core');
    const displayNum = displayCounter++;

    // Create a meeting token so the bot appears as "Mechanic"
    let token = null;
    try {
        const tokenResp = await fetch(`${DAILY_API_URL}/meeting-tokens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`,
            },
            body: JSON.stringify({
                properties: {
                    room_name: roomName,
                    user_name: 'Mechanic',
                    start_video_off: false,
                    start_audio_off: false,
                },
            }),
        });
        if (tokenResp.ok) {
            const data = await tokenResp.json();
            token = data.token;
            console.log(`[VIDEO-BOT] Token created for room "${roomName}"`);
        } else {
            const err = await tokenResp.json().catch(() => ({}));
            console.warn('[VIDEO-BOT] Token creation failed:', JSON.stringify(err));
        }
    } catch (e) {
        console.warn('[VIDEO-BOT] Could not create token:', e.message);
    }

    // Start a virtual display — non-headless Chrome needs a display for WebRTC
    console.log(`[VIDEO-BOT] Starting Xvfb on display :${displayNum}...`);
    const xvfb = spawn('Xvfb', [`:${displayNum}`, '-screen', '0', '1280x720x24', '-ac'], {
        detached: true,
        stdio: 'ignore',
    });
    xvfb.unref();
    await new Promise(resolve => setTimeout(resolve, 1000)); // let Xvfb initialise

    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
            '--autoplay-policy=no-user-gesture-required',
            '--disable-features=WebRtcHideLocalIpsWithMdns',
        ],
        headless: false,
        env: { ...process.env, DISPLAY: `:${displayNum}` },
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });

        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[VIDEO-BOT:browser] ${msg.text()}`);
        });

        // Navigate directly to the Daily.co HTTPS room URL — secure context enables WebRTC
        const joinUrl = token ? `${roomUrl}?t=${token}` : roomUrl;
        console.log(`[VIDEO-BOT] Navigating to Daily.co room...`);
        await page.goto(joinUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for page to render, then click the "Join" button
        await page.waitForSelector('button', { timeout: 15000 });
        await new Promise(r => setTimeout(r, 2000)); // let pre-join UI settle

        const clicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const joinBtn = btns.find(b => /join/i.test(b.textContent || ''));
            if (joinBtn) { joinBtn.click(); return true; }
            return false;
        });

        if (clicked) console.log(`[VIDEO-BOT] ✓ Clicked "Join" — bot entering room "${roomName}"`);
        else console.log(`[VIDEO-BOT] No "Join" button found — may have auto-joined`);

        // Allow WebRTC connection to establish
        await new Promise(r => setTimeout(r, 3000));
        console.log(`[VIDEO-BOT] ✓ Bot is live in room "${roomName}" as "Mechanic"`);

        // Stay in the call for 2 minutes
        await new Promise(resolve => setTimeout(resolve, BOT_DURATION_MS));

    } finally {
        try { await browser.close(); } catch (e) {}
        try { xvfb.kill(); } catch (e) {}
        console.log(`[VIDEO-BOT] Browser closed — bot left room "${roomName}"`);
    }

    // Delete the Daily.co room — disconnects all remaining participants
    try {
        const resp = await fetch(`${DAILY_API_URL}/rooms/${roomName}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${DAILY_API_KEY}` },
        });
        if (resp.ok) console.log(`[VIDEO-BOT] Room "${roomName}" deleted`);
        else console.warn(`[VIDEO-BOT] Could not delete room "${roomName}"`);
    } catch (e) {
        console.error('[VIDEO-BOT] Error deleting room:', e.message);
    }
}

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VIDEO-BOT] Service running on port ${PORT}`);
});
