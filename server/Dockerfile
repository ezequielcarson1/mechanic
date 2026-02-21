# ── Backend Server ──────────────────────────────────────────────────
# Node.js / Express + SQLite + WebSocket
FROM node:20-alpine

# Install build tools needed for native sqlite3 bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy application source
COPY . .

# Expose HTTP + WebSocket port
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
