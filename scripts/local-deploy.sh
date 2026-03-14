#!/bin/bash
set -e

echo "🔧 Local deploy starting..."

# 1. Point admin portal dev server at local backend
echo "ADMIN_API_TARGET=http://192.168.1.229:3000" > admin-portal/.env.local

# 2. Sync prod users from Railway into local DB
bash ./scripts/sync-users-from-prod.sh

# 3. Build images
echo "📦 Building server image..."
docker build -t mechanic-server:latest ./server

echo "📦 Building admin portal image..."
docker build -t mechanic-admin-portal:latest ./admin-portal

echo ""
echo "✅ Local deploy complete!"
echo "   Images built: mechanic-server:latest, mechanic-admin-portal:latest"
echo "   Run 'cd server && node index.js' to start the backend locally."
