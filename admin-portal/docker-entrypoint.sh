#!/bin/sh
set -e

# Railway injects $PORT; default to 80 for K8s/local
LISTEN_PORT="${PORT:-80}"

# Inject runtime API URL into the SPA
printf 'window.__ENV__ = { "API_BASE_URL": "%s" };\n' \
    "${API_BASE_URL:-http://localhost:3000/api}" \
    > /usr/share/nginx/html/env.js

# Write nginx config with the correct port
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen ${LISTEN_PORT};
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

exec nginx -g "daemon off;"
