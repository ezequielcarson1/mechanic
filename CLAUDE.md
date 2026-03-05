# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## System Overview

**Mechanic** is a monorepo with three pieces:

1. **Mobile App** — Expo + React Native + expo-router (TypeScript)
2. **Backend API** — Node.js + Express + SQLite + WebSocket
3. **Admin Portal** — React + Vite (TypeScript)

Core flow: **users** create assistance requests → **mechanics** accept → **appointments** created → real-time updates via WebSocket → optional **video-call** (Daily.co via WebView).

Two roles: `user` (client) and `mechanic`. The UI adapts per role — mechanics see the assist feed and availability toggle; users see vehicle management and request flow.

Test accounts (phone login):
- Mechanic: `(718) 871-2281`
- User (bot-assisted): `+11111111111` / `(555) 010-1234`

---

## Commands

### Mobile (Expo)
```bash
npm install
npm run start      # or: npm run ios / android / web
npm run lint
```

### Backend
```bash
cd server && npm install && node index.js
# API + WS: http://localhost:3000
```

### Admin Portal
```bash
cd admin-portal && npm install && npm run dev
# http://localhost:5173
```

### Deployment
```bash
npm run vpn      # SSH tunnel to remote Minikube (keep running; enables remote kubectl)
npm run upload   # Build, push to Azure VM, sync DB, restart pods
npm run local    # Build locally and restart Docker Desktop k8s pods
```

---

## Architecture

### Config / Endpoints (`lib/config/ConfigService.ts`)
On startup, fetches config from `https://bootstrap.mechanicapp.com/config`, caches in AsyncStorage, falls back to `DEFAULT_FALLBACK_CONFIG`. All code uses `ConfigService.getApiBaseUrl()` and `ConfigService.getWsUrl()` — never hardcode endpoints.

- PROD defaults: `http://20.124.131.193:3000` (API + WS)
- DEV defaults: `http://localhost:3000` (iOS sim) / `http://10.0.2.2:3000` (Android emulator)

If the backend returns `allowEnvSwitch: true`, an `EnvSelector` toggle appears on the Login screen. Switching env auto-reconnects the WebSocket (`SocketContext` has a listener).

### Mobile Routing (`app/`)
Expo Router file-based routing. Key entrypoints:
- `app/_layout.tsx` — root layout, all providers
- `app/(tabs)/_layout.tsx` — tab navigator (assist, appointments, chat, profile)
- `app/(tabs)/assist/` — mechanic job feed + detail
- `app/request-assistance/` — multi-step wizard for users
- `app/setup/` — multi-step registration flow
- `app/chat/[id].tsx` — real-time chat
- `app/video-lobby/[id].tsx`, `app/video-call/[id].tsx` — Daily.co video flow
- `app/appointments/[id].tsx` — appointment detail + actions

### Global State (`context/`)
- `UserContext.tsx` — current session/user
- `AppointmentsContext.tsx` — appointments list + operations
- `SocketContext.tsx` — WebSocket connection, `chatHistory`, real-time events
- `NotificationsContext.tsx` — notification UI state

### Data Layer
- `lib/api/apiClient.ts` — fetch wrapper (GET/POST/PATCH/DELETE)
- `lib/dao/` — client-side DAOs: `UserDAO`, `VehicleDAO`, `AssistanceDAO`, `AppointmentDAO`, `SetupDAO`
- `lib/dao/interfaces.ts` — shared TypeScript interfaces

Screens must use DAOs or Contexts, not raw `fetch`. For new features: add DAO method → expose in Context if global → implement backend endpoint + server DAO.

### Backend (`server/index.js`)
- REST API at `/api/*`
- WS on the same HTTP instance; clients register with `{ type: 'register', userId }`
- `notifyUser(userId, type, payload)` sends real-time events
- `server/dao/` — server-side DAOs (JS): `AssistanceDAO`, `AppointmentDAO`, `UserDAO`, `VehicleDAO`, `SetupDAO`
- SQLite at `server/mechanic.db` — schema documented in `DB.MD`

WS message types in use: `register`, `chat_message`, `assistance_update`, `video_room_ready`.

### Photo Storage (`server/s3client.js`)
- `s3rver` runs internally on `127.0.0.1:4568` (never exposed directly)
- Photos are proxied through Express: `POST /api/photos/upload` → `GET /api/photos/:key`
- Upload returns a full absolute URL (`http://<host>/api/photos/<uuid>.jpg`) — stored as JSON array in `assistance_requests.photos`
- Storage path controlled by `PHOTOS_PATH` env var (default: `path.join(__dirname, 'photos-data')`)
- K8s: PVC `photos-pvc` mounted at `/app/photos`; configmap must include `PHOTOS_PATH=/app/photos`, `S3_USE_LOCAL=true`, `S3_BUCKET=mechanic-photos`
- **Critical**: `appointments` table has no `photos` column. `AppointmentDAO.getAll()` and `getById()` must `LEFT JOIN assistance_requests ar ON a.id = ar.id` to expose `ar.photos`. Without this, `UserStatusTab` receives `null` photos even when they exist.
- Mobile upload: `AssistanceDAO.uploadPhoto(localUri)` in `lib/dao/AssistanceDAO.ts` uses `apiClient.upload()` with `FormData`. The `upload()` method on `apiClient` must NOT set `Content-Type` header manually — fetch sets it with the multipart boundary automatically.
- Max 3 photos per request (enforced in `app/request-assistance/add-details.tsx`)

### Mechanic Bot (`server/bot.js`)
- Simulates a real mechanic for test user `+11111111111` (user-id: `user-111`)
- Acts as mechanic `mech-1` (Shayna Samett — existing seed mechanic)
- Polls every 4s for pending requests from user-111 via `AssistanceDAO.getAll({ userId, status: 'pending' })`
- **Status flow**: sets `'offered'` first (NOT `'accepted'`), because `searching.tsx` listens for `status === 'offered'` to navigate to mechanic-found screen. Only after the user confirms does status become `'accepted'`.
- Bot pre-creates the `appointments` row with `status: 'offered'` so mechanic info is available on the mechanic-found screen.
- After user confirms (`assistance_requests.status → 'accepted'`), bot starts status progression: "On my way" (15s) → "Arrived" (40s) → "Diagnosing" (75s)
- Replies to chat messages directed to `mech-1` with random realistic responses (1.5–3.5s delay)
- Bot is initialized in the async startup block in `server/index.js` via `bot.init(notifyUser)`
- Bot handles WS chat messages: `bot.handleChatMessage(data)` is called from the WS message handler

### `appointments` vs `assistance_requests` tables
- Both tables share the same `id` (the assistance request ID)
- `appointments` is the "accepted/active" table; `assistance_requests` is the source of truth for request lifecycle
- When status becomes `'accepted'`, `PATCH /api/assistance/:id` also syncs the `appointments` row status
- `AppointmentsContext` on mobile uses the `appointments` table row when it exists (filtering out the duplicate `assistance_requests` entry by ID)

### Video Call Flow (Daily.co)
1. User requests video call → mechanic accepts → both go to video lobby
2. User starts call → `POST /api/video-room` creates Daily.co room (5-min expiry)
3. Server notifies mechanic via `video_room_ready` WS event (3s polling fallback)
4. Both open full-screen WebView with the room URL + countdown timer

### Admin Portal (`admin-portal/`)
SPA with react-router-dom + axios. Use `VITE_*` env vars for API URLs.

### Styling
Mobile: **NativeWind** (Tailwind classes on RN components). Base components in `components/ui/`.

---

## Conventions

- **No SQL in route handlers** — keep all SQL in server DAOs.
- **TypeScript** — avoid `any`; when unavoidable (WS parsing), encapsulate it.
- **Files to ignore** — `._*` (Apple resource forks), `node_modules/`, `.expo/`, build artifacts.
- **Minimal diffs** — prefer small targeted changes; do not refactor surrounding code.

---

## "Where to look" by task

| Task | Files |
|------|-------|
| Login / session | `app/login.tsx`, `context/UserContext.tsx`, `lib/dao/UserDAO.ts` |
| Assistance feed | `app/(tabs)/assist/`, `lib/dao/AssistanceDAO.ts`, `server/dao/AssistanceDAO.js` |
| Appointments | `app/(tabs)/appointments.tsx`, `app/appointments/`, `context/AppointmentsContext.tsx`, `server/dao/AppointmentDAO.js` |
| Chat / realtime | `app/chat/[id].tsx`, `context/SocketContext.tsx`, `server/index.js` |
| Video call | `app/video-lobby/[id].tsx`, `app/video-call/[id].tsx`, `/api/video-room*` in backend |
| DB schema | `DB.MD`, `server/mechanic.db`, `server/dao/` |
| Environment config | `lib/config/ConfigService.ts`, `context/SocketContext.tsx` |
| Photo upload/display | `app/request-assistance/add-details.tsx`, `app/request-assistance/confirmation.tsx`, `lib/dao/AssistanceDAO.ts`, `server/s3client.js`, `server/dao/AppointmentDAO.js`, `components/appointments/UserStatusTab.tsx` |
| Mechanic bot | `server/bot.js` |

---

## Kubernetes (Remote Minikube on Azure)

- **Production cluster**: Remote Minikube on Azure VM at `20.124.131.193`
- **kubeconfig**: `~/.kube/minikube-azure-config` — always prefix kubectl with `KUBECONFIG=$HOME/.kube/minikube-azure-config kubectl ...`
- **VPN tunnel**: `npm run vpn` opens SSH tunnel `localhost:8443 → remote:32776` — must be running for kubectl to work
- **Deploy**: `npm run upload` — builds linux/amd64 images, SCPs to Azure VM, loads into Minikube, syncs SQLite DB, restarts pods
- **Never** apply manifests with `kubectl apply` alone on this machine without `KUBECONFIG` set — it will attempt localhost:8080 (default kubeconfig = docker-desktop or nothing)

### Required K8s resources for photos
All three must be applied to the remote cluster for photos to work:
1. `k8s/photos-pvc.yaml` — 5Gi PVC (`photos-pvc`)
2. `k8s/configmap.yaml` — must include `PHOTOS_PATH`, `S3_USE_LOCAL`, `S3_BUCKET`
3. `k8s/server-deployment.yaml` — must mount `photos-pvc` at `/app/photos`

### DB sync behavior
`npm run upload` copies the local `server/mechanic.db` into the running pod — this overwrites the remote DB. Be careful when the remote has newer data (e.g., new user registrations or accepted appointments).
