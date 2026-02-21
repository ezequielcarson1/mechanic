# ── Admin Portal ────────────────────────────────────────────────────
# Multi-stage build: build Vite/React app, then serve with nginx

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

# Nginx config that handles SPA client-side routing and
# proxies /api and /ws calls to the backend server
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
