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
- User: `(555) 010-1234`

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
