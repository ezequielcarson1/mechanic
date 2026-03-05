const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { startS3rver, createS3Client, S3_BUCKET } = require('./s3client');
const bot = require('./bot');
const AssistanceDAO = require('./dao/AssistanceDAO');
const AppointmentDAO = require('./dao/AppointmentDAO');
const UserDAO = require('./dao/UserDAO');
const SetupDAO = require('./dao/SetupDAO');
const VehicleDAO = require('./dao/VehicleDAO');

// WebSocket Setup
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;
const logFilePath = path.join(__dirname, 'server.log');

// S3 client — initialized after s3rver starts (see bottom async block)
let s3;

// Multer: store uploads in memory, max 10 MB per file
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Map to store active connections: userId -> WebSocket
const clients = new Map();

wss.on('connection', (ws) => {
    logMessage('INFO', 'Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Client registers with their userId
            if (data.type === 'register' && data.userId) {
                clients.set(data.userId, ws);
                ws.userId = data.userId;
                logMessage('INFO', `Registered user: ${data.userId}`);
            }

            // Relay chat messages
            if (data.type === 'chat_message' && data.recipientId) {
                console.log(`[CHAT_DEBUG] Received message from ${data.senderId} for ${data.recipientId}: "${data.text?.substring(0, 20)}..."`);
                logMessage('INFO', `Relaying chat message from ${data.senderId} to ${data.recipientId}`);
                notifyUser(data.recipientId, 'chat_message', {
                    senderId: data.senderId,
                    conversationId: data.conversationId,
                    text: data.text,
                    timestamp: new Date().toISOString()
                });
                // Let the bot mechanic auto-reply if it's the recipient
                bot.handleChatMessage(data);
            }
        } catch (e) {
            console.error('Failed to parse message', e);
        }
    });

    ws.on('close', () => {
        if (ws.userId) {
            clients.delete(ws.userId);
            logMessage('INFO', `Client disconnected: ${ws.userId}`);
        }
    });

    // Send a ping every 30s to keep connection alive
    const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        } else {
            clearInterval(interval);
        }
    }, 30000);
});

// Helper to notify a user via WebSocket
// Helper to notify a user via WebSocket
const notifyUser = (userId, type, payload) => {
    console.log(`[DEBUG] notifyUser called for userIdStr: "${userId}" (type: ${typeof userId})`);

    // Log all connected clients for debugging
    console.log(`[DEBUG] Connected clients: ${Array.from(clients.keys()).join(', ')}`);

    // Ensure we are comparing strings
    const client = clients.get(String(userId));
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, payload }));
        logMessage('INFO', `Notification sent to user ${userId}`, type);
    } else {
        logMessage('INFO', `User ${userId} not connected (in map: ${clients.has(String(userId))}), notification skipped`);
    }
};

// Logging helper
const logMessage = (type, message, detail = '') => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type}] ${message} ${detail}\n`;
    console.log(logEntry.trim());
    try {
        fs.appendFileSync(logFilePath, logEntry);
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
};

// Prevent server crash on unhandled errors
process.on('uncaughtException', (err) => {
    logMessage('CRITICAL', 'Uncaught Exception', err.stack || err);
});

process.on('unhandledRejection', (reason, promise) => {
    logMessage('CRITICAL', 'Unhandled Rejection at promise', reason.stack || reason);
});

// Middleware to log all requests
app.use((req, res, next) => {
    logMessage('INFO', `${req.method} ${req.url}`);
    next();
});

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Health Check Route for Kubernetes Probes
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Assistance Routes
app.get('/api/assistance', async (req, res) => {
    try {
        const { userId, mechanicId, status, zip } = req.query;
        const requests = await AssistanceDAO.getAll({ userId, mechanicId, status, zip });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/assistance/:id', async (req, res) => {
    try {
        const request = await AssistanceDAO.getById(req.params.id);
        if (!request) return res.status(404).json({ error: 'Assistance request not found' });
        res.json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/assistance', async (req, res) => {
    try {
        const request = await AssistanceDAO.create(req.body);
        res.status(201).json(request);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/assistance/:id', async (req, res) => {
    try {
        const { mechanicId, status } = req.body;
        await AssistanceDAO.updateStatus(req.params.id, mechanicId, status);

        // If the user confirmed a bot-offered appointment, sync the appointments table row
        // so the list shows 'accepted' instead of the pre-created 'offered' status
        if (status === 'accepted') {
            const existing = await AppointmentDAO.getById(req.params.id);
            if (existing) {
                await AppointmentDAO.update(req.params.id, { status: 'accepted' });
            }
        }

        // Notify the user who created the request about the status change
        const request = await AssistanceDAO.getById(req.params.id);
        if (request && request.userId) {
            notifyUser(request.userId, 'assistance_update', {
                requestId: req.params.id,
                status,
                mechanicId
            });
        }

        // Also notify the mechanic when user confirms (status === 'accepted')
        if (status === 'accepted' && mechanicId) {
            notifyUser(mechanicId, 'assistance_update', {
                requestId: req.params.id,
                status,
                mechanicId
            });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/assistance/all', async (req, res) => {
    try {
        await AssistanceDAO.deleteAll();
        res.json({ success: true, message: 'All assistance requests deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/assistance/:id', async (req, res) => {
    try {
        await AssistanceDAO.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Appointment Routes
app.get('/api/appointments', async (req, res) => {
    try {
        const { userId, mechanicId } = req.query;
        const appointments = await AppointmentDAO.getAll({ userId, mechanicId });
        res.json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    try {
        const appointment = await AppointmentDAO.create(req.body);
        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/appointments/:id', async (req, res) => {
    try {
        const { status } = req.body;
        console.log(`[DEBUG] PATCH /api/appointments/${req.params.id} body:`, req.body);

        await AppointmentDAO.update(req.params.id, req.body);

        // If canceling, notify the mechanic
        if (status === 'canceled') {
            console.log(`[DEBUG] Status is canceled. Fetching appointment details...`);
            let appointment = await AppointmentDAO.getById(req.params.id);

            if (!appointment) {
                console.log(`[DEBUG] Not found in appointments table. Checking assistance_requests...`);
                appointment = await AssistanceDAO.getById(req.params.id);
            }

            console.log(`[DEBUG] Appointment details found:`, appointment ? `ID: ${appointment.id}, Mechanic: ${appointment.mechanicId}` : 'null');

            if (appointment && appointment.mechanicId) {
                console.log(`[DEBUG] Notifying mechanic ${appointment.mechanicId} of cancellation`);
                notifyUser(appointment.mechanicId, 'assistance_update', {
                    requestId: req.params.id,
                    status: 'canceled',
                    mechanicId: appointment.mechanicId // Include this so client can verify
                });
            } else {
                console.log(`[DEBUG] Cannot notify mechanic: Missing appointment or mechanicId`);
            }
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/appointments/all', async (req, res) => {
    try {
        await AppointmentDAO.deleteAll();
        res.json({ success: true, message: 'All appointments deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/appointments/:id', async (req, res) => {
    try {
        await AppointmentDAO.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== Daily.co Video Room Routes ==================
const DAILY_API_KEY = '7474b4512937a965a2f3d2e9861da062706161381786fb356c6fb12fbabad50c';
const DAILY_API_URL = 'https://api.daily.co/v1';

// Create a video room for an appointment
app.post('/api/video-room', async (req, res) => {
    try {
        const { appointmentId } = req.body;
        if (!appointmentId) {
            return res.status(400).json({ error: 'appointmentId is required' });
        }

        // Check if appointment exists
        let appointment = await AppointmentDAO.getById(appointmentId);
        let isAssistanceRequest = false;
        if (!appointment) {
            // Also check assistance_requests table
            appointment = await AssistanceDAO.getById(appointmentId);
            isAssistanceRequest = true;
        }
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        // If a room already exists and hasn't expired, return it
        if (appointment.videoRoomUrl) {
            const roomExpiry = appointment.videoRoomExpiry ? Number(appointment.videoRoomExpiry) : 0;
            if (roomExpiry > Math.floor(Date.now() / 1000)) {
                logMessage('INFO', `Returning existing video room for appointment ${appointmentId}`);
                return res.json({
                    roomUrl: appointment.videoRoomUrl,
                    roomName: appointment.videoRoomName,
                    expiry: roomExpiry
                });
            }
        }

        // Create a new Daily.co room with 5-minute expiry
        const roomName = `mechanic-${appointmentId.substring(0, 8)}-${Date.now()}`;
        const expiry = Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutes from now

        const dailyResponse = await fetch(`${DAILY_API_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${DAILY_API_KEY}`
            },
            body: JSON.stringify({
                name: roomName,
                properties: {
                    exp: expiry,
                    enable_chat: true,
                    enable_screenshare: false,
                    enable_knocking: false,
                    start_video_off: false,
                    start_audio_off: false
                }
            })
        });

        if (!dailyResponse.ok) {
            const errorData = await dailyResponse.json().catch(() => ({}));
            logMessage('ERROR', 'Daily.co room creation failed', JSON.stringify(errorData));
            return res.status(500).json({ error: 'Failed to create video room', details: errorData });
        }

        const roomData = await dailyResponse.json();
        logMessage('INFO', `Created Daily.co room: ${roomData.url}`, `Expires: ${new Date(expiry * 1000).toISOString()}`);

        // Store room details on the correct table
        const roomUpdate = {
            videoRoomUrl: roomData.url,
            videoRoomName: roomData.name,
            videoRoomExpiry: String(expiry)
        };

        if (isAssistanceRequest) {
            // AssistanceDAO doesn't have a generic update, use raw SQL
            const db = require('./db');
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE assistance_requests SET videoRoomUrl = ?, videoRoomName = ?, videoRoomExpiry = ? WHERE id = ?',
                    [roomData.url, roomData.name, String(expiry), appointmentId],
                    (err) => err ? reject(err) : resolve()
                );
            });
        } else {
            await AppointmentDAO.update(appointmentId, roomUpdate);
        }

        // Notify the other participant via WebSocket
        const targetUserId = appointment.mechanicId || appointment.userId;
        if (targetUserId) {
            // Notify mechanic if user created room, or user if mechanic created room
            if (appointment.mechanicId) {
                notifyUser(appointment.mechanicId, 'video_room_ready', {
                    appointmentId,
                    roomUrl: roomData.url,
                    roomName: roomData.name,
                    expiry
                });
            }
            if (appointment.userId) {
                notifyUser(appointment.userId, 'video_room_ready', {
                    appointmentId,
                    roomUrl: roomData.url,
                    roomName: roomData.name,
                    expiry
                });
            }
        }

        res.status(201).json({
            roomUrl: roomData.url,
            roomName: roomData.name,
            expiry
        });
    } catch (err) {
        logMessage('ERROR', 'Video room creation error', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Get video room info for an appointment
app.get('/api/video-room/:appointmentId', async (req, res) => {
    try {
        let appointment = await AppointmentDAO.getById(req.params.appointmentId);
        if (!appointment) {
            appointment = await AssistanceDAO.getById(req.params.appointmentId);
        }
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        if (!appointment.videoRoomUrl) {
            return res.status(404).json({ error: 'No video room exists for this appointment' });
        }

        const roomExpiry = appointment.videoRoomExpiry ? Number(appointment.videoRoomExpiry) : 0;
        const isExpired = roomExpiry <= Math.floor(Date.now() / 1000);

        res.json({
            roomUrl: appointment.videoRoomUrl,
            roomName: appointment.videoRoomName,
            expiry: roomExpiry,
            isExpired
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User Routes
app.get('/api/users/check-phone/:phone', async (req, res) => {
    try {
        const user = await UserDAO.getByPhone(req.params.phone);
        res.json({ exists: !!user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const user = await UserDAO.create(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { phone } = req.body;
        const user = await UserDAO.getByPhone(phone);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const { role } = req.query;
        const users = await UserDAO.getAll(role);
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await UserDAO.getById(req.params.id);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/users/:id', async (req, res) => {
    try {
        await UserDAO.update(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await UserDAO.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vehicle Routes
app.get('/api/vehicles/:userId', async (req, res) => {
    try {
        const vehicles = await VehicleDAO.getByUser(req.params.userId);
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vehicles', async (req, res) => {
    try {
        const vehicle = await VehicleDAO.create(req.body);
        res.status(201).json(vehicle);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/vehicles/:id', async (req, res) => {
    try {
        await VehicleDAO.update(req.params.id, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        await VehicleDAO.delete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ================== Photo Storage Routes (S3 / s3rver) ==================

// Upload a photo — returns { key, url }
app.post('/api/photos/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
        const key = `${crypto.randomUUID()}.${ext}`;

        await s3.send(new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        }));

        const url = `${req.protocol}://${req.get('host')}/api/photos/${key}`;
        logMessage('INFO', `Photo uploaded: ${key}`);
        res.status(201).json({ key, url });
    } catch (err) {
        logMessage('ERROR', 'Photo upload failed', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Retrieve a photo by key — streams the file back
app.get('/api/photos/:key', async (req, res) => {
    try {
        const { Body, ContentType } = await s3.send(new GetObjectCommand({
            Bucket: S3_BUCKET,
            Key: req.params.key,
        }));

        res.setHeader('Content-Type', ContentType || 'image/jpeg');
        Body.pipe(res);
    } catch (err) {
        if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
            return res.status(404).json({ error: 'Photo not found' });
        }
        logMessage('ERROR', 'Photo retrieval failed', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Setup Routes
app.get('/api/setup/:key', async (req, res) => {
    try {
        const data = await SetupDAO.getProgress(req.params.key);
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/setup/:key', async (req, res) => {
    try {
        await SetupDAO.saveProgress(req.params.key, req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

(async () => {
    // Start local S3-compatible server before accepting requests
    await startS3rver();
    s3 = createS3Client();

    // Start test mechanic bot (only activates for test user +11111111111)
    await bot.init(notifyUser);

    server.listen(PORT, '0.0.0.0', () => {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        const addresses = [];
        for (const k in interfaces) {
            for (const k2 in interfaces[k]) {
                const address = interfaces[k][k2];
                if (address.family === 'IPv4' && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        console.log(`Server running on port ${PORT}`);
        console.log(`Accessible at:`);
        console.log(`  http://localhost:${PORT}`);
        addresses.forEach(addr => console.log(`  http://${addr}:${PORT}`));
    });
})();
