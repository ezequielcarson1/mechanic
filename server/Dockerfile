# ── Backend Server ──────────────────────────────────────────────────
# Node.js / Express + SQLite + WebSocket
FROM node:20-alpine

# Build tools needed for native sqlite3 bindings
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first to leverage Docker layer caching
COPY package.json package-lock.json ./

RUN npm ci --omit=dev

# Copy application source (includes mechanic.db as the seed DB)
COPY . .

RUN chmod +x /app/entrypoint.sh

# Expose HTTP + WebSocket port
EXPOSE 3000

# entrypoint seeds DB_PATH volume on first boot (or when FORCE_DB_SEED=1)
CMD ["/app/entrypoint.sh"]
