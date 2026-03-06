FROM node:20-alpine

# Chromium + Xvfb (virtual display) — required for WebRTC support in a container
RUN apk add --no-cache \
    chromium nss freetype harfbuzz ca-certificates ttf-freefont \
    xvfb dbus

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3002

CMD ["node", "index.js"]
