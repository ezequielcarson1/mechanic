---
description: Build the server and admin-portal Docker containers in Minikube and reload the pods
---

# Minikube Container Update Workflow

This workflow will build the latest source code into Docker images directly inside Minikube's Docker daemon, and then smoothly restart the Kubernetes pods so they pick up the new images.

## Supported Deployments
- **Server:** `mechanic-server` deployment (`mechanic-server:latest` image)
- **Admin Portal:** `mechanic-admin` deployment (`mechanic-admin-portal:latest` image)

## Steps

// turbo-all
1. Configure your terminal to use Minikube's Docker daemon:
```bash
eval $(minikube docker-env)
```

2. Build the **Server** Docker image:
```bash
cd /Users/ezequielcarson/Downloads/Mechanic/server && docker build -t mechanic-server:latest .
```

3. Build the **Admin Portal** Docker image:
```bash
cd /Users/ezequielcarson/Downloads/Mechanic/admin-portal && docker build -t mechanic-admin-portal:latest .
```

4. Restart the Kubernetes deployments to roll out the new images:
```bash
kubectl rollout restart deployment mechanic-server -n mechanic
kubectl rollout restart deployment mechanic-admin -n mechanic
```

5. Watch the pods restart to ensure everything is running correctly (press `Ctrl+C` to exit):
```bash
kubectl get pods -n mechanic -w
```
