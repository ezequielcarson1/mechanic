#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Remote Upload & Sync Process for Azure Minikube..."

# Variables for the remote server
REMOTE_USER="usuarioifx1"
REMOTE_HOST="20.124.131.193"
KUBE_CONFIG="$HOME/.kube/minikube-azure-config"

export KUBECONFIG=$KUBE_CONFIG
echo "🔌 Using remote Kubernetes config: $KUBECONFIG"

echo "📦 [1/2] Building and synchronizing Server container (linux/amd64)..."
cd server
docker build --platform linux/amd64 -t mechanic-server:latest .
cd ..

echo "   -> Saving and compressing Server image locally..."
docker save mechanic-server:latest | gzip > server-img.tar.gz

echo "   -> Uploading Server image to Azure ($REMOTE_HOST)..."
scp server-img.tar.gz $REMOTE_USER@$REMOTE_HOST:~/server-img.tar.gz

echo "   -> Loading Server image directly into remote Minikube container..."
# The remote Minikube is running inside a Docker container named 'minikube'.
# We decompress on the fly and load the image directly into its internal docker daemon.
ssh $REMOTE_USER@$REMOTE_HOST "gunzip -c ~/server-img.tar.gz | docker exec -i minikube docker load && rm ~/server-img.tar.gz"
rm server-img.tar.gz
echo "✅ Server image updated remotely!"

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
kubectl --kubeconfig=$KUBE_CONFIG apply -f k8s/video-bot-service.yaml
kubectl --kubeconfig=$KUBE_CONFIG apply -f k8s/video-bot-deployment.yaml

echo "📦 [3/3] Building and synchronizing Admin Portal container (linux/amd64)..."
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
# Find the currently running server pod
SERVER_POD=$(kubectl --kubeconfig=$KUBE_CONFIG get pods -n mechanic -l app=mechanic-server -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)

if [ -n "$SERVER_POD" ]; then
  echo "📥 Copying server/mechanic.db to pod $SERVER_POD..."
  kubectl --kubeconfig=$KUBE_CONFIG cp server/mechanic.db mechanic/$SERVER_POD:/app/db/mechanic.db
  echo "✅ Database synchronized!"
else
  echo "⚠️  No running server pod found! Make sure the deployment is active if you want to sync the DB."
fi

echo "🔄 Restarting pods to apply container updates..."
kubectl --kubeconfig=$KUBE_CONFIG rollout restart deployment mechanic-server -n mechanic
kubectl --kubeconfig=$KUBE_CONFIG rollout restart deployment mechanic-admin -n mechanic
kubectl --kubeconfig=$KUBE_CONFIG rollout restart deployment video-bot -n mechanic

echo "⏳ Waiting for rollouts to complete..."
kubectl --kubeconfig=$KUBE_CONFIG rollout status deployment mechanic-server -n mechanic --timeout=120s
kubectl --kubeconfig=$KUBE_CONFIG rollout status deployment mechanic-admin -n mechanic --timeout=120s
kubectl --kubeconfig=$KUBE_CONFIG rollout status deployment video-bot -n mechanic --timeout=180s

echo ""
echo "🔍 Verifying pods are running..."
kubectl --kubeconfig=$KUBE_CONFIG get pods -n mechanic

echo ""
echo "🏥 Checking service health..."
sleep 3
SERVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://20.124.131.193:3000/health 2>/dev/null || echo "000")
if [ "$SERVER_STATUS" = "200" ]; then
  echo "✅ mechanic-server health check passed (HTTP $SERVER_STATUS)"
else
  echo "⚠️  mechanic-server returned HTTP $SERVER_STATUS — pod may still be starting"
fi

echo ""
echo "🎉 Upload complete!"
