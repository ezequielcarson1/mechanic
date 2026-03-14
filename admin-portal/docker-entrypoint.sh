#!/bin/sh
set -e

# Inject runtime API URL into the SPA before nginx starts.
# Set API_BASE_URL env var per environment:
#   Railway: API_BASE_URL=https://mechanic-production-e8ce.up.railway.app/api
#   K8s:     API_BASE_URL=http://server:3000/api
#   Local:   API_BASE_URL=http://localhost:3000/api (default)
printf 'window.__ENV__ = { "API_BASE_URL": "%s" };\n' \
    "${API_BASE_URL:-http://localhost:3000/api}" \
    > /usr/share/nginx/html/env.js

exec nginx -g "daemon off;"
