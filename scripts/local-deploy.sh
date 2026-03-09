#!/bin/bash
set -e

echo "🔧 Local deploy starting..."

# 1. Point admin portal dev server at local backend
echo "ADMIN_API_TARGET=http://192.168.1.229:3000" > admin-portal/.env.local

# 2. Sync prod users into local DB
bash ./scripts/sync-users-from-prod.sh

# 3. Build images
echo "📦 Building server image..."
docker build -t mechanic-server:latest ./server

echo "📦 Building admin portal image..."
docker build -t mechanic-admin-portal:latest ./admin-portal

# 4. Restart pods
kubectl rollout restart deployment mechanic-server -n mechanic
kubectl rollout restart deployment mechanic-admin -n mechanic

# 5. Wait for both pods to be ready
echo "⏳ Waiting for server pod to be ready..."
kubectl rollout status deployment mechanic-server -n mechanic --timeout=60s

echo "⏳ Waiting for admin portal pod to be ready..."
kubectl rollout status deployment mechanic-admin -n mechanic --timeout=60s

# 6. Copy local DB into the running pod (overrides the PVC contents)
SERVER_POD=$(kubectl get pods -n mechanic -l app=mechanic-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)
if [ -n "$SERVER_POD" ]; then
  echo "🗄️  Copying mechanic.db into pod $SERVER_POD..."
  kubectl cp server/mechanic.db mechanic/$SERVER_POD:/app/db/mechanic.db
  # Restart so the server reloads the DB connection
  kubectl rollout restart deployment mechanic-server -n mechanic
  kubectl rollout status deployment mechanic-server -n mechanic --timeout=60s
  echo "✅ Database synced and server reloaded."
else
  echo "⚠️  No running server pod found — DB not copied."
fi

echo ""
echo "✅ Local deploy complete!"
