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

echo "📦 [2/2] Building and synchronizing Admin Portal container (linux/amd64)..."
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

echo "👀 Watching pod status (Press Ctrl+C to exit)..."
kubectl --kubeconfig=$KUBE_CONFIG get pods -n mechanic -w
