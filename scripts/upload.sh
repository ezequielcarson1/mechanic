#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Remote Upload & Sync Process for Azure Minikube..."

# Variables for the remote server
REMOTE_USER="usuarioifx1"
REMOTE_HOST="minikube"

KUBE_CONFIG="$HOME/.kube/minikube-azure-config"
RKUBECTL="kubectl --kubeconfig=$KUBE_CONFIG"

if [ "$UPLOAD_ALL" = "true" ]; then
  echo "🎬 UPLOAD_ALL=true — video-bot image will be included."
else
  echo "ℹ️  Skipping video-bot image (run 'npm run upload_all' to include it)."
fi

echo "📦 [1/3] Building and synchronizing Server container (linux/amd64)..."
cd server
docker build --platform linux/amd64 -t mechanic-server:latest .
cd ..

echo "   -> Saving and compressing Server image locally..."
docker save mechanic-server:latest | gzip > server-img.tar.gz

echo "   -> Uploading Server image to Azure ($REMOTE_HOST)..."
scp server-img.tar.gz $REMOTE_USER@$REMOTE_HOST:~/server-img.tar.gz

echo "   -> Loading Server image directly into remote Minikube container..."
ssh $REMOTE_USER@$REMOTE_HOST "gunzip -c ~/server-img.tar.gz | docker exec -i minikube docker load && rm ~/server-img.tar.gz"
rm server-img.tar.gz
echo "✅ Server image updated remotely!"

if [ "$UPLOAD_ALL" = "true" ]; then
  echo "📦 [2/3] Building and synchronizing Video Bot container (linux/amd64)..."
  cd video-bot
  docker build --platform linux/amd64 -t mechanic-video-bot:latest .
  cd ..

  echo "   -> Saving and compressing Video Bot image locally..."
  docker save mechanic-video-bot:latest | gzip > video-bot-img.tar.gz

  echo "   -> Uploading Video Bot image to Azure ($REMOTE_HOST)..."
  scp video-bot-img.tar.gz $REMOTE_USER@$REMOTE_HOST:~/video-bot-img.tar.gz

  echo "   -> Loading Video Bot image into remote Minikube..."
  ssh $REMOTE_USER@$REMOTE_HOST "gunzip -c ~/video-bot-img.tar.gz | docker exec -i minikube docker load && rm ~/video-bot-img.tar.gz"
  rm video-bot-img.tar.gz
  echo "✅ Video Bot image updated remotely!"

  echo "📋 Applying Video Bot K8s manifests..."
  $RKUBECTL apply -f k8s/video-bot-service.yaml
  $RKUBECTL apply -f k8s/video-bot-deployment.yaml
fi

echo "📦 [3/3] Building and synchronizing Admin Portal container (linux/amd64)..."
echo "ADMIN_API_TARGET=http://20.124.131.193:3000" > admin-portal/.env.local
cd admin-portal
docker build --platform linux/amd64 -t mechanic-admin-portal:latest .
cd ..

echo "   -> Saving and compressing Admin Portal image locally..."
docker save mechanic-admin-portal:latest | gzip > admin-img.tar.gz

echo "   -> Uploading Admin Portal image to Azure ($REMOTE_HOST)..."
scp admin-img.tar.gz $REMOTE_USER@$REMOTE_HOST:~/admin-img.tar.gz

echo "   -> Loading Admin Portal image directly into remote Minikube container..."
ssh $REMOTE_USER@$REMOTE_HOST "gunzip -c ~/admin-img.tar.gz | docker exec -i minikube docker load && rm ~/admin-img.tar.gz"
rm admin-img.tar.gz
echo "✅ Admin Portal image updated remotely!"

echo "🗄️  Synchronizing SQLite Database..."
SERVER_POD=$($RKUBECTL get pods -n mechanic -l app=mechanic-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)

if [ -n "$SERVER_POD" ]; then
  echo "📥 Copying server/mechanic.db to pod $SERVER_POD..."
  $RKUBECTL cp server/mechanic.db mechanic/$SERVER_POD:/app/db/mechanic.db
  echo "✅ Database synchronized!"
else
  echo "⚠️  No running server pod found! Make sure the deployment is active if you want to sync the DB."
fi

echo "🔄 Restarting pods to apply container updates..."
$RKUBECTL rollout restart deployment mechanic-server -n mechanic
$RKUBECTL rollout restart deployment mechanic-admin -n mechanic
if [ "$UPLOAD_ALL" = "true" ]; then
  $RKUBECTL rollout restart deployment video-bot -n mechanic
fi

echo "⏳ Waiting for rollouts to complete..."
$RKUBECTL rollout status deployment mechanic-server -n mechanic --timeout=120s
$RKUBECTL rollout status deployment mechanic-admin -n mechanic --timeout=120s
if [ "$UPLOAD_ALL" = "true" ]; then
  $RKUBECTL rollout status deployment video-bot -n mechanic --timeout=180s
fi

echo ""
echo "🔍 Verifying pods are running..."
$RKUBECTL get pods -n mechanic

echo ""
echo "🏥 Checking service health..."
sleep 3
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://minikube:3000/health 2>/dev/null || echo "000")
if [ "$SERVER_STATUS" = "200" ]; then
  echo "✅ mechanic-server health check passed (HTTP $SERVER_STATUS)"
else
  echo "⚠️  mechanic-server returned HTTP $SERVER_STATUS — pod may still be starting"
fi

echo ""
echo "🎉 Upload complete!"
