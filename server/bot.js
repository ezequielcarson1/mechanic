/**
 * Test Mechanic Bot
 *
 * Simulates a real mechanic for the test user (+11111111111 / user-111).
 * Only activates when requests come from that specific user.
 *
 * Behaviour:
 *  - Polls every 4 s for pending assistance requests from the test user
 *  - Accepts within 2–4 s (simulates a mechanic reviewing the job)
 *  - Creates an appointment entry and notifies the user via WebSocket
 *  - Progresses currentStatus automatically ("On my way" → "Arrived" → "Diagnosing")
 *  - Replies to every chat message sent to the bot mechanic with a realistic response
 */

const AssistanceDAO = require('./dao/AssistanceDAO');
const AppointmentDAO = require('./dao/AppointmentDAO');
const UserDAO = require('./dao/UserDAO');

const TEST_USER_PHONE = '+11111111111';
const BOT_MECHANIC_ID = 'mech-1'; // Shayna Samett — existing seed mechanic
const POLL_INTERVAL_MS = 4000;

const BOT_CHAT_REPLIES = [
    "On my way! Should be there in about 15 minutes.",
    "Got it, I'll take care of that right away.",
    "No problem, I have the parts for this job.",
    "Understood, heading your way now!",
    "Thanks for the details. Starting to drive over.",
    "I've seen this issue before — shouldn't take long.",
    "Just leaving now, traffic looks light. Be there soon!",
    "Can you make sure the car is accessible when I arrive?",
    "Almost there, about 5 minutes away!",
    "Noted. I'll bring all the tools needed for this.",
];

// Status updates pushed automatically after acceptance
const STATUS_PROGRESSION = [
    { delayMs: 15000, status: 'On my way to your location' },
    { delayMs: 40000, status: 'Arrived at location' },
    { delayMs: 75000, status: 'Diagnosing the issue' },
];

class MechanicBot {
    constructor() {
        this.notifyUser = null;
        this.testUserId = null;
        this.inProgress = new Set(); // request IDs currently being handled
    }

    async init(notifyUserFn) {
        this.notifyUser = notifyUserFn;

        try {
            const user = await UserDAO.getByPhone(TEST_USER_PHONE);
            if (!user) {
                console.log(`[BOT] Test user (${TEST_USER_PHONE}) not found — bot inactive`);
                return;
            }
            this.testUserId = user.id;
            console.log(`[BOT] Mechanic bot active — watching for requests from user "${user.name} ${user.surname}" (${this.testUserId}), acting as mechanic ${BOT_MECHANIC_ID}`);
        } catch (err) {
            console.error('[BOT] Init failed:', err.message);
            return;
        }

        setInterval(() => this._poll(), POLL_INTERVAL_MS);
    }

    // ─── Chat handler (called from WS message handler in index.js) ───────────

    handleChatMessage(data) {
        if (data.recipientId !== BOT_MECHANIC_ID) return;

        const delay = 1500 + Math.random() * 2000;
        setTimeout(() => {
            const text = BOT_CHAT_REPLIES[Math.floor(Math.random() * BOT_CHAT_REPLIES.length)];
            this.notifyUser(data.senderId, 'chat_message', {
                senderId: BOT_MECHANIC_ID,
                recipientId: data.senderId,
                conversationId: data.conversationId,
                text,
                timestamp: new Date().toISOString(),
            });
            console.log(`[BOT] Replied to chat in conversation ${data.conversationId}: "${text}"`);
        }, delay);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    async _poll() {
        if (!this.testUserId) return;
        try {
            const pending = await AssistanceDAO.getAll({ userId: this.testUserId, status: 'pending' });
            for (const req of pending) {
                // Skip if already being handled or already assigned to a mechanic
                if (this.inProgress.has(req.id)) continue;
                if (req.mechanicId && req.mechanicId.trim() !== '') continue;

                this.inProgress.add(req.id);
                const reviewDelay = 2000 + Math.random() * 2000;
                setTimeout(() => this._accept(req), reviewDelay);
            }
        } catch (err) {
            console.error('[BOT] Poll error:', err.message);
        }
    }

    // Polls until the user confirms (status → 'accepted'), then runs status progression
    _watchForConfirmation(req, attempts = 0) {
        if (attempts > 60) return; // stop after ~5 min
        setTimeout(async () => {
            try {
                const current = await AssistanceDAO.getById(req.id);
                if (!current || current.status === 'canceled') return;
                if (current.status !== 'accepted') {
                    return this._watchForConfirmation(req, attempts + 1);
                }
                // User confirmed — start status progression
                console.log(`[BOT] User confirmed request ${req.id} — starting status progression`);
                for (const step of STATUS_PROGRESSION) {
                    setTimeout(async () => {
                        try {
                            await AppointmentDAO.update(req.id, { currentStatus: step.status, isStatusUpdated: 1 });
                            this.notifyUser(req.userId, 'assistance_update', {
                                requestId: req.id,
                                status: 'accepted',
                                mechanicId: BOT_MECHANIC_ID,
                            });
                            console.log(`[BOT] Status → "${step.status}" for ${req.id}`);
                        } catch (err) {
                            console.error('[BOT] Status progression error:', err.message);
                        }
                    }, step.delayMs);
                }
            } catch (err) {
                console.error('[BOT] Confirmation watch error:', err.message);
            }
        }, 5000); // check every 5s
    }

    async _accept(req) {
        try {
            const now = new Date().toISOString();

            // 1. Set status to 'offered' — this is what the searching screen listens for.
            //    The real mechanic flow also uses 'offered' first; the user then confirms
            //    on the mechanic-found screen which sets it to 'accepted'.
            await AssistanceDAO.updateStatus(req.id, BOT_MECHANIC_ID, 'offered');

            // 2. Pre-create the appointment record so mechanic info is available when
            //    the user lands on the mechanic-found screen (mirrors assist/[id].tsx).
            await AppointmentDAO.create({
                id: req.id,
                type: req.type || 'immediate',
                assistanceType: req.assistanceType || req.type || 'immediate',
                title: req.title || 'Assistance Request',
                car: req.car || '',
                address: req.address || '',
                zip: req.zip || '',
                notes: req.notes || '',
                budget: req.budget || 'TBD',
                status: 'offered',
                date: 'Today',
                time: 'Now',
                userId: req.userId,
                mechanicId: BOT_MECHANIC_ID,
                acceptedAt: now,
                currentStatus: 'Mechanic assigned',
                isStatusUpdated: 1,
            });

            // 3. Notify with 'offered' — triggers searching.tsx → mechanic-found screen
            this.notifyUser(req.userId, 'assistance_update', {
                requestId: req.id,
                status: 'offered',
                mechanicId: BOT_MECHANIC_ID,
            });

            console.log(`[BOT] Offered request ${req.id} (type: ${req.type}) — waiting for user confirmation`);

            // 4. Watch for user confirmation (status → 'accepted'), then push status progression
            this._watchForConfirmation(req);
        } catch (err) {
            console.error(`[BOT] Failed to accept request ${req.id}:`, err.message);
            this.inProgress.delete(req.id); // allow retry on next poll
        }
    }
}

module.exports = new MechanicBot();
