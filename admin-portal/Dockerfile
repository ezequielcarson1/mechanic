# ── Admin Portal ────────────────────────────────────────────────────
# Multi-stage build: build Vite/React app, then serve with nginx.
# API_BASE_URL is injected at container startup (not build time),
# so the same image works on Railway, K8s, and local dev.

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npx vite build

# Stage 2: Serve with nginx
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Static nginx config (no upstream proxy — SPA calls the API directly)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Entrypoint: writes /env.js from API_BASE_URL env var, then starts nginx
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
